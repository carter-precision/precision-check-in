import "server-only"

import crypto from "node:crypto"
import { z } from "zod"

import { getOmegaInvoice, listOmegaAppointments, OmegaApiError } from "./client"
import type { AppointmentResolution } from "./types"

const lookupSchema = z.object({
    appointmentGuid: z.string().uuid(),
    invoiceId: z.string().regex(/^\d+$/),
})

const DAY_MS = 24 * 60 * 60 * 1_000
const LOOKBACK_DAYS = 2
const LOOKAHEAD_DAYS = 30
const CHECK_IN_EARLY_MS = 90 * 60 * 1_000
const CHECK_IN_LATE_MS = 2 * 60 * 60 * 1_000

export async function resolveOmegaAppointment(input: {
    appointmentGuid: string
    invoiceId: string
}): Promise<AppointmentResolution> {
    const parsed = lookupSchema.safeParse({
        appointmentGuid: input.appointmentGuid.trim().toLowerCase(),
        invoiceId: input.invoiceId.trim(),
    })

    if (!parsed.success) return { status: "unavailable" }

    try {
        const invoice = await getOmegaInvoice(parsed.data.invoiceId)
        const now = Date.now()
        const appointments = await listOmegaAppointments({
            dateFrom: now - LOOKBACK_DAYS * DAY_MS,
            dateTo: now + LOOKAHEAD_DAYS * DAY_MS,
        })
        const appointment = appointments.find(
            (candidate) =>
                candidate.guid.trim().toLowerCase() === parsed.data.appointmentGuid &&
                candidate.invoiceId === parsed.data.invoiceId,
        )

        if (!appointment) return { status: "unavailable" }
        if (appointment.status !== "OPEN") return { status: "unavailable" }
        if (appointment.type !== "inshop") return { status: "unavailable" }

        const locationSlug = getLocalLocationSlug(appointment.locationId)

        const checkInOpensAt = appointment.startTime - CHECK_IN_EARLY_MS

        if (now < checkInOpensAt) {
            return { status: "too_early", checkInOpensAt }
        }

        if (now > appointment.endTime + CHECK_IN_LATE_MS) {
            return { status: "unavailable" }
        }

        return {
            status: "resolved",
            appointment: {
                omegaAppointmentId: appointment.id,
                omegaInvoiceId: appointment.invoiceId,
                appointmentGuidHash: hashAppointmentGuid(parsed.data.appointmentGuid),
                customerName: invoice.customerName,
                phone: invoice.phone,
                vehicleDescription: invoice.vehicleDescription,
                appointmentStart: appointment.startTime,
                appointmentEnd: appointment.endTime,
                locationSlug,
            },
        }
    } catch (error) {
        if (error instanceof OmegaApiError) {
            console.error(`Omega check-in lookup failed: ${error.kind}`)
        } else {
            console.error("Omega check-in lookup failed")
        }

        return { status: "unavailable" }
    }
}

export function hashAppointmentGuid(guid: string) {
    return crypto.createHash("sha256").update(guid.trim().toLowerCase()).digest("hex")
}

function getLocalLocationSlug(omegaLocationId: string) {
    const rawMapping = process.env.OMEGA_LOCATION_MAP

    if (!rawMapping) {
        throw new OmegaApiError("OMEGA_LOCATION_MAP is not configured", "configuration")
    }

    let mapping: unknown

    try {
        mapping = JSON.parse(rawMapping)
    } catch {
        throw new OmegaApiError("OMEGA_LOCATION_MAP is invalid JSON", "configuration")
    }

    const parsed = z.record(z.string(), z.union([z.string(), z.number()])).safeParse(mapping)

    if (!parsed.success || parsed.data[omegaLocationId] === undefined) {
        throw new OmegaApiError("Omega location mapping is missing", "configuration")
    }

    const locationSlug = String(parsed.data[omegaLocationId]).trim().toLowerCase()

    if (!/^[a-z0-9-]+$/.test(locationSlug)) {
        throw new OmegaApiError("Omega location mapping contains an invalid slug", "configuration")
    }

    return locationSlug
}
