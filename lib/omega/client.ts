import "server-only"

import { z } from "zod"

import type { OmegaAppointment, OmegaInvoice } from "./types"

const DEFAULT_API_URL = "https://app.omegaedi.com/api/2.0"
const DEFAULT_TIMEOUT_MS = 8_000

const stringIdSchema = z.union([z.string(), z.number()]).transform(String)
const nullableStringSchema = z.union([z.string(), z.number(), z.null()]).optional()

const appointmentSchema = z.object({
    id: stringIdSchema,
    guid: z.string().min(1),
    invoice_id: stringIdSchema,
    location_id: stringIdSchema,
    start_time: z.union([z.string(), z.number()]),
    end_time: z.union([z.string(), z.number()]),
    status: z.string(),
    type: z.string(),
})

const appointmentListSchema = z.union([
    z.array(appointmentSchema),
    z.object({ appointments: z.array(appointmentSchema) }).transform((value) => value.appointments),
])

const invoiceSchema = z.object({
    customer_fname: nullableStringSchema,
    customer_surname: nullableStringSchema,
    customer_phone: nullableStringSchema,
    vehicle_year: nullableStringSchema,
    vehicle_make: nullableStringSchema,
    vehicle_model: nullableStringSchema,
    vehicle_description: nullableStringSchema,
})

export class OmegaApiError extends Error {
    constructor(
        message: string,
        readonly kind: "configuration" | "not_found" | "unavailable" | "invalid_response",
    ) {
        super(message)
        this.name = "OmegaApiError"
    }
}

export async function getOmegaInvoice(invoiceId: string): Promise<OmegaInvoice> {
    const payload = await omegaRequest(`/Invoices/${encodeURIComponent(invoiceId)}`)
    const parsed = invoiceSchema.safeParse(payload)

    if (!parsed.success) {
        throw new OmegaApiError("Omega returned an invalid invoice", "invalid_response")
    }

    const customerName = joinValues(parsed.data.customer_fname, parsed.data.customer_surname)
    const vehicleDescription = joinValues(
        parsed.data.vehicle_year,
        parsed.data.vehicle_make,
        parsed.data.vehicle_model,
        parsed.data.vehicle_description,
    )

    if (!customerName) {
        throw new OmegaApiError("Omega invoice is missing a customer name", "invalid_response")
    }

    return {
        customerName,
        phone: normalizeNullableString(parsed.data.customer_phone),
        vehicleDescription: vehicleDescription || null,
    }
}

export async function listOmegaAppointments(input: {
    dateFrom: number
    dateTo: number
}): Promise<OmegaAppointment[]> {
    const query = new URLSearchParams({
        date1: String(input.dateFrom),
        date2: String(input.dateTo),
    })
    const payload = await omegaRequest(`/Appointments?${query.toString()}`)
    const parsed = appointmentListSchema.safeParse(payload)

    if (!parsed.success) {
        throw new OmegaApiError("Omega returned an invalid appointment list", "invalid_response")
    }

    return parsed.data.map((appointment) => ({
        id: appointment.id,
        guid: appointment.guid,
        invoiceId: appointment.invoice_id,
        locationId: appointment.location_id,
        startTime: parseOmegaTimestamp(appointment.start_time),
        endTime: parseOmegaTimestamp(appointment.end_time),
        status: appointment.status.trim().toUpperCase(),
        type: appointment.type.trim().toLowerCase(),
    }))
}

async function omegaRequest(path: string) {
    const apiKey = process.env.OMEGA_API_KEY?.trim()

    if (!apiKey) {
        throw new OmegaApiError("OMEGA_API_KEY is not configured", "configuration")
    }

    const baseUrl = (process.env.OMEGA_API_URL || DEFAULT_API_URL).replace(/\/$/, "")

    let response: Response

    try {
        response = await fetch(`${baseUrl}${path}`, {
            headers: {
                Accept: "application/json",
                api_key: apiKey,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        })
    } catch {
        throw new OmegaApiError("Omega could not be reached", "unavailable")
    }

    if (response.status === 404) {
        throw new OmegaApiError("Omega resource was not found", "not_found")
    }

    if (!response.ok) {
        throw new OmegaApiError(`Omega request failed with status ${response.status}`, "unavailable")
    }

    try {
        return await response.json()
    } catch {
        throw new OmegaApiError("Omega returned invalid JSON", "invalid_response")
    }
}

function parseOmegaTimestamp(value: string | number) {
    if (typeof value === "number") {
        return value < 1_000_000_000_000 ? value * 1_000 : value
    }

    const trimmed = value.trim()
    const numeric = Number(trimmed)

    if (Number.isFinite(numeric)) {
        return numeric < 1_000_000_000_000 ? numeric * 1_000 : numeric
    }

    const parsed = Date.parse(trimmed)

    if (!Number.isFinite(parsed)) {
        throw new OmegaApiError("Omega returned an invalid appointment time", "invalid_response")
    }

    return parsed
}

function normalizeNullableString(value: string | number | null | undefined) {
    if (value === null || value === undefined) return null
    const normalized = String(value).trim()
    return normalized || null
}

function joinValues(...values: Array<string | number | null | undefined>) {
    return values
        .map(normalizeNullableString)
        .filter((value): value is string => Boolean(value))
        .join(" ")
}
