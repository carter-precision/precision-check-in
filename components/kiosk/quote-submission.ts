import type {
  KioskData,
  QuoteSubmission,
  RockChipSubmission,
  WindshieldQuoteSubmission,
} from './types'

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
    !data.quotePayType ||
    !data.appointmentRequest
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
      appointmentRequest:
        data.appointmentRequest.kind === 'follow_up'
          ? { kind: 'follow_up' as const }
          : {
              kind: data.appointmentRequest.kind,
              token: data.appointmentRequest.token,
            },
    },
  } satisfies Omit<WindshieldQuoteSubmission, 'payment'>

  if (data.quotePayType === 'cash') {
    return { ...common, payment: { mode: 'cash' } }
  }

  if (
    !data.insuranceCompanyId.trim() ||
    !data.insuranceCompanyLabel.trim() ||
    !data.policyNumber.trim()
  ) {
    return null
  }

  const deductibleText = data.deductibleAmount.trim()
  const deductible = deductibleText ? Number(deductibleText) : null

  if (deductible !== null && (!Number.isFinite(deductible) || deductible < 0)) {
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

export function buildRockChipSubmission(
  data: KioskData,
  locationSlug: string,
): RockChipSubmission | null {
  const firstName = data.customerName.trim()
  const phone = data.phone.trim()
  const email = data.email.trim()
  const zip = data.serviceZip.trim()

  if (
    !firstName ||
    !isValidQuotePhone(phone) ||
    !isValidQuoteEmail(email) ||
    !ZIP_PATTERN.test(zip) ||
    !data.quoteServiceMode ||
    !data.quotePayType ||
    !data.appointmentRequest
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
    serviceType: 'rock_chip' as const,
    locationSlug,
    customer: {
      firstName,
      phone,
      email: email || null,
      zip,
      smsConsent: data.smsConsent,
    },
    service: {
      mode: data.quoteServiceMode,
      address:
        data.quoteServiceMode === 'mobile' ? data.serviceAddress.trim() : null,
      shopLocation:
        data.quoteServiceMode === 'shop' ? data.shopLocation.trim() : null,
      appointmentRequest:
        data.appointmentRequest.kind === 'follow_up'
          ? { kind: 'follow_up' as const }
          : {
              kind: data.appointmentRequest.kind,
              token: data.appointmentRequest.token,
            },
    },
  } satisfies Omit<RockChipSubmission, 'payment'>

  if (data.quotePayType === 'cash') {
    return { ...common, payment: { mode: 'cash' } }
  }

  if (
    !data.insuranceCompanyId.trim() ||
    !data.insuranceCompanyLabel.trim() ||
    !data.policyNumber.trim()
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
    },
  }
}
