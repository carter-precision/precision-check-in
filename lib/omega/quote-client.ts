import 'server-only'

const DEFAULT_API_URL = 'https://app.omegaedi.com/api/2.0'
const DEFAULT_TIMEOUT_MS = 8_000

export type QuoteOmegaErrorKind =
  'configuration' | 'not_found' | 'unavailable' | 'invalid_response'

export class QuoteOmegaApiError extends Error {
  constructor(
    message: string,
    readonly kind: QuoteOmegaErrorKind,
    readonly status: number | null = null,
  ) {
    super(message)
    this.name = 'QuoteOmegaApiError'
  }
}

export async function quoteOmegaJsonRequest(
  path: string,
  query?: URLSearchParams,
): Promise<unknown> {
  const apiKey = process.env.OMEGA_API_KEY?.trim()

  if (!apiKey) {
    throw new QuoteOmegaApiError(
      'OMEGA_API_KEY is not configured',
      'configuration',
    )
  }

  const baseUrl = (process.env.OMEGA_API_URL || DEFAULT_API_URL).replace(
    /\/$/,
    '',
  )

  let url: URL

  try {
    url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`)
  } catch {
    throw new QuoteOmegaApiError(
      'OMEGA_API_URL is not configured correctly',
      'configuration',
    )
  }

  if (query) {
    url.search = query.toString()
  }

  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        api_key: apiKey,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    })
  } catch {
    throw new QuoteOmegaApiError('Omega could not be reached', 'unavailable')
  }

  if (response.status === 404) {
    throw new QuoteOmegaApiError(
      'Omega resource was not found',
      'not_found',
      response.status,
    )
  }

  if (!response.ok) {
    throw new QuoteOmegaApiError(
      'Omega request was unsuccessful',
      'unavailable',
      response.status,
    )
  }

  try {
    return await response.json()
  } catch {
    throw new QuoteOmegaApiError(
      'Omega returned invalid JSON',
      'invalid_response',
      response.status,
    )
  }
}
