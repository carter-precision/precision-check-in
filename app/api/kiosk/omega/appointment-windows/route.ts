import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  QuoteKioskAuthorizationError,
  requireQuoteKiosk,
} from '@/lib/auth/kiosk-quote'
import { OmegaLocationConfigurationError } from '@/lib/omega/location-config'
import { QuoteOmegaApiError } from '@/lib/omega/quote-client'
import {
  getAppointmentAvailability,
  InvalidSchedulingRequestError,
} from '@/lib/omega/scheduling'
import { OmegaSchedulingContractError } from '@/lib/omega/scheduling-contracts'

const querySchema = z
  .object({
    location: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/),
    mode: z.enum(['mobile', 'shop']),
    shopLocation: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.mode === 'shop' && !query.shopLocation) {
      context.addIssue({
        code: 'custom',
        path: ['shopLocation'],
        message: 'Shop location is required',
      })
    }
  })

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  )

  if (!query.success) {
    return errorResponse(400, 'invalid_request', 'The request is invalid.')
  }

  try {
    await requireQuoteKiosk(query.data.location)
    const data = await getAppointmentAvailability({
      kioskLocationSlug: query.data.location,
      serviceMode: query.data.mode,
      shopLocation: query.data.shopLocation ?? null,
      postalCode: query.data.postalCode,
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof QuoteKioskAuthorizationError) {
      return errorResponse(
        401,
        'unauthorized',
        'This kiosk is not authorized for the requested location.',
      )
    }

    if (error instanceof InvalidSchedulingRequestError) {
      return errorResponse(
        404,
        'no_results',
        'No scheduling location is available for those details.',
      )
    }

    if (
      error instanceof OmegaSchedulingContractError ||
      error instanceof OmegaLocationConfigurationError
    ) {
      logFailure(error.name)
      return errorResponse(
        502,
        'invalid_omega_response',
        'Scheduling options are temporarily unavailable.',
      )
    }

    if (error instanceof QuoteOmegaApiError) {
      logFailure(error.kind, error.status)
      return errorResponse(
        error.kind === 'not_found' ? 404 : 503,
        error.kind === 'not_found' ? 'no_results' : 'omega_unavailable',
        'Scheduling options are temporarily unavailable.',
      )
    }

    logFailure('unexpected')
    return errorResponse(
      500,
      'internal_error',
      'Scheduling options could not be loaded.',
    )
  }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function logFailure(kind: string, omegaStatus: number | null = null) {
  console.error('Kiosk Omega scheduling lookup failed', { kind, omegaStatus })
}
