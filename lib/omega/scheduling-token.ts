import 'server-only'

import crypto from 'node:crypto'
import { z } from 'zod'

const TOKEN_TTL_SECONDS = 30 * 60

const schedulingTokenPayloadSchema = z
  .object({
    version: z.literal(1),
    kioskLocationSlug: z.string().regex(/^[a-z0-9-]+$/),
    serviceMode: z.enum(['mobile', 'shop']),
    routingKey: z.string().min(1).max(40),
    omegaLocationId: z.string().regex(/^[1-9]\d*$/),
    omegaLocationLabel: z.string().min(1).max(160),
    kind: z.enum(['window', 'flexible']),
    startTime: z.number().int().positive().nullable(),
    endTime: z.number().int().positive().nullable(),
    windowLabel: z.string().min(1).max(160).nullable(),
    expiresAt: z.number().int().positive(),
  })
  .strict()
  .superRefine((payload, context) => {
    const hasWindow =
      payload.startTime !== null &&
      payload.endTime !== null &&
      payload.windowLabel !== null

    if (payload.kind === 'window' && !hasWindow) {
      context.addIssue({
        code: 'custom',
        message: 'Window details are missing',
      })
    }

    if (
      payload.kind === 'flexible' &&
      (payload.startTime !== null ||
        payload.endTime !== null ||
        payload.windowLabel !== null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Flexible token has a window',
      })
    }

    if (
      payload.startTime !== null &&
      payload.endTime !== null &&
      payload.endTime <= payload.startTime
    ) {
      context.addIssue({ code: 'custom', message: 'Window end is invalid' })
    }
  })

export type SchedulingTokenPayload = z.infer<
  typeof schedulingTokenPayloadSchema
>

export class SchedulingTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchedulingTokenError'
  }
}

export function createSchedulingToken(
  payload: Omit<SchedulingTokenPayload, 'version' | 'expiresAt'>,
) {
  const completePayload: SchedulingTokenPayload = {
    ...payload,
    version: 1,
    expiresAt: Math.floor(Date.now() / 1_000) + TOKEN_TTL_SECONDS,
  }
  const encodedPayload = Buffer.from(
    JSON.stringify(completePayload),
    'utf8',
  ).toString('base64url')
  const signature = sign(encodedPayload)

  return `${encodedPayload}.${signature}`
}

export function readSchedulingToken(token: string) {
  const [encodedPayload, suppliedSignature, extra] = token.split('.')

  if (!encodedPayload || !suppliedSignature || extra) {
    throw new SchedulingTokenError('Scheduling token is malformed')
  }

  const expectedSignature = sign(encodedPayload)
  const supplied = Buffer.from(suppliedSignature, 'base64url')
  const expected = Buffer.from(expectedSignature, 'base64url')

  if (
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    throw new SchedulingTokenError('Scheduling token is invalid')
  }

  let decoded: unknown

  try {
    decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString())
  } catch {
    throw new SchedulingTokenError('Scheduling token payload is invalid')
  }

  const parsed = schedulingTokenPayloadSchema.safeParse(decoded)

  if (
    !parsed.success ||
    parsed.data.expiresAt < Math.floor(Date.now() / 1_000)
  ) {
    throw new SchedulingTokenError('Scheduling token has expired')
  }

  return parsed.data
}

function sign(value: string) {
  return crypto
    .createHmac('sha256', schedulingSecret())
    .update(value)
    .digest('base64url')
}

function schedulingSecret() {
  const secret =
    process.env.OMEGA_SCHEDULING_SECRET?.trim() ||
    process.env.CHECK_IN_PROOF_SECRET?.trim()

  if (!secret || secret.length < 32) {
    throw new SchedulingTokenError('OMEGA_SCHEDULING_SECRET is not configured')
  }

  return secret
}
