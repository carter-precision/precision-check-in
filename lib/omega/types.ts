export type OmegaAppointment = {
    id: string
    guid: string
    invoiceId: string
    locationId: string
    startTime: number
    endTime: number
    status: string
    type: string
}

export type OmegaInvoice = {
    customerName: string
    phone: string | null
    vehicleDescription: string | null
}

export type VerifiedAppointment = {
    omegaAppointmentId: string
    omegaInvoiceId: string
    appointmentGuidHash: string
    customerName: string
    phone: string | null
    vehicleDescription: string | null
    appointmentStart: number
    appointmentEnd: number
    locationSlug: string
}

export type AppointmentResolution =
    | {
          status: "resolved"
          appointment: VerifiedAppointment
      }
    | {
          status: "too_early"
          checkInOpensAt: number
      }
    | {
          status: "unavailable"
      }
