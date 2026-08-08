import type { KioskData, QuoteSubmission } from './types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ZIP_PATTERN = /^\d{5}$/

export function isValidQuotePhone(phone: string) {
  const digitCount = phone.replace(/\D/g, '').length
  return digitCount >= 10 && digitCount <= 15
}

export function isValidQuoteEmail(email: string) {
  const normalized = email.trim()
  return normalized.length === 0 || EMAIL_PATTERN.test(normalized)
}

export function buildQuoteSubmission(
  data: KioskData,
  locationSlug: string,
): QuoteSubmission | null {
  const firstName = data.customerName.trim()
  const phone = data.phone.trim()
  const email = data.email.trim()
  const zip = data.serviceZip.trim()

  if (
    !firstName ||
    !isValidQuotePhone(phone) ||
    !isValidQuoteEmail(email) ||
    !ZIP_PATTERN.test(zip) ||
    !data.quoteVehicle ||
    !data.glassType ||
    !data.glassPosition ||
    !data.quoteServiceMode ||
    !data.quotePayType
  ) {
    return null
  }

  if (data.quoteServiceMode === 'mobile' && !data.serviceAddress.trim()) {
    return null
  }

  if (data.quoteServiceMode === 'shop' && !data.shopLocation.trim()) {
    return null
  }

  const common = {
    locationSlug,
    customer: {
      firstName,
      phone,
      email: email || null,
      zip,
      smsConsent: data.smsConsent,
    },
    vehicle: data.quoteVehicle,
    glass: {
      type: data.glassType,
      position: data.glassPosition,
    },
    service: {
      mode: data.quoteServiceMode,
      address:
        data.quoteServiceMode === 'mobile' ? data.serviceAddress.trim() : null,
      shopLocation:
        data.quoteServiceMode === 'shop' ? data.shopLocation.trim() : null,
      preferredDate: data.preferredDate.trim() || null,
    },
  } satisfies Omit<QuoteSubmission, 'payment'>

  if (data.quotePayType === 'cash') {
    return { ...common, payment: { mode: 'cash' } }
  }

  const deductible = Number(data.deductibleAmount)
  if (
    !data.insuranceCompanyId.trim() ||
    !data.insuranceCompanyLabel.trim() ||
    !data.policyNumber.trim() ||
    !data.deductibleAmount.trim() ||
    !Number.isFinite(deductible) ||
    deductible < 0
  ) {
    return null
  }

  return {
    ...common,
    payment: {
      mode: 'insurance',
      companyId: data.insuranceCompanyId.trim(),
      companyLabel: data.insuranceCompanyLabel.trim(),
      policyNumber: data.policyNumber.trim(),
      deductible,
    },
  }
}
