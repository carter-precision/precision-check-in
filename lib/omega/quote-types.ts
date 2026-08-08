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

export type QuoteResultItem = {
  sku: string | null
  description: string
  price: number
}

export type QuoteResult = {
  invoiceId: string
  subtotal: number | null
  tax: number
  total: number
  locationId: string | null
  pricingProfileId: string | null
  items: QuoteResultItem[]
}
