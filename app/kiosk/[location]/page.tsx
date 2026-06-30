import { redirect } from "next/navigation"
import { KioskFlow } from "@/components/kiosk/KioskFlow"
import { getDeviceCookie } from "@/lib/auth/device-session"
import { getDeviceByToken } from "@/lib/data/devices"
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-auth"

export default async function KioskPage({
    params,
}: {
    params: Promise<{ location: string }>
}) {
    const { location } = await params

    if (isDevAuthBypassEnabled()) {
        return <KioskFlow location={location} />
    }

    const token = await getDeviceCookie()

    if (!token) {
        redirect("/register")
    }

    const device = await getDeviceByToken(token, "kiosk")

    const deviceLocationSlug = Array.isArray(device.locations)
        ? device.locations[0]?.slug
        : device.locations?.slug

    if (deviceLocationSlug !== location) {
        redirect("/register")
    }

    return <KioskFlow location={location} />
}