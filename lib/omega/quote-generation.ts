import 'server-only'

import {
  getQuoteInsuranceCompanies,
  getQuoteVehicleVariants,
} from './quote-lookups'
import { QuoteOmegaApiError, quoteOmegaHtmlRequest } from './quote-client'
import { classifyOmegaQuoteHtml } from './quote-invoice'
import { extractQuoteInvoiceId } from './quote-invoice'
import {
  buildOmegaQuoteCompletionRequest,
  buildOmegaQuoteRequest,
  requiresCashQuoteResult,
  type ValidatedQuoteSubmission,
} from './quote-request'
import type { QuoteResult } from './quote-types'

type GeneratedQuoteResult =
  Omit<QuoteResult, 'scheduling'> | { kind: 'insurance_acknowledgement' }

export type QuoteGenerationStage =
  | 'reference_validation'
  | 'quotes_request'
  | 'quote_completion'
  | 'quote_result_extraction'

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
): Promise<GeneratedQuoteResult> {
  await verifyQuoteReferences(input)

  const omegaRequest = buildOmegaQuoteRequest(input)
  let html: string

  try {
    html = await quoteOmegaHtmlRequest(omegaRequest.path, omegaRequest.query)
  } catch (error) {
    throw wrapOmegaError('quotes_request', error, null)
  }

  if (!requiresCashQuoteResult(input.payment.mode)) {
    const invoiceId = extractQuoteInvoiceId(html)
    if (invoiceId) onInvoiceId(invoiceId)
    return { kind: 'insurance_acknowledgement' }
  }

  const initialResult = classifyOmegaQuoteHtml(html)
  let result = initialResult.kind === 'final' ? initialResult : null

  if (initialResult.kind === 'bootstrap') {
    const completionRequest = buildOmegaQuoteCompletionRequest(
      input,
      initialResult.guid,
    )
    let completedHtml: string

    try {
      completedHtml = await quoteOmegaHtmlRequest(
        completionRequest.path,
        completionRequest.query,
      )
    } catch (error) {
      throw wrapOmegaError('quote_completion', error, null)
    }

    const completedResult = classifyOmegaQuoteHtml(completedHtml)
    result = completedResult.kind === 'final' ? completedResult : null
  }

  if (!result) {
    throw new QuoteGenerationError(
      'quote_result_extraction',
      'invalid_response',
      null,
      null,
    )
  }

  onInvoiceId(result.invoiceId)
  return { invoiceId: result.invoiceId, total: result.total }
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
