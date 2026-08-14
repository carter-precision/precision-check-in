import { z } from 'zod'

import { quoteServiceSchema } from './quote-request'

const locationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/)

export const appointmentSubmissionSchema = z
  .object({
    locationSlug: locationSlugSchema,
    invoiceId: z.string().trim().regex(/^[1-9]\d*$/),
    postalCode: z.string().trim().regex(/^\d{5}$/),
    service: quoteServiceSchema,
  })
  .strict()

export type ValidatedAppointmentSubmission = z.infer<
  typeof appointmentSubmissionSchema
>
