import { z } from 'zod'

export const quoteResultSchema = z
  .object({
    invoiceId: z.string().regex(/^[1-9]\d*$/),
    total: z.number().finite().positive(),
  })
  .strict()

export const insuranceQuoteAcknowledgementSchema = z
  .object({ kind: z.literal('insurance_acknowledgement') })
  .strict()

export const quoteSubmissionResultSchema = z.union([
  quoteResultSchema,
  insuranceQuoteAcknowledgementSchema,
])
