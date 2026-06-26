import { TechDashboard } from "@/components/dashboard/TechDashboard"

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ location: string }>
}) {
    const { location } = await params

    return <TechDashboard location={location} />
}