import 'server-only'

import {
  getQuoteInsuranceCompanies,
  getQuoteVehicleVariants,
} from './quote-lookups'
import {
  QuoteOmegaApiError,
  quoteOmegaHtmlRequest,
  quoteOmegaJsonRequest,
} from './quote-client'
import {
  extractQuoteInvoiceId,
  normalizeQuoteInvoice,
  OmegaQuoteInvoiceContractError,
} from './quote-invoice'
import { retryQuoteInvoiceGet } from './quote-invoice-retry'
import {
  buildOmegaQuoteRequest,
  type ValidatedQuoteSubmission,
} from './quote-request'
import type { QuoteResult } from './quote-types'

export type QuoteGenerationStage =
  | 'reference_validation'
  | 'quotes_request'
  | 'invoice_id_extraction'
  | 'invoice_fetch'
  | 'invoice_normalization'

export class InvalidQuoteReferenceError extends Error {
  constructor() {
    super('Submitted quote identifiers could not be verified')
    this.name = 'InvalidQuoteReferenceError'
  }
}

export class QuoteGenerationError extends Error {
  constructor(
    readonly stage: QuoteGenerationStage,
    readonly kind: 'omega' | 'invalid_response',
    readonly omegaStatus: number | null,
    readonly invoiceId: string | null,
  ) {
    super(`Omega quote generation failed during ${stage}`)
    this.name = 'QuoteGenerationError'
  }
}

export async function generateOmegaQuote(
  input: ValidatedQuoteSubmission,
  onInvoiceId: (invoiceId: string) => void,
): Promise<QuoteResult> {
  await verifyQuoteReferences(input)

  const omegaRequest = buildOmegaQuoteRequest(input)
  let html: string

  try {
    html = await quoteOmegaHtmlRequest(omegaRequest.path, omegaRequest.query)
  } catch (error) {
    throw wrapOmegaError('quotes_request', error, null)
  }

  const invoiceId = extractQuoteInvoiceId(html)

  if (!invoiceId) {
    throw new QuoteGenerationError(
      'invoice_id_extraction',
      'invalid_response',
      null,
      null,
    )
  }

  onInvoiceId(invoiceId)
  return recoverOmegaQuote(invoiceId)
}

export async function recoverOmegaQuote(
  invoiceId: string,
): Promise<QuoteResult> {
  const invoicePayload = await fetchQuoteInvoiceWithRetry(invoiceId)

  try {
    return normalizeQuoteInvoice(invoicePayload, invoiceId)
  } catch (error) {
    if (error instanceof OmegaQuoteInvoiceContractError) {
      throw new QuoteGenerationError(
        'invoice_normalization',
        'invalid_response',
        null,
        invoiceId,
      )
    }

    throw error
  }
}

async function verifyQuoteReferences(input: ValidatedQuoteSubmission) {
  try {
    const variants = await getQuoteVehicleVariants(
      input.vehicle.year,
      input.vehicle.makeId,
      input.vehicle.modelId,
      input.vehicle.modifierId,
    )

    if (
      !variants.some((variant) => variant.vehicleId === input.vehicle.vehicleId)
    ) {
      throw new InvalidQuoteReferenceError()
    }

    if (input.payment.mode === 'insurance') {
      const companyId = input.payment.companyId
      const companies = await getQuoteInsuranceCompanies()

      if (!companies.some((company) => company.id === companyId)) {
        throw new InvalidQuoteReferenceError()
      }
    }
  } catch (error) {
    if (error instanceof InvalidQuoteReferenceError) throw error
    throw wrapOmegaError('reference_validation', error, null)
  }
}

async function fetchQuoteInvoiceWithRetry(invoiceId: string) {
  try {
    return await retryQuoteInvoiceGet(
      () => quoteOmegaJsonRequest(`/Invoices/${encodeURIComponent(invoiceId)}`),
      isRetryableInvoiceError,
      (failedAttempt) => wait(failedAttempt * 150),
    )
  } catch (error) {
    throw wrapOmegaError('invoice_fetch', error, invoiceId)
  }
}

function isRetryableInvoiceError(error: unknown) {
  return (
    error instanceof QuoteOmegaApiError &&
    (error.kind === 'not_found' || error.kind === 'unavailable')
  )
}

function wrapOmegaError(
  stage: QuoteGenerationStage,
  error: unknown,
  invoiceId: string | null,
) {
  if (error instanceof QuoteOmegaApiError) {
    return new QuoteGenerationError(
      stage,
      error.kind === 'invalid_response' ? 'invalid_response' : 'omega',
      error.status,
      invoiceId,
    )
  }

  return new QuoteGenerationError(stage, 'invalid_response', null, invoiceId)
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}
