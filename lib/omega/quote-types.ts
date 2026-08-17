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
  pricingProfileId: string | null
}

export type AppointmentWindowOption = {
  token: string
  date: string
  start: string
  end: string
  label: string
}

export type AppointmentAvailability = {
  locationLabel: string
  windows: AppointmentWindowOption[]
}

export type SchedulingResult = {
  status: 'held' | 'needs_follow_up'
}

export type QuoteResult = {
  invoiceId: string
  total: number
}

export type InsuranceQuoteAcknowledgement = {
  kind: 'insurance_acknowledgement'
  invoiceId: string
}

export type RockChipAcknowledgement = {
  kind: 'rock_chip_acknowledgement'
}

export type ManualQuoteLeadAcknowledgement = {
  kind: 'manual_quote_lead_acknowledgement'
  invoiceId: string
}

export type QuoteSubmissionResult =
  | QuoteResult
  | InsuranceQuoteAcknowledgement
  | RockChipAcknowledgement
  | ManualQuoteLeadAcknowledgement
