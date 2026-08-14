import { NextResponse, type NextRequest } from 'next/server'

import {
  QuoteKioskAuthorizationError,
  requireQuoteKiosk,
} from '@/lib/auth/kiosk-quote'
import { appointmentSubmissionSchema } from '@/lib/omega/appointment-request'
import {
  createAppointment,
  InvalidSchedulingRequestError,
  prepareAppointment,
} from '@/lib/omega/scheduling'

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const parsed = appointmentSubmissionSchema.safeParse(payload)

  if (!parsed.success) {
    return errorResponse(400, 'invalid_request', 'The appointment request is invalid.')
  }

  try {
    await requireQuoteKiosk(parsed.data.locationSlug)
    const preparedAppointment = prepareAppointment(parsed.data)
    const data = await createAppointment(parsed.data, preparedAppointment)

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof QuoteKioskAuthorizationError) {
      return errorResponse(
        401,
        'unauthorized',
        'This kiosk is not authorized for the requested location.',
      )
    }

    if (error instanceof InvalidSchedulingRequestError) {
      return errorResponse(
        400,
        'invalid_scheduling_request',
        'The selected scheduling option expired. Please choose it again.',
      )
    }

    console.error('Kiosk Omega appointment submission failed', {
      location: parsed.data.locationSlug,
      invoiceId: parsed.data.invoiceId,
      kind: error instanceof Error ? error.name : 'unexpected',
    })
    return errorResponse(
      500,
      'internal_error',
      'The appointment request could not be completed.',
    )
  }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}
