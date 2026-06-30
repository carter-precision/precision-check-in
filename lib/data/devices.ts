import { createAdminClient } from "@/lib/supabase/server"
import { generateDeviceToken, hashDeviceToken } from "@/lib/utils"

export type RegisterDeviceInput = {
    locationSlug: string
    type: "kiosk" | "dashboard"
    name: string
}

export async function registerDevice(input: RegisterDeviceInput) {
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

    const token = generateDeviceToken()
    const tokenHash = hashDeviceToken(token)

    const { data: device, error } = await supabase
        .from("devices")
        .upsert(
            {
                location_id: location.id,
                type: input.type,
                name: input.name,
                token_hash: tokenHash,
                active: true,
                last_seen_at: new Date().toISOString(),
            },
            {
                onConflict: "location_id,type,name",
            },
        )
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return { device, token }
}

export async function getDeviceByToken(token: string, type?: "kiosk" | "dashboard") {
    const supabase = createAdminClient()
    const tokenHash = hashDeviceToken(token)

    let query = supabase
        .from("devices")
        .select("id, location_id, type, name, active, locations(slug)")
        .eq("token_hash", tokenHash)
        .eq("active", true)

    if (type) {
        query = query.eq("type", type)
    }

    const { data, error } = await query.single()

    if (error || !data) {
        throw new Error("Invalid device")
    }

    return data
}