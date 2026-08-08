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
const vinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
  .nullable()

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

const glassSchema = z
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

const serviceSchema = z.discriminatedUnion('mode', [
  z
    .object({
      mode: z.literal('mobile'),
      address: z.string().trim().min(1).max(300),
      shopLocation: z.null(),
      preferredDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    })
    .strict(),
  z
    .object({
      mode: z.literal('shop'),
      address: z.null(),
      shopLocation: locationSlugSchema,
      preferredDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
    })
    .strict(),
])

const paymentSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('cash') }).strict(),
  z
    .object({
      mode: z.literal('insurance'),
      companyId: entityIdSchema,
      companyLabel: z.string().trim().min(1).max(160),
      policyNumber: z.string().trim().min(1).max(120),
      deductible: z.number().finite().nonnegative(),
    })
    .strict(),
])

export const quoteSubmissionSchema = z
  .object({
    locationSlug: locationSlugSchema,
    customer: customerSchema,
    vehicle: vehicleSchema,
    glass: glassSchema,
    service: serviceSchema,
    payment: paymentSchema,
  })
  .strict()

export const quoteRecoveryRequestSchema = z
  .object({
    locationSlug: locationSlugSchema,
    invoiceId: entityIdSchema,
    recoveryToken: z
      .string()
      .trim()
      .regex(/^\d+\.[A-Za-z0-9_-]+$/),
  })
  .strict()

export const quoteRouteRequestSchema = z.union([
  quoteSubmissionSchema,
  quoteRecoveryRequestSchema,
])

export type ValidatedQuoteSubmission = z.infer<typeof quoteSubmissionSchema>
export type QuoteRecoveryRequest = z.infer<typeof quoteRecoveryRequestSchema>
export type SupportedGlassType = keyof typeof glassPositionByType
export type SupportedGlassPosition =
  (typeof glassPositionByType)[SupportedGlassType]

export function getServerGlassPosition(type: SupportedGlassType) {
  return glassPositionByType[type]
}

export function buildOmegaQuoteRequest(input: ValidatedQuoteSubmission) {
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

  if (input.vehicle.vin) {
    query.set('vehicle_vin', input.vehicle.vin)
  }

  if (input.payment.mode === 'cash') {
    query.set('opening', position)
    query.set('medium', 'web_quote')
    query.set('campaign', 'WEB QUOTE')
  } else {
    query.set('campaign', 'Ins Web Quote')
    query.set('account_company_id', input.payment.companyId)
    query.set('account_policy_no', input.payment.policyNumber)
    query.set('account_deductible', String(input.payment.deductible))
  }

  return {
    path: `/Quotes/${encodeURIComponent(input.vehicle.vehicleId)}/${encodeURIComponent(position)}`,
    position,
    query,
  }
}
