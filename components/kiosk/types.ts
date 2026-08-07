export type StepId =
  | 'welcome'
  | 'appointment'
  | 'serviceType'
  | 'paymentType'
  | 'name'
  | 'windshieldIntent'
  | 'windshieldQuotePayType'
  | 'windshieldInsuranceDetails'
  | 'windshieldVehicle'
  | 'windshieldGlass'
  | 'windshieldServiceLocation'
  | 'windshieldContact'
  | 'windshieldQuoteResult'
  | 'rockChipCashAuthorization'
  | 'rockChipInsuranceName'
  | 'success'
  | 'quoteServiceType'
  | 'rockChipQuote'

export type VisitType = 'appointment' | 'vehicle_pickup' | 'walk_in' | null
export type ServiceType = 'windshield' | 'rock_chip' | 'other' | 'bell' | null
export type PaymentType = 'cash' | 'insurance' | null
export type VehicleFeature =
  'rain' | 'hud' | 'heated' | 'adas' | 'acoustic' | 'humidity' | 'none'
export type GlassType =
  | 'windshield'
  | 'back'
  | 'driver_front'
  | 'driver_rear'
  | 'driver_quarter'
  | 'passenger_front'
  | 'passenger_rear'
  | 'passenger_quarter'
  | 'quarter'
  | 'vent'
  | 'sunroof'
  | 'other'
export type OmegaGlassPosition =
  | 'W'
  | 'D_FRONT_LEFT'
  | 'D_FRONT_RIGHT'
  | 'D_REAR_LEFT'
  | 'D_REAR_RIGHT'
  | 'Q'
  | 'V'
  | 'B'
export type QuoteServiceMode = 'mobile' | 'shop' | null

export type QuoteVehicle = {
  year: string
  makeId: string
  makeLabel: string
  modelId: string
  modelLabel: string
  modifierId: string | null
  modifierLabel: string | null
  vehicleId: string
  variantLabel: string | null
  vin: string | null
}

export type KioskData = {
  visitType: VisitType
  serviceType: ServiceType
  paymentType: PaymentType
  customerName: string
  phone: string
  windshieldIntent: 'quote' | 'inspection' | null
  repairAuthorized: boolean
  quotePayType: 'insurance' | 'cash' | null
  quoteSource: 'walk_in' | 'header' | null
  insuranceCarrier: string
  policyHolderName: string
  policyHolderPhone: string
  policyNumber: string
  serviceZip: string
  knowsDeductible: boolean | null
  deductibleAmount: string
  vin: string
  vinUnknown: boolean
  vehicleYear: string
  vehicleMakeId: string
  vehicleMake: string
  vehicleModelId: string
  vehicleModel: string
  vehicleModifierId: string | null
  vehicleModifierLabel: string | null
  quoteVehicle: QuoteVehicle | null
  vehicleFeatures: VehicleFeature[]
  glassType: GlassType | null
  glassPosition: OmegaGlassPosition | null
  quoteServiceMode: QuoteServiceMode
  serviceAddress: string
  shopLocation: string
  preferredDate: string
  email: string
}

export const emptyQuoteVehicleData = {
  vin: '',
  vinUnknown: false,
  vehicleYear: '',
  vehicleMakeId: '',
  vehicleMake: '',
  vehicleModelId: '',
  vehicleModel: '',
  vehicleModifierId: null,
  vehicleModifierLabel: null,
  quoteVehicle: null,
  vehicleFeatures: [],
} satisfies Partial<KioskData>

export const emptyQuoteServiceData = {
  glassType: null,
  glassPosition: null,
  quoteServiceMode: null,
  serviceAddress: '',
  shopLocation: '',
  preferredDate: '',
} satisfies Partial<KioskData>

export const initialKioskData: KioskData = {
  visitType: null,
  serviceType: null,
  paymentType: null,
  customerName: '',
  phone: '',
  windshieldIntent: null,
  repairAuthorized: false,
  quotePayType: null,
  quoteSource: null,
  insuranceCarrier: '',
  policyHolderName: '',
  policyHolderPhone: '',
  policyNumber: '',
  serviceZip: '',
  knowsDeductible: null,
  deductibleAmount: '',
  ...emptyQuoteVehicleData,
  ...emptyQuoteServiceData,
  email: '',
}

export type KioskStepProps = {
  data: KioskData
  goTo: (step: StepId, partial?: Partial<KioskData>) => void
  updateData: (partial: Partial<KioskData>) => void
  submitCheckIn: () => Promise<boolean>
  resetFlow: () => void
  isSubmitting: boolean
  location: string
}
