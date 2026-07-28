import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { TechDashboard } from '@/components/dashboard/TechDashboard'
import { getLocationBySlug } from '@/lib/data/locations'
import { getDeviceCookie } from '@/lib/auth/device-session'
import { getActiveDashboardCheckIns } from '@/lib/data/check-ins'
import { getDeviceByToken } from '@/lib/data/devices'
import { isDevAuthBypassEnabled } from '@/lib/auth/dev-auth'
import { formatLocationName } from '@/lib/utils'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>
}): Promise<Metadata> {
  const { location } = await params

  return {
    title: `${formatLocationName(location)} Dashboard`,
    description: 'Live customer activity for the Precision Auto Glass team.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ location: string }>
}) {
  const { location } = await params

  if (isDevAuthBypassEnabled()) {
    const locationRecord = await getLocationBySlug(location)
    const checkIns = await getActiveDashboardCheckIns(location)
    return (
      <TechDashboard
        location={location}
        locationId={locationRecord.id}
        initialCheckIns={checkIns}
      />
    )
  }

  const token = await getDeviceCookie()

  if (!token) {
    redirect('/register')
  }

  const device = await getDeviceByToken(token, 'dashboard')

  const deviceLocationSlug = Array.isArray(device.locations)
    ? device.locations[0]?.slug
    : device.locations?.slug

  if (deviceLocationSlug !== location) {
    redirect('/register')
  }

  const checkIns = await getActiveDashboardCheckIns(location)

  return (
    <TechDashboard
      location={location}
      locationId={device.location_id}
      initialCheckIns={checkIns}
    />
  )
}
