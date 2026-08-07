import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { KioskFlow } from '@/components/kiosk/KioskFlow'
import { getDeviceCookie } from '@/lib/auth/device-session'
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
    title: `${formatLocationName(location)} Kiosk`,
    description: 'Customer check-in kiosk for Precision Auto Glass.',
    robots: {
      index: false,
      follow: false,
    },
  }
}

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
    redirect('/register')
  }

  const device = await getDeviceByToken(token, 'kiosk')

  const deviceLocationSlug = Array.isArray(device.locations)
    ? device.locations[0]?.slug
    : device.locations?.slug

  if (deviceLocationSlug !== location) {
    redirect('/register')
  }

  return <KioskFlow location={location} />
}
