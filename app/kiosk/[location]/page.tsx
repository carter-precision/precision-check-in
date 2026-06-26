// app/kiosk/[location]/page.tsx

import { KioskFlow } from "@/components/kiosk/KioskFlow"

export default async function KioskPage({
    params,
}: {
    params: Promise<{ location: string }>
}) {
    const { location } = await params

    return <KioskFlow location={location} />
}