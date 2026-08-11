import { z } from 'zod'

export const quoteResultSchema = z
  .object({
    invoiceId: z.string().regex(/^[1-9]\d*$/),
    subtotal: z.number().finite().nonnegative().nullable(),
    tax: z.number().finite().nonnegative(),
    total: z.number().finite().positive(),
    locationId: z.string().min(1).nullable(),
    pricingProfileId: z.string().min(1).nullable(),
    items: z
      .array(
        z
          .object({
            sku: z.string().min(1).nullable(),
            description: z.string().trim().min(1),
            price: z.number().finite(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()

export const insuranceQuoteAcknowledgementSchema = z
  .object({ kind: z.literal('insurance_acknowledgement') })
  .strict()

export const quoteSubmissionResultSchema = z.union([
  quoteResultSchema,
  insuranceQuoteAcknowledgementSchema,
])
