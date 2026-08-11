import { z } from 'zod'

import { quoteSubmissionResultSchema } from '@/lib/omega/quote-result'
import type { QuoteSubmissionResult } from '@/lib/omega/quote-types'

import type { QuoteSubmission } from './types'

const quoteSuccessSchema = z
  .object({ data: quoteSubmissionResultSchema })
  .strict()
const quoteErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .strict(),
  })
  .strict()

export class KioskQuoteSubmissionError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'KioskQuoteSubmissionError'
  }
}

export async function submitKioskOmegaQuote(
  input: QuoteSubmission,
  signal?: AbortSignal,
): Promise<QuoteSubmissionResult> {
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
