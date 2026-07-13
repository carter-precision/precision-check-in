import type { Database } from "@/lib/supabase/types"

export type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"]

export type CheckInQueue = {
    waiting: CheckIn[]
    recent: CheckIn[]
}
