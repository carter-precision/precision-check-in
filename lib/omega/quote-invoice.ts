export type OmegaQuoteHtmlResult =
  | { kind: 'final'; invoiceId: string; total: number }
  | { kind: 'bootstrap'; guid: string }
  | { kind: 'invalid' }

const OMEGA_APP_ORIGIN = 'https://app.omegaedi.com'
const OMEGA_QUOTE_GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function classifyOmegaQuoteHtml(html: string): OmegaQuoteHtmlResult {
  const invoiceId = extractQuoteInvoiceId(html)
  const total = extractQuoteTotal(html)

  if (invoiceId && total !== null) {
    return { kind: 'final', invoiceId, total }
  }

  const guid = extractOmegaQuoteBootstrapGuid(html)
  return guid ? { kind: 'bootstrap', guid } : { kind: 'invalid' }
}

export function extractOmegaQuoteBootstrapGuid(html: string) {
  const visibleMarkup = stripNonVisibleHtml(html)
  const refreshTargets: string[] = []

  for (const metaTag of visibleMarkup.match(/<meta\b[^>]*>/gi) ?? []) {
    const httpEquiv = readHtmlAttribute(metaTag, 'http-equiv')

    if (httpEquiv?.trim().toLowerCase() !== 'refresh') continue

    const content = readHtmlAttribute(metaTag, 'content')
    const target = content?.match(
      /^\s*\d+(?:\.\d+)?\s*;\s*url\s*=\s*(.+?)\s*$/i,
    )

    if (!target) return null
    refreshTargets.push(stripOptionalQuotes(decodeHtmlAttribute(target[1])))
  }

  if (refreshTargets.length !== 1) return null

  let refreshUrl: URL

  try {
    refreshUrl = new URL(refreshTargets[0], OMEGA_APP_ORIGIN)
  } catch {
    return null
  }

  if (
    refreshUrl.origin !== OMEGA_APP_ORIGIN ||
    refreshUrl.pathname !== '/quoter/vin.php'
  ) {
    return null
  }

  const guids = refreshUrl.searchParams.getAll('guid')
  const guid = guids.length === 1 ? guids[0] : null
  return guid && OMEGA_QUOTE_GUID_PATTERN.test(guid) ? guid.toUpperCase() : null
}

export function extractQuoteInvoiceId(html: string) {
  const visibleMarkup = stripNonVisibleHtml(html)
  const stablePatterns = [
    /data-(?:invoice|quote)-(?:id|number|no)\s*=\s*["'](\d+)["']/i,
    /(?:name|id)\s*=\s*["'](?:invoice|quote)_(?:id|number|no)["'][^>]*value\s*=\s*["'](\d+)["']/i,
    /value\s*=\s*["'](\d+)["'][^>]*(?:name|id)\s*=\s*["'](?:invoice|quote)_(?:id|number|no)["']/i,
    /\/Invoices?\/(?:view\/)?(\d+)(?:[/?#"']|$)/i,
    /[?&](?:invoice|quote)_(?:id|number|no)=(\d+)(?:[&#"']|$)/i,
  ]

  for (const pattern of stablePatterns) {
    const match = visibleMarkup.match(pattern)
    if (match) return match[1]
  }

  const visibleText = visibleMarkup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#(?:0*35|x0*23);|&(?:num|hash);/gi, '#')
    .replace(/\s+/g, ' ')

  const visiblePatterns = [
    /Precision Auto Glass Quote\s*#\s*:?\s*(\d+)/i,
    /\bQuote\s*#\s*:?\s*(\d+)/i,
    /\bQuote\s*(?:Number|No\.?)\s*(?:#\s*)?:?\s*(\d+)/i,
    /\bInvoice\s*#\s*:?\s*(\d+)/i,
    /\bInvoice\s*(?:Number|No\.?)\s*(?:#\s*)?:?\s*(\d+)/i,
  ]

  for (const pattern of visiblePatterns) {
    const match = visibleText.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function extractQuoteTotal(html: string) {
  const visibleMarkup = stripNonVisibleHtml(html)
  const openingTagPattern = /<([a-z][\w:-]*)\b[^>]*>/gi

  for (const match of visibleMarkup.matchAll(openingTagPattern)) {
    const openingTag = match[0]
    const className = readHtmlAttribute(openingTag, 'class')

    if (!className?.split(/\s+/).includes('price')) continue

    const contentStart = (match.index ?? 0) + openingTag.length
    const remainingMarkup = visibleMarkup.slice(contentStart)
    const closingTag = new RegExp(`<\\/${match[1]}\\s*>`, 'i').exec(
      remainingMarkup,
    )

    if (!closingTag) return null

    const elementContent = remainingMarkup.slice(0, closingTag.index)
    const text = decodeHtmlAttribute(elementContent.replace(/<[^>]+>/g, ' '))
    const amount = text.match(
      /\$\s*(\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+(?:\.\d{2})?)/,
    )

    if (!amount) return null

    const total = Number(amount[1].replaceAll(',', ''))
    return Number.isFinite(total) && total > 0 ? total : null
  }

  return null
}

function stripNonVisibleHtml(html: string) {
  return html
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
}

function readHtmlAttribute(tag: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = tag.match(
    new RegExp(
      `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i',
    ),
  )

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (entity, code: string) =>
      decodeHtmlCodePoint(entity, code, 16),
    )
    .replace(/&#([0-9]+);/g, (entity, code: string) =>
      decodeHtmlCodePoint(entity, code, 10),
    )
}

function decodeHtmlCodePoint(entity: string, code: string, radix: number) {
  const value = Number.parseInt(code, radix)
  return Number.isInteger(value) && value >= 0 && value <= 0x10ffff
    ? String.fromCodePoint(value)
    : entity
}

function stripOptionalQuotes(value: string) {
  const normalized = value.trim()
  const first = normalized[0]

  if ((first === '"' || first === "'") && normalized.at(-1) === first) {
    return normalized.slice(1, -1).trim()
  }

  return normalized
}
