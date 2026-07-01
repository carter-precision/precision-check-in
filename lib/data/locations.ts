import { createAdminClient } from "@/lib/supabase/server"

export async function getLocationBySlug(slug: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from("locations")
        .select("id, slug")
        .eq("slug", slug)
        .eq("active", true)
        .single()

    if (error || !data) {
        throw new Error("Invalid location")
    }

    return data
}