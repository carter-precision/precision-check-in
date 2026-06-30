import { createAdminClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/types"

type CheckInInsert = Database["public"]["Tables"]["check_ins"]["Insert"]
type CheckInRow = Database["public"]["Tables"]["check_ins"]["Row"]

export type CreateCheckInInput = {
    locationSlug: string
    customerName: string
    phone?: string
    visitType: "appointment" | "walk_in"
    serviceType?: "windshield" | "rock_chip" | "other" | null
    paymentType?: "cash" | "insurance" | null
    source: "kiosk" | "phone"
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