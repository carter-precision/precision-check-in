import { createAdminClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type CheckInInsert = Database["public"]["Tables"]["check_ins"]["Insert"]
type CheckInRow = Database["public"]["Tables"]["check_ins"]["Row"]

export type CreateCheckInInput = {
    locationSlug: string
    customerName: string
    phone?: string
    visitType: "appointment" | "vehicle_pickup" | "walk_in"
    serviceType?: "windshield" | "rock_chip" | "other" | "bell" | null
    paymentType?: "cash" | "insurance" | null
    source: "kiosk" | "phone"
    windshieldIntent?: "quote" | "inspection" | null
    repairAuthorized?: boolean
}

export type CustomerArrivalMode = "lobby" | "vehicle"

export type CreateVerifiedCustomerCheckInInput = {
    locationSlug: string
    customerName: string
    phone: string | null
    arrivalMode: CustomerArrivalMode
    vehicleDescription: string | null
    omegaAppointmentId: string
    omegaInvoiceId: string
    omegaAppointmentGuidHash: string
}

export async function createCheckIn(input: CreateCheckInInput) {
    const supabase = createAdminClient()

    const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", input.locationSlug)
        .eq("active", true)
        .single()

    if (locationError || !location) {
        throw new Error("Invalid location")
    }

    const newCheckIn: CheckInInsert = {
        location_id: location.id,
        customer_name: input.customerName.trim(),
        phone: input.phone?.trim() || null,
        visit_type: input.visitType,
        service_type: input.serviceType ?? null,
        payment_type: input.paymentType ?? null,
        source: input.source,
        status: "waiting",
        repair_authorized: input.repairAuthorized ?? false,
        windshield_intent: input.windshieldIntent ?? null,
    }

    const { data, error } = await supabase
        .from("check_ins")
        .insert(newCheckIn)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getActiveDashboardCheckIns(locationSlug: string) {
    const supabase = createAdminClient()

    const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", locationSlug)
        .eq("active", true)
        .single()

    if (locationError || !location) {
        throw new Error("Invalid location")
    }

    const recentCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("location_id", location.id)
        .or(`status.eq.waiting,and(status.eq.closed,closed_at.gte.${recentCutoff})`)
        .order("created_at", { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getWaitingCheckIns(locationSlug: string): Promise<CheckInRow[]> {
    const supabase = createAdminClient()

    const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", locationSlug)
        .eq("active", true)
        .single()

    if (locationError || !location) {
        throw new Error("Invalid location")
    }

    const { data, error } = await supabase
        .from("check_ins")
        .select("*")
        .eq("location_id", location.id)
        .eq("status", "waiting")
        .order("created_at", { ascending: true })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function closeCheckIn(id: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("check_ins")
        .update({
            status: "closed",
            closed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createVerifiedCustomerCheckIn(input: CreateVerifiedCustomerCheckInInput) {
    const supabase = createAdminClient()

    const { data: location, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("slug", input.locationSlug)
        .eq("active", true)
        .single()

    if (locationError || !location) {
        throw new Error("Invalid location")
    }

    const newCheckIn: CheckInInsert = {
        location_id: location.id,
        customer_name: input.customerName.trim(),
        phone: input.phone?.trim() || null,
        visit_type: "appointment",
        service_type: null,
        payment_type: null,
        source: "phone",
        status: "waiting",
        repair_authorized: false,
        windshield_intent: null,
        arrival_mode: input.arrivalMode,
        vehicle_description: input.vehicleDescription,
        omega_appointment_id: input.omegaAppointmentId,
        omega_invoice_id: input.omegaInvoiceId,
        omega_appointment_guid_hash: input.omegaAppointmentGuidHash,
    }

    const { data, error } = await supabase
        .from("check_ins")
        .insert(newCheckIn)
        .select()
        .single()

    if (error?.code === "23505") {
        return { status: "already_checked_in" as const }
    }

    if (error) {
        throw new Error(error.message)
    }

    return { status: "created" as const, data }
}
