import { z } from 'zod'

const locationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/)
const entityIdSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/)
const nullableLabelSchema = z.string().trim().min(1).max(160).nullable()
const omegaQuoteGuidSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  .transform((value) => value.toUpperCase())
const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
  .nullable()
const ROCK_CHIP_POSITION = 'WSREPAIR'

const glassPositionByType = {
  windshield: 'W',
  driver_front: 'D_FRONT_LEFT',
  passenger_front: 'D_FRONT_RIGHT',
  driver_rear: 'D_REAR_LEFT',
  passenger_rear: 'D_REAR_RIGHT',
  driver_quarter: 'Q',
  passenger_quarter: 'Q',
  quarter: 'Q',
  vent: 'V',
  back: 'B',
} as const

const glassTypeSchema = z.enum(
  Object.keys(glassPositionByType) as [
    keyof typeof glassPositionByType,
    ...(keyof typeof glassPositionByType)[],
  ],
)
const glassPositionSchema = z.enum([
  'W',
  'D_FRONT_LEFT',
  'D_FRONT_RIGHT',
  'D_REAR_LEFT',
  'D_REAR_RIGHT',
  'Q',
  'V',
  'B',
])

export const appointmentRequestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('window'), token: z.string().min(20) }).strict(),
  z.object({ kind: z.literal('follow_up') }).strict(),
])

const customerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    phone: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .refine((value) => {
        const digits = value.replace(/\D/g, '').length
        return digits >= 10 && digits <= 15
      }),
    email: z.string().trim().email().max(254).nullable(),
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}$/),
    smsConsent: z.boolean(),
  })
  .strict()

const rockChipCustomerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    phone: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .refine((value) => {
        const digits = value.replace(/\D/g, '').length
        return digits >= 10 && digits <= 15
      }),
    email: z.string().trim().email().max(254).nullable(),
  })
  .strict()

const vehicleSchema = z
  .object({
    year: z
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .refine((value) => Number(value) >= 1900 && Number(value) <= 2100),
    makeId: entityIdSchema,
    makeLabel: z.string().trim().min(1).max(160),
    modelId: entityIdSchema,
    modelLabel: z.string().trim().min(1).max(160),
    modifierId: entityIdSchema.nullable(),
    modifierLabel: nullableLabelSchema,
    vehicleId: entityIdSchema,
    variantLabel: nullableLabelSchema,
    vin: vinSchema,
  })
  .strict()

const pricedGlassSchema = z
  .object({
    type: glassTypeSchema,
    position: glassPositionSchema,
  })
  .strict()
  .superRefine((glass, context) => {
    if (glass.position !== glassPositionByType[glass.type]) {
      context.addIssue({
        code: 'custom',
        path: ['position'],
        message: 'Glass position does not match the selected glass type',
      })
    }
  })

const glassSchema = z.union([
  pricedGlassSchema,
  z
    .object({
      type: z.enum(['sunroof', 'other']),
      position: z.null(),
    })
    .strict(),
])

export const quoteServiceSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('mobile'),
      address: z.string().trim().min(1).max(300),
      shopLocation: z.null(),
      appointmentRequest: appointmentRequestSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal('shop'),
      address: z.null(),
      shopLocation: locationSlugSchema,
      appointmentRequest: appointmentRequestSchema,
    })
    .strict(),
])

const windshieldPaymentSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('cash') }).strict(),
  z
    .object({
      mode: z.literal('insurance'),
      companyId: entityIdSchema,
      companyLabel: z.string().trim().min(1).max(160),
      pricingProfileId: entityIdSchema,
      policyNumber: z.string().trim().min(1).max(120),
      deductible: z.number().finite().nonnegative().nullable(),
    })
    .strict(),
])

const rockChipPaymentSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('cash') }).strict(),
  z.object({ mode: z.literal('insurance') }).strict(),
])

export const windshieldQuoteSubmissionSchema = z
  .object({
    locationSlug: locationSlugSchema,
    customer: customerSchema,
    vehicle: vehicleSchema,
    glass: glassSchema,
    payment: windshieldPaymentSchema,
  })
  .strict()

export const rockChipSubmissionSchema = z
  .object({
    serviceType: z.literal('rock_chip'),
    locationSlug: locationSlugSchema,
    customer: rockChipCustomerSchema,
    vehicle: vehicleSchema,
    payment: rockChipPaymentSchema,
  })
  .strict()

export const quoteSubmissionSchema = z.union([
  windshieldQuoteSubmissionSchema,
  rockChipSubmissionSchema,
])

export type ValidatedWindshieldQuoteSubmission = z.infer<
  typeof windshieldQuoteSubmissionSchema
>
export type ValidatedRockChipSubmission = z.infer<
  typeof rockChipSubmissionSchema
>
export type ValidatedQuoteSubmission = z.infer<typeof quoteSubmissionSchema>
export type SupportedGlassType = keyof typeof glassPositionByType
export type SupportedGlassPosition =
  (typeof glassPositionByType)[SupportedGlassType]

export function getServerGlassPosition(type: SupportedGlassType) {
  return glassPositionByType[type]
}

export function requiresCashQuoteResult(
  paymentMode: ValidatedQuoteSubmission['payment']['mode'],
) {
  return paymentMode === 'cash'
}

export function buildOmegaQuoteRequest(
  input: ValidatedWindshieldQuoteSubmission,
) {
  if (input.glass.type === 'sunroof' || input.glass.type === 'other') {
    throw new Error('Manual quote leads do not use the Quotes endpoint')
  }

  const position = getServerGlassPosition(input.glass.type)
  const query = new URLSearchParams({
    year: input.vehicle.year,
    make: input.vehicle.makeId,
    model: input.vehicle.modelId,
    vehicle_id: input.vehicle.vehicleId,
    position,
    customer_zip: input.customer.zip,
    customer_fname: input.customer.firstName,
    customer_phone: input.customer.phone,
    customer_sms: input.customer.smsConsent ? '1' : '0',
    folder: 'pag',
    smart: 'true',
  })

  if (input.customer.email) {
    query.set('customer_email', input.customer.email)
  }

  if (input.payment.mode === 'cash') {
    query.set('campaign', 'WEB QUOTE')
    query.set('lead_type', 'web_lead')
  } else {
    if (input.vehicle.vin) {
      query.set('vehicle_vin', input.vehicle.vin)
    }

    query.set('campaign', 'Ins Web Quote')
    query.set('account_company_id', input.payment.companyId)
    query.set('account_policy_no', input.payment.policyNumber)

    if (input.payment.deductible !== null) {
      query.set('account_deductible', String(input.payment.deductible))
    }
  }

  return {
    path: `/Quotes/${encodeURIComponent(input.vehicle.vehicleId)}/${encodeURIComponent(position)}`,
    position,
    query,
  }
}

export function buildOmegaQuoteCompletionRequest(
  input: ValidatedWindshieldQuoteSubmission,
  guid: string,
) {
  if (input.payment.mode !== 'cash') {
    throw new Error('Only cash quotes use the completion request')
  }

  const request = buildOmegaQuoteRequest(input)
  const normalizedGuid = omegaQuoteGuidSchema.parse(guid)

  request.query.set('vehicle_plate_no', '')
  request.query.set('vehicle_plate_state', '')
  request.query.set('opening', request.position)
  request.query.set('medium', 'web_quote')
  request.query.set('guid', normalizedGuid)
  request.query.set('vehicle_vin', input.vehicle.vin ?? '')
  request.query.append('smart', '')

  return request
}

export function buildOmegaRockChipRequest(input: ValidatedRockChipSubmission) {
  const position = ROCK_CHIP_POSITION
  const query = new URLSearchParams({
    position,
    customer_fname: input.customer.firstName,
    customer_phone: input.customer.phone,
    folder: 'pag',
    smart: 'true',
    lead_type: 'web_lead',
  })

  if (input.payment.mode === 'cash') {
    query.set('campaign', 'Rock Chip Web Quote')
  }

  if (input.customer.email) {
    query.set('customer_email', input.customer.email)
  }

  return {
    path: `/Quotes/${encodeURIComponent(input.vehicle.vehicleId)}/${position}`,
    position,
    query,
  }
}

export function isRockChipSubmission(
  input: ValidatedQuoteSubmission,
): input is ValidatedRockChipSubmission {
  return 'serviceType' in input && input.serviceType === 'rock_chip'
}
