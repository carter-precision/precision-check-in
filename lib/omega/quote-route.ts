import 'server-only'

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import {
  QuoteKioskAuthorizationError,
  requireQuoteKiosk,
} from '@/lib/auth/kiosk-quote'

import { QuoteOmegaApiError } from './quote-client'
import { OmegaQuoteContractError } from './quote-contracts'

export const locationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/)

export const vehicleYearQuerySchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/)
  .refine((value) => Number(value) >= 1900 && Number(value) <= 2100)

export const omegaEntityIdQuerySchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/)

export const vinQuerySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/)

type QuoteLookupOperation =
  | 'vehicle_years'
  | 'vehicle_makes'
  | 'vehicle_models'
  | 'vehicle_variants'
  | 'vehicle_vin'
  | 'insurance_companies'
  | 'insurance_company'

export function readQuoteQuery(request: NextRequest) {
  const values: Record<string, string | string[]> = {}

  for (const [key, value] of request.nextUrl.searchParams) {
    const current = values[key]

    if (current === undefined) {
      values[key] = value
    } else {
      values[key] = Array.isArray(current)
        ? [...current, value]
        : [current, value]
    }
  }

  return values
}

export function invalidQuoteRequestResponse() {
  return quoteErrorResponse(
    400,
    'invalid_request',
    'The lookup request is invalid.',
  )
}

export async function executeQuoteLookup<TResult>(
  operation: QuoteLookupOperation,
  locationSlug: string,
  lookup: () => Promise<TResult>,
) {
  try {
    await requireQuoteKiosk(locationSlug)
    const data = await lookup()

    if (data === null || (Array.isArray(data) && data.length === 0)) {
      return quoteErrorResponse(
        404,
        'no_results',
        'No matching options were found.',
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof QuoteKioskAuthorizationError) {
      return quoteErrorResponse(
        401,
        'unauthorized',
        'This kiosk is not authorized for the requested location.',
      )
    }

    if (error instanceof OmegaQuoteContractError) {
      logQuoteLookupFailure(operation, 'invalid_response')
      return quoteErrorResponse(
        502,
        'invalid_omega_response',
        'Vehicle and insurance lookup is temporarily unavailable.',
      )
    }

    if (error instanceof QuoteOmegaApiError) {
      logQuoteLookupFailure(operation, error.kind, error.status)

      if (error.kind === 'not_found') {
        return quoteErrorResponse(
          404,
          'no_results',
          'No matching options were found.',
        )
      }

      if (error.kind === 'invalid_response') {
        return quoteErrorResponse(
          502,
          'invalid_omega_response',
          'Vehicle and insurance lookup is temporarily unavailable.',
        )
      }

      return quoteErrorResponse(
        503,
        'omega_unavailable',
        'Vehicle and insurance lookup is temporarily unavailable.',
      )
    }

    logQuoteLookupFailure(operation, 'unexpected')
    return quoteErrorResponse(
      500,
      'internal_error',
      'The lookup could not be completed.',
    )
  }
}

function quoteErrorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status })
}

function logQuoteLookupFailure(
  operation: QuoteLookupOperation,
  kind: string,
  omegaStatus: number | null = null,
) {
  console.error('Kiosk Omega lookup failed', {
    operation,
    kind,
    omegaStatus,
  })
}
