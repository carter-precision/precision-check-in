import type {
  KioskData,
  QuoteSubmission,
  RockChipSubmission,
  WindshieldAppointmentSubmission,
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
    !data.quotePayType
  ) {
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

export function buildAppointmentSubmission(
  data: KioskData,
  locationSlug: string,
): WindshieldAppointmentSubmission | null {
  if (
    !data.quoteServiceMode ||
    !data.appointmentRequest ||
    !data.quoteInvoiceId ||
    !ZIP_PATTERN.test(data.serviceZip.trim())
  ) {
    return null
  }

  if (data.quoteServiceMode === 'mobile' && !data.serviceAddress.trim()) {
    return null
  }

  if (data.quoteServiceMode === 'shop' && !data.shopLocation.trim()) {
    return null
  }

  return {
    locationSlug,
    invoiceId: data.quoteInvoiceId,
    postalCode: data.serviceZip.trim(),
    service: {
      mode: data.quoteServiceMode,
      address:
        data.quoteServiceMode === 'mobile' ? data.serviceAddress.trim() : null,
      shopLocation:
        data.quoteServiceMode === 'shop' ? data.shopLocation.trim() : null,
      appointmentRequest:
        data.appointmentRequest.kind === 'follow_up'
          ? { kind: 'follow_up' }
          : {
              kind: data.appointmentRequest.kind,
              token: data.appointmentRequest.token,
            },
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

  if (
    !firstName ||
    !isValidQuotePhone(phone) ||
    !isValidQuoteEmail(email) ||
    !data.quoteVehicle ||
    !data.quotePayType ||
    (data.quotePayType === 'cash' && !data.repairAuthorized)
  ) {
    return null
  }

  const common = {
    serviceType: 'rock_chip' as const,
    locationSlug,
    customer: {
      firstName,
      phone,
      email: email || null,
    },
    vehicle: data.quoteVehicle,
  } satisfies Omit<RockChipSubmission, 'payment'>

  return {
    ...common,
    payment: { mode: data.quotePayType },
  }
}
