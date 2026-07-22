import type { Database } from "@/lib/supabase/types"

export type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"] & {
    arrival_mode?: "lobby" | "vehicle" | null
    vehicle_description?: string | null
    omega_appointment_id?: string | null
    omega_invoice_id?: string | null
    omega_appointment_guid_hash?: string | null
}

export type CheckInQueue = {
    waiting: CheckIn[]
    recent: CheckIn[]
}
