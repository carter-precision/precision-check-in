import { z } from 'zod'

const schedulingResultSchema = z
  .object({ status: z.enum(['held', 'needs_follow_up']) })
  .strict()

export const quoteResultSchema = z
  .object({
    invoiceId: z.string().regex(/^[1-9]\d*$/),
    total: z.number().finite().positive(),
    scheduling: schedulingResultSchema,
  })
  .strict()

export const insuranceQuoteAcknowledgementSchema = z
  .object({
    kind: z.literal('insurance_acknowledgement'),
    scheduling: schedulingResultSchema,
  })
  .strict()

export const rockChipAcknowledgementSchema = z
  .object({
    kind: z.literal('rock_chip_acknowledgement'),
    scheduling: schedulingResultSchema,
  })
  .strict()

export const quoteSubmissionResultSchema = z.union([
  quoteResultSchema,
  insuranceQuoteAcknowledgementSchema,
  rockChipAcknowledgementSchema,
])
