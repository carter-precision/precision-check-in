import { z } from 'zod'

import type { SchedulingResult } from '@/lib/omega/quote-types'

import type { WindshieldAppointmentSubmission } from './types'

const successSchema = z
  .object({
    data: z
      .object({ status: z.enum(['held', 'needs_follow_up']) })
      .strict(),
  })
  .strict()

const errorSchema = z
  .object({
    error: z
      .object({ code: z.string(), message: z.string() })
      .strict(),
  })
  .strict()

export class KioskAppointmentSubmissionError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'KioskAppointmentSubmissionError'
  }
}

export async function submitKioskOmegaAppointment(
  input: WindshieldAppointmentSubmission,
): Promise<SchedulingResult> {
  let response: Response

  try {
    response = await fetch('/api/kiosk/omega/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    })
  } catch {
    throw new KioskAppointmentSubmissionError(
      "We couldn't reach the scheduling service. Please try again.",
      'network_error',
    )
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const parsedError = errorSchema.safeParse(payload)
    throw new KioskAppointmentSubmissionError(
      parsedError.success
        ? parsedError.data.error.message
        : "We couldn't schedule your service. Please try again.",
      parsedError.success ? parsedError.data.error.code : 'invalid_error_response',
    )
  }

  const parsed = successSchema.safeParse(payload)
  if (!parsed.success) {
    throw new KioskAppointmentSubmissionError(
      'The scheduling service returned an invalid result.',
      'invalid_success_response',
    )
  }

  return parsed.data.data
}
