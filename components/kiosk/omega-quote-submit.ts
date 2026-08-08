import { z } from 'zod'

import { quoteResultSchema } from '@/lib/omega/quote-result'
import type { QuoteResult } from '@/lib/omega/quote-types'

import type { QuoteSubmission } from './types'

export type KioskQuoteRecoveryRequest = {
  locationSlug: string
  invoiceId: string
  recoveryToken: string
}

const quoteSuccessSchema = z.object({ data: quoteResultSchema }).strict()
const quoteErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        invoiceId: z.string().optional(),
        recoveryToken: z.string().optional(),
      })
      .strict(),
  })
  .strict()

export class KioskQuoteSubmissionError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly invoiceId: string | null = null,
    readonly recoveryToken: string | null = null,
  ) {
    super(message)
    this.name = 'KioskQuoteSubmissionError'
  }
}

export async function submitKioskOmegaQuote(
  input: QuoteSubmission | KioskQuoteRecoveryRequest,
  signal?: AbortSignal,
): Promise<QuoteResult> {
  let response: Response

  try {
    response = await fetch('/api/kiosk/omega/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
      signal,
    })
  } catch {
    throw new KioskQuoteSubmissionError(
      "We couldn't reach the quote service. Please try again.",
      'network_error',
    )
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const parsedError = quoteErrorSchema.safeParse(payload)

    if (parsedError.success) {
      throw new KioskQuoteSubmissionError(
        parsedError.data.error.message,
        parsedError.data.error.code,
        parsedError.data.error.invoiceId ?? null,
        parsedError.data.error.recoveryToken ?? null,
      )
    }

    throw new KioskQuoteSubmissionError(
      "We couldn't complete your quote. Please try again.",
      'invalid_error_response',
    )
  }

  const parsed = quoteSuccessSchema.safeParse(payload)

  if (!parsed.success) {
    throw new KioskQuoteSubmissionError(
      'The quote service returned an invalid result. Please ask our team for help.',
      'invalid_success_response',
    )
  }

  return parsed.data.data
}
