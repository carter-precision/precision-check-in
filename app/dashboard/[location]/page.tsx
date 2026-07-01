import { redirect } from "next/navigation"
import { TechDashboard } from "@/components/dashboard/TechDashboard"
import { getLocationBySlug } from "@/lib/data/locations"
import { getDeviceCookie } from "@/lib/auth/device-session"
import { getActiveDashboardCheckIns } from "@/lib/data/check-ins"
import { getDeviceByToken } from "@/lib/data/devices"
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-auth"

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ location: string }>
}) {
    const { location } = await params

    if (isDevAuthBypassEnabled()) {
        const locationRecord = await getLocationBySlug(location)
        const checkIns = await getActiveDashboardCheckIns(location)
        return <TechDashboard location={location} locationId={locationRecord.id} initialCheckIns={checkIns} />
    }

    const token = await getDeviceCookie()

    if (!token) {
        redirect("/register")
    }

    const device = await getDeviceByToken(token, "dashboard")

    const deviceLocationSlug = Array.isArray(device.locations)
        ? device.locations[0]?.slug
        : device.locations?.slug

    if (deviceLocationSlug !== location) {
        redirect("/register")
    }

    const checkIns = await getActiveDashboardCheckIns(location)

    return <TechDashboard location={location} locationId={device.location_id} initialCheckIns={checkIns} />
}