"use server"

import { z } from "zod"

import { readCustomerCheckInProof } from "@/lib/auth/customer-check-in-proof"
import {
    closeCheckIn,
    createCheckIn,
    createVerifiedCustomerCheckIn,
    type CreateCheckInInput,
} from "@/lib/data/check-ins"

const customerCheckInFormSchema = z.object({
    proof: z.string().min(1).max(4_000),
    arrivalMode: z.enum(["lobby", "vehicle"]),
})

export type CustomerCheckInActionState = {
    status: "idle" | "success" | "error"
    message?: string
}

export async function createCheckInAction(input: CreateCheckInInput) {
    return createCheckIn(input)
}

export async function closeCheckInAction(id: string) {
    return closeCheckIn(id)
}

export async function createCustomerCheckInAction(
    _previousState: CustomerCheckInActionState,
    formData: FormData,
): Promise<CustomerCheckInActionState> {
    const parsed = customerCheckInFormSchema.safeParse({
        proof: formData.get("proof"),
        arrivalMode: formData.get("arrivalMode"),
    })

    if (!parsed.success) {
        return {
            status: "error",
            message: "This check-in link is no longer valid. Please open the link from your reminder again.",
        }
    }

    const appointment = readCustomerCheckInProof(parsed.data.proof)

    if (!appointment) {
        return {
            status: "error",
            message: "This check-in link has expired. Please open the link from your reminder again.",
        }
    }

    if (parsed.data.arrivalMode === "vehicle" && !appointment.vehicleDescription) {
        return {
            status: "error",
            message: "We could not identify your vehicle. Please check in inside instead.",
        }
    }

    try {
        const result = await createVerifiedCustomerCheckIn({
            locationSlug: appointment.locationSlug,
            customerName: appointment.customerName,
            phone: appointment.phone,
            arrivalMode: parsed.data.arrivalMode,
            vehicleDescription:
                parsed.data.arrivalMode === "vehicle" ? appointment.vehicleDescription : null,
            omegaAppointmentId: appointment.omegaAppointmentId,
            omegaInvoiceId: appointment.omegaInvoiceId,
            omegaAppointmentGuidHash: appointment.appointmentGuidHash,
        })

        return {
            status: "success",
            message:
                result.status === "already_checked_in"
                    ? "You're already checked in. We'll be with you soon."
                    : "You're checked in. We'll be with you soon.",
        }
    } catch (error) {
        console.error("Customer check-in submission failed", error)
        return {
            status: "error",
            message: "We couldn't complete your check-in. Please check in inside and our team will help you.",
        }
    }
}
