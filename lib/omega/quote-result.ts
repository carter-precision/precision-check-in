import { z } from 'zod'

export const quoteResultSchema = z
  .object({
    invoiceId: z.string().regex(/^[1-9]\d*$/),
    total: z.number().finite().positive(),
  })
  .strict()

export const insuranceQuoteAcknowledgementSchema = z
  .object({
    kind: z.literal('insurance_acknowledgement'),
    invoiceId: z.string().regex(/^[1-9]\d*$/),
  })
  .strict()

export const rockChipAcknowledgementSchema = z
  .object({
    kind: z.literal('rock_chip_acknowledgement'),
  })
  .strict()

export const manualQuoteLeadAcknowledgementSchema = z
  .object({
    kind: z.literal('manual_quote_lead_acknowledgement'),
    invoiceId: z.string().regex(/^[1-9]\d*$/),
  })
  .strict()

export const quoteSubmissionResultSchema = z.union([
  quoteResultSchema,
  insuranceQuoteAcknowledgementSchema,
  rockChipAcknowledgementSchema,
  manualQuoteLeadAcknowledgementSchema,
])
