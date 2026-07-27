import { redirect } from 'next/navigation'

import { isDevAuthBypassEnabled } from '@/lib/auth/dev-auth'
import { getDeviceCookie } from '@/lib/auth/device-session'
import { getDeviceByToken } from '@/lib/data/devices'

import { LegacyKioskFlow } from './LegacyKioskFlow'

export default async function LegacyKioskPage({
  params,
}: {
  params: Promise<{ location: string }>
}) {
  const { location } = await params

  if (isDevAuthBypassEnabled()) {
    return <LegacyKioskFlow location={location} />
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

  return <LegacyKioskFlow location={location} />
}
