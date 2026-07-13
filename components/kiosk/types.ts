export type StepId =
    | "welcome"
    | "appointment"
    | "serviceType"
    | "paymentType"
    | "name"
    | "windshieldIntent"
    | "windshieldQuotePayType"
    | "windshieldInsuranceQuote"
    | "windshieldCashQuote"
    | "rockChipCashAuthorization"
    | "rockChipInsuranceName"
    | "success"
    | "quoteServiceType"
    | "rockChipQuote"

export type VisitType = "appointment" | "walk_in" | null
export type ServiceType = "windshield" | "rock_chip" | "other" | "bell" | null
export type PaymentType = "cash" | "insurance" | null

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
}

export type KioskStepProps = {
    data: KioskData
    goTo: (step: StepId, partial?: Partial<KioskData>) => void
    updateData: (partial: Partial<KioskData>) => void
    submitCheckIn: () => Promise<boolean>
    startRockChipDelayedCheckIn: () => void
    isSubmitting: boolean
    pendingRockChipCheckIn: boolean
    location: string
}
