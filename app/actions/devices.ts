"use server"

import { redirect } from "next/navigation"
import { registerDevice } from "@/lib/data/devices"
import { setDeviceCookie } from "@/lib/auth/device-session"

export async function registerDeviceAction(formData: FormData) {
    const setupPassword = String(formData.get("setupPassword") || "")
    const locationSlug = String(formData.get("locationSlug") || "")
    const type = String(formData.get("type") || "")
    const name = String(formData.get("name") || "")

    if (setupPassword !== process.env.DEVICE_SETUP_PASSWORD) {
        throw new Error("Invalid setup password")
    }

    if (type !== "dashboard" && type !== "kiosk") {
        throw new Error("Invalid device type")
    }

    const { token } = await registerDevice({
        locationSlug,
        type,
        name: name || `${locationSlug} ${type}`,
    })

    await setDeviceCookie(token)

    if (type === "dashboard") {
        redirect(`/dashboard/${locationSlug}`)
    }

    redirect(`/kiosk/${locationSlug}`)
}