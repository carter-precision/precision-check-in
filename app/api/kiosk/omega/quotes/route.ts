import { NextResponse, type NextRequest } from 'next/server'

import {
  QuoteKioskAuthorizationError,
  requireQuoteKiosk,
} from '@/lib/auth/kiosk-quote'
import {
  generateOmegaQuote,
  InvalidQuoteReferenceError,
  QuoteGenerationError,
  recoverOmegaQuote,
  type QuoteGenerationStage,
} from '@/lib/omega/quote-generation'
import {
  getServerGlassPosition,
  quoteRouteRequestSchema,
} from '@/lib/omega/quote-request'
import {
  createQuoteRecoveryToken,
  verifyQuoteRecoveryToken,
} from '@/lib/omega/quote-recovery'

type QuoteOperationContext = {
  requestId: string
  stage: 'request_validation' | 'authorization' | QuoteGenerationStage
  location: string | null
  vehicleId: string | null
  position: string | null
  paymentMode: 'cash' | 'insurance' | null
  omegaStatus: number | null
  invoiceId: string | null
}

export async function POST(request: NextRequest) {
  const context: QuoteOperationContext = {
    requestId: crypto.randomUUID(),
    stage: 'request_validation',
    location: null,
    vehicleId: null,
    position: null,
    paymentMode: null,
    omegaStatus: null,
    invoiceId: null,
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return quoteErrorResponse(
      400,
      'invalid_request',
      'The quote request is invalid.',
    )
  }

  const parsed = quoteRouteRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return quoteErrorResponse(
      400,
      'invalid_request',
      'The quote request is invalid.',
    )
  }

  context.stage = 'authorization'

  try {
    const kiosk = await requireQuoteKiosk(parsed.data.locationSlug)
    context.location = kiosk.locationSlug
    let result

    if ('invoiceId' in parsed.data) {
      context.stage = 'invoice_fetch'
      context.invoiceId = parsed.data.invoiceId

      if (
        !verifyQuoteRecoveryToken(
          parsed.data.recoveryToken,
          kiosk.locationSlug,
          parsed.data.invoiceId,
        )
      ) {
        return quoteErrorResponse(
          400,
          'invalid_recovery',
          'The quote recovery request is invalid or expired.',
        )
      }

      result = await recoverOmegaQuote(parsed.data.invoiceId)
    } else {
      context.vehicleId = parsed.data.vehicle.vehicleId
      context.position = getServerGlassPosition(parsed.data.glass.type)
      context.paymentMode = parsed.data.payment.mode
      result = await generateOmegaQuote(parsed.data, (invoiceId) => {
        context.invoiceId = invoiceId
      })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof QuoteKioskAuthorizationError) {
      return quoteErrorResponse(
        401,
        'unauthorized',
        'This kiosk is not authorized for the requested location.',
      )
    }

    if (error instanceof InvalidQuoteReferenceError) {
      context.stage = 'reference_validation'
      logQuoteFailure(context, 'invalid_reference')
      return quoteErrorResponse(
        400,
        'invalid_quote_reference',
        'The selected vehicle or insurance company is no longer available.',
      )
    }

    if (error instanceof QuoteGenerationError) {
      context.stage = error.stage
      context.omegaStatus = error.omegaStatus
      context.invoiceId = error.invoiceId ?? context.invoiceId
      logQuoteFailure(context, error.kind)

      if (error.stage === 'invoice_fetch') {
        const recoveryToken =
          context.location && context.invoiceId
            ? createQuoteRecoveryToken(context.location, context.invoiceId)
            : null

        return quoteErrorResponse(
          503,
          'invoice_unavailable',
          'The quote was created, but its pricing details are temporarily unavailable.',
          context.invoiceId,
          recoveryToken,
        )
      }

      if (
        error.stage === 'invoice_id_extraction' ||
        error.stage === 'invoice_normalization' ||
        error.kind === 'invalid_response'
      ) {
        return quoteErrorResponse(
          502,
          'invalid_omega_response',
          'The quote service returned an invalid response.',
        )
      }

      return quoteErrorResponse(
        503,
        'omega_unavailable',
        'The quote service is temporarily unavailable.',
      )
    }

    logQuoteFailure(context, 'unexpected')
    return quoteErrorResponse(
      500,
      'internal_error',
      'The quote could not be completed.',
    )
  }
}

function quoteErrorResponse(
  status: number,
  code: string,
  message: string,
  invoiceId?: string | null,
  recoveryToken?: string | null,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(invoiceId ? { invoiceId } : {}),
        ...(recoveryToken ? { recoveryToken } : {}),
      },
    },
    { status },
  )
}

function logQuoteFailure(context: QuoteOperationContext, kind: string) {
  console.error('Kiosk Omega quote failed', {
    requestId: context.requestId,
    stage: context.stage,
    location: context.location,
    vehicleId: context.vehicleId,
    position: context.position,
    paymentMode: context.paymentMode,
    omegaStatus: context.omegaStatus,
    invoiceId: context.invoiceId,
    kind,
  })
}
