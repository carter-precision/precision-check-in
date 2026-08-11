export type VehicleYearOption = {
  year: string
}

export type VehicleMakeOption = {
  id: string
  label: string
}

export type VehicleModelOption = {
  id: string
  label: string
  modifierId: string | null
  modifierLabel: string | null
}

export type VehicleVariantOption = {
  vehicleId: string
  bodyStyleId: string | null
  label: string
}

export type VinVehicleResult = {
  vin: string
  vehicleId: string
  year: string | null
  makeId: string | null
  makeLabel: string | null
  modelId: string | null
  modelLabel: string | null
  modifierId: string | null
  modifierLabel: string | null
  bodyStyleId: string | null
  variantLabel: string | null
}

export type InsuranceCompanyOption = {
  id: string
  label: string
}

export type QuoteResult = {
  invoiceId: string
  total: number
}

export type InsuranceQuoteAcknowledgement = {
  kind: 'insurance_acknowledgement'
}

export type QuoteSubmissionResult = QuoteResult | InsuranceQuoteAcknowledgement
