export type StepId =
    | "welcome"
    | "appointment"
    | "serviceType"
    | "paymentType"
    | "name"
    | "windshieldIntent"
    | "windshieldQuotePayType"
    | "windshieldInsuranceDetails"
    | "windshieldVehicle"
    | "windshieldGlass"
    | "windshieldServiceLocation"
    | "windshieldContact"
    | "windshieldQuoteResult"
    | "rockChipCashAuthorization"
    | "rockChipInsuranceName"
    | "success"
    | "quoteServiceType"
    | "rockChipQuote"

export type VisitType = "appointment" | "walk_in" | null
export type ServiceType = "windshield" | "rock_chip" | "other" | "bell" | null
export type PaymentType = "cash" | "insurance" | null
export type VehicleFeature =
    | "rain"
    | "hud"
    | "heated"
    | "adas"
    | "acoustic"
    | "humidity"
    | "none"
export type GlassType =
    | "windshield"
    | "back"
    | "driver_front"
    | "driver_rear"
    | "driver_quarter"
    | "passenger_front"
    | "passenger_rear"
    | "passenger_quarter"
    | "sunroof"
    | "other"
export type QuoteServiceMode = "mobile" | "shop" | null

export type KioskData = {
    visitType: VisitType
    serviceType: ServiceType
    paymentType: PaymentType
    customerName: string
    phone: string
    windshieldIntent: "quote" | "inspection" | null
    repairAuthorized: boolean
    quotePayType: "insurance" | "cash" | null
    quoteSource: "walk_in" | "header" | null
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
    vehicleMake: string
    vehicleModel: string
    vehicleFeatures: VehicleFeature[]
    glassType: GlassType | null
    quoteServiceMode: QuoteServiceMode
    serviceAddress: string
    shopLocation: string
    preferredDate: string
    email: string
}

export const initialKioskData: KioskData = {
    visitType: null,
    serviceType: null,
    paymentType: null,
    customerName: "",
    phone: "",
    windshieldIntent: null,
    repairAuthorized: false,
    quotePayType: null,
    quoteSource: null,
    insuranceCarrier: "",
    policyHolderName: "",
    policyHolderPhone: "",
    policyNumber: "",
    serviceZip: "",
    knowsDeductible: null,
    deductibleAmount: "",
    vin: "",
    vinUnknown: false,
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleFeatures: [],
    glassType: null,
    quoteServiceMode: null,
    serviceAddress: "",
    shopLocation: "",
    preferredDate: "",
    email: "",
}

export type KioskStepProps = {
    data: KioskData
    goTo: (step: StepId, partial?: Partial<KioskData>) => void
    updateData: (partial: Partial<KioskData>) => void
    submitCheckIn: () => Promise<boolean>
    startRockChipDelayedCheckIn: () => void
    resetFlow: () => void
    isSubmitting: boolean
    pendingRockChipCheckIn: boolean
    location: string
}
