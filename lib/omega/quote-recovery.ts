import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const RECOVERY_TOKEN_LIFETIME_SECONDS = 30 * 60

export function createQuoteRecoveryToken(
  locationSlug: string,
  invoiceId: string,
) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const signature = signRecoveryToken(locationSlug, invoiceId, issuedAt)
  return `${issuedAt}.${signature}`
}

export function verifyQuoteRecoveryToken(
  token: string,
  locationSlug: string,
  invoiceId: string,
) {
  const [issuedAtValue, suppliedSignature, ...extra] = token.split('.')
  const issuedAt = Number(issuedAtValue)
  const now = Math.floor(Date.now() / 1000)

  if (
    extra.length > 0 ||
    !suppliedSignature ||
    !Number.isInteger(issuedAt) ||
    issuedAt > now + 60 ||
    now - issuedAt > RECOVERY_TOKEN_LIFETIME_SECONDS
  ) {
    return false
  }

  const expectedSignature = signRecoveryToken(locationSlug, invoiceId, issuedAt)
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)

  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  )
}

function signRecoveryToken(
  locationSlug: string,
  invoiceId: string,
  issuedAt: number,
) {
  const secret = process.env.OMEGA_API_KEY?.trim()

  if (!secret) {
    throw new Error('Quote recovery signing is not configured')
  }

  return createHmac('sha256', secret)
    .update(`v1:${issuedAt}:${locationSlug}:${invoiceId}`)
    .digest('base64url')
}
