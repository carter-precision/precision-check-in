import { z } from 'zod'

import type { QuoteResult } from './quote-types'

const finiteMoneySchema = z
  .union([z.number(), z.string().trim().min(1)])
  .transform((value) => Number(value))
  .pipe(z.number().finite())
const nonnegativeMoneySchema = finiteMoneySchema.pipe(z.number().nonnegative())
const positiveMoneySchema = nonnegativeMoneySchema.pipe(z.number().positive())
const nullableIdSchema = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => normalizeNullableString(value))
const rawItemSchema = z.object({
  sku: z.union([z.string(), z.number(), z.null()]).optional(),
  description: z.string().trim().min(1),
  price: finiteMoneySchema,
})
const rawInvoiceSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  invoice_id: z.union([z.string(), z.number()]).optional(),
  invoice_subtotal: nonnegativeMoneySchema.nullable().optional(),
  invoice_tax: nonnegativeMoneySchema,
  invoice_total: positiveMoneySchema,
  location_id: nullableIdSchema,
  pricing_profile_id: nullableIdSchema,
  Items: z.array(rawItemSchema).min(1),
})

export class OmegaQuoteInvoiceContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OmegaQuoteInvoiceContractError'
  }
}

export function extractQuoteInvoiceId(html: string) {
  const stablePatterns = [
    /data-invoice-id\s*=\s*["'](\d+)["']/i,
    /(?:name|id)\s*=\s*["']invoice_id["'][^>]*value\s*=\s*["'](\d+)["']/i,
    /value\s*=\s*["'](\d+)["'][^>]*(?:name|id)\s*=\s*["']invoice_id["']/i,
    /\/Invoices\/(\d+)(?:[/?#"']|$)/i,
    /[?&]invoice_id=(\d+)(?:[&#"']|$)/i,
  ]

  for (const pattern of stablePatterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }

  const visibleText = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#35;|&num;/gi, '#')
    .replace(/\s+/g, ' ')
  const fallback = visibleText.match(/Precision Auto Glass Quote\s*#\s*(\d+)/i)

  return fallback?.[1] ?? null
}

export function normalizeQuoteInvoice(
  payload: unknown,
  expectedInvoiceId: string,
): QuoteResult {
  const parsed = rawInvoiceSchema.safeParse(unwrapInvoice(payload))

  if (!parsed.success) {
    throw new OmegaQuoteInvoiceContractError(
      'Omega returned an unusable quote invoice',
    )
  }

  const returnedId = normalizeNullableString(
    parsed.data.invoice_id ?? parsed.data.id,
  )

  if (returnedId && returnedId !== expectedInvoiceId) {
    throw new OmegaQuoteInvoiceContractError(
      'Omega returned a different quote invoice',
    )
  }

  return {
    invoiceId: expectedInvoiceId,
    subtotal: parsed.data.invoice_subtotal ?? null,
    tax: parsed.data.invoice_tax,
    total: parsed.data.invoice_total,
    locationId: parsed.data.location_id,
    pricingProfileId: parsed.data.pricing_profile_id,
    items: parsed.data.Items.map((item) => ({
      sku: normalizeNullableString(item.sku),
      description: item.description,
      price: item.price,
    })),
  }
}

function unwrapInvoice(payload: unknown) {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'data' in payload
  ) {
    return (payload as { data: unknown }).data
  }

  return payload
}

function normalizeNullableString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}
