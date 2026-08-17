import type { ValidatedWindshieldQuoteSubmission } from './quote-request'

const DEFAULT_ACCOUNT_COMPANY_ID = 1
const DEFAULT_PRICING_PROFILE_ID = 1

const SUNROOF_TAG = {
  id: '8',
  color: '#888188',
  text: 'Sunroof Part',
} as const

const SUNROOF_NOTE = {
  note: 'Customer selected Sunroof in the kiosk. Manual review and pricing required.',
  customer_visible: false,
  is_tech_note: false,
} as const

const MANUAL_QUOTE_TAG = {
  id: '190',
  color: '#656165',
  text: 'Other Glass',
} as const

const MANUAL_QUOTE_NOTE = {
  note: 'Kiosk customer is unsure which glass needs replacement or needs multiple pieces serviced. Manual review and pricing required.',
  customer_visible: false,
  is_tech_note: false,
} as const

export function buildOmegaManualQuoteInvoicePayload(
  input: ValidatedWindshieldQuoteSubmission,
  locationId: string,
) {
  if (input.glass.type !== 'sunroof' && input.glass.type !== 'other') {
    throw new Error('Only manual quote selections can create this lead')
  }

  const accountCompanyId =
    input.payment.mode === 'insurance'
      ? Number(input.payment.companyId)
      : DEFAULT_ACCOUNT_COMPANY_ID
  const pricingProfileId =
    input.payment.mode === 'insurance'
      ? Number(input.payment.pricingProfileId)
      : DEFAULT_PRICING_PROFILE_ID

  return {
    salesman_1_id: '',
    location_id: Number(locationId),
    account_company_id: accountCompanyId,
    pricing_profile_id: pricingProfileId,
    customer_fname: input.customer.firstName,
    customer_phone: input.customer.phone,
    customer_zip: input.customer.zip,
    customer_sms: input.customer.smsConsent,
    vehicle_year: Number(input.vehicle.year),
    vehicle_make: input.vehicle.makeLabel,
    vehicle_model: input.vehicle.modelLabel,
    invoice_status: 'NS',
    job_status: 'LE',
    campaign:
      input.payment.mode === 'insurance' ? 'Ins Web Quote' : 'WEB QUOTE',
    Notes: [input.glass.type === 'sunroof' ? SUNROOF_NOTE : MANUAL_QUOTE_NOTE],
    Tags: [input.glass.type === 'sunroof' ? SUNROOF_TAG : MANUAL_QUOTE_TAG],
    ...(input.customer.email ? { customer_email: input.customer.email } : {}),
    ...(input.vehicle.vin ? { vehicle_vin: input.vehicle.vin } : {}),
    ...(input.vehicle.variantLabel
      ? { vehicle_description: input.vehicle.variantLabel }
      : {}),
    ...(input.payment.mode === 'insurance'
      ? {
          account_policy_no: input.payment.policyNumber,
          ...(input.payment.deductible !== null
            ? { account_deductible: input.payment.deductible }
            : {}),
        }
      : {}),
  }
}
