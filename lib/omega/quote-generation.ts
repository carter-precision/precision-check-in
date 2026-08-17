import 'server-only'

import { z } from 'zod'

import {
  getQuoteInsuranceCompanies,
  getQuoteVehicleVariants,
} from './quote-lookups'
import { buildOmegaManualQuoteInvoicePayload } from './invoice-request'
import { getOmegaLocationId } from './location-config'
import {
  QuoteOmegaApiError,
  quoteOmegaHtmlRequest,
  quoteOmegaJsonPost,
} from './quote-client'
import { classifyOmegaQuoteHtml } from './quote-invoice'
import { extractQuoteInvoiceId } from './quote-invoice'
import {
  buildOmegaQuoteCompletionRequest,
  buildOmegaQuoteRequest,
  buildOmegaRockChipRequest,
  requiresCashQuoteResult,
  type ValidatedRockChipSubmission,
  type ValidatedWindshieldQuoteSubmission,
} from './quote-request'
import type { QuoteResult } from './quote-types'

type GeneratedQuoteResult =
  | QuoteResult
  | { kind: 'insurance_acknowledgement'; invoiceId: string }
  | { kind: 'manual_quote_lead_acknowledgement'; invoiceId: string }

const createdInvoiceIdSchema = z
  .union([z.string(), z.number().int().positive()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^[1-9]\d*$/))

export type QuoteGenerationStage =
  | 'reference_validation'
  | 'quotes_request'
  | 'quote_completion'
  | 'invoice_creation'
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
  input: ValidatedWindshieldQuoteSubmission,
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
    if (!invoiceId) {
      throw new QuoteGenerationError(
        'quote_result_extraction',
        'invalid_response',
        null,
        null,
      )
    }
    onInvoiceId(invoiceId)
    return { kind: 'insurance_acknowledgement', invoiceId }
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

export async function generateOmegaRockChipLead(
  input: ValidatedRockChipSubmission,
  onInvoiceId: (invoiceId: string) => void,
) {
  await verifyQuoteVehicleReference(input)

  let html: string

  try {
    const request = buildOmegaRockChipRequest(input)
    html = await quoteOmegaHtmlRequest(request.path, request.query)
  } catch (error) {
    throw wrapOmegaError('quotes_request', error, null)
  }

  const invoiceId = extractQuoteInvoiceId(html)
  if (invoiceId) onInvoiceId(invoiceId)

  return { kind: 'rock_chip_acknowledgement' as const }
}

export async function generateOmegaManualQuoteLead(
  input: ValidatedWindshieldQuoteSubmission,
  onInvoiceId: (invoiceId: string) => void,
) {
  if (input.glass.type !== 'sunroof' && input.glass.type !== 'other') {
    throw new QuoteGenerationError(
      'invoice_creation',
      'invalid_response',
      null,
      null,
    )
  }

  await verifyQuoteVehicleReference(input)

  let payload: unknown

  try {
    payload = await quoteOmegaJsonPost(
      '/Invoices',
      buildOmegaManualQuoteInvoicePayload(
        input,
        getOmegaLocationId(input.locationSlug),
      ),
    )
  } catch (error) {
    throw wrapOmegaError('invoice_creation', error, null)
  }

  const parsedInvoiceId = createdInvoiceIdSchema.safeParse(payload)

  if (!parsedInvoiceId.success) {
    throw new QuoteGenerationError(
      'invoice_creation',
      'invalid_response',
      null,
      null,
    )
  }

  onInvoiceId(parsedInvoiceId.data)
  return {
    kind: 'manual_quote_lead_acknowledgement' as const,
    invoiceId: parsedInvoiceId.data,
  }
}

async function verifyQuoteReferences(
  input: ValidatedWindshieldQuoteSubmission,
) {
  await verifyQuoteVehicleReference(input)

  if (input.payment.mode !== 'insurance') return

  try {
    const companyId = input.payment.companyId
    const companies = await getQuoteInsuranceCompanies()

    if (!companies.some((company) => company.id === companyId)) {
      throw new InvalidQuoteReferenceError()
    }
  } catch (error) {
    if (error instanceof InvalidQuoteReferenceError) throw error
    throw wrapOmegaError('reference_validation', error, null)
  }
}

async function verifyQuoteVehicleReference(
  input: Pick<
    ValidatedWindshieldQuoteSubmission | ValidatedRockChipSubmission,
    'vehicle'
  >,
) {
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
