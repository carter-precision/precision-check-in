import type { QuoteResult } from '@/lib/omega/quote-types'

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
export type QuotePaymentMode = 'insurance' | 'cash'
export type QuoteSubmissionStatus =
  'idle' | 'submitting' | 'succeeded' | 'failed'

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

export type QuoteSubmission = {
  locationSlug: string
  customer: {
    firstName: string
    phone: string
    email: string | null
    zip: string
    smsConsent: boolean
  }
  vehicle: QuoteVehicle
  glass: {
    type: GlassType
    position: OmegaGlassPosition
  }
  service: {
    mode: Exclude<QuoteServiceMode, null>
    address: string | null
    shopLocation: string | null
    preferredDate: string | null
  }
  payment:
    | { mode: 'cash' }
    | {
        mode: 'insurance'
        companyId: string
        companyLabel: string
        policyNumber: string
        deductible: number
      }
}

export type KioskData = {
  visitType: VisitType
  serviceType: ServiceType
  paymentType: PaymentType
  customerName: string
  phone: string
  windshieldIntent: 'quote' | 'inspection' | null
  repairAuthorized: boolean
  quotePayType: QuotePaymentMode | null
  quoteSource: 'walk_in' | 'header' | null
  insuranceCompanyId: string
  insuranceCompanyLabel: string
  policyNumber: string
  serviceZip: string
  deductibleAmount: string
  smsConsent: boolean
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
  glassType: GlassType | null
  glassPosition: OmegaGlassPosition | null
  quoteServiceMode: QuoteServiceMode
  serviceAddress: string
  shopLocation: string
  preferredDate: string
  email: string
  quoteSubmission: QuoteSubmission | null
  quoteSubmissionStatus: QuoteSubmissionStatus
  quoteSubmissionError: string | null
  quoteInvoiceId: string | null
  quoteRecoveryToken: string | null
  quoteResult: QuoteResult | null
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
} satisfies Partial<KioskData>

export const emptyQuoteServiceData = {
  glassType: null,
  glassPosition: null,
  quoteServiceMode: null,
  serviceAddress: '',
  shopLocation: '',
  preferredDate: '',
} satisfies Partial<KioskData>

export const emptyQuoteOutcomeData = {
  quoteSubmission: null,
  quoteSubmissionStatus: 'idle',
  quoteSubmissionError: null,
  quoteInvoiceId: null,
  quoteRecoveryToken: null,
  quoteResult: null,
} satisfies Partial<KioskData>

export const emptyQuoteContactData = {
  customerName: '',
  phone: '',
  email: '',
  serviceZip: '',
  smsConsent: false,
  paymentType: null,
  quotePayType: null,
  insuranceCompanyId: '',
  insuranceCompanyLabel: '',
  policyNumber: '',
  deductibleAmount: '',
  ...emptyQuoteOutcomeData,
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
  insuranceCompanyId: '',
  insuranceCompanyLabel: '',
  policyNumber: '',
  serviceZip: '',
  deductibleAmount: '',
  smsConsent: false,
  ...emptyQuoteVehicleData,
  ...emptyQuoteServiceData,
  email: '',
  ...emptyQuoteOutcomeData,
}

export type KioskStepProps = {
  data: KioskData
  goTo: (step: StepId, partial?: Partial<KioskData>) => void
  updateData: (partial: Partial<KioskData>) => void
  submitCheckIn: () => Promise<boolean>
  submitQuote: (submission: QuoteSubmission) => Promise<boolean>
  resetFlow: () => void
  isSubmitting: boolean
  location: string
}
