import 'server-only'

import { isDevAuthBypassEnabled } from '@/lib/auth/dev-auth'
import { getDeviceCookie } from '@/lib/auth/device-session'
import { getDeviceByToken } from '@/lib/data/devices'
import { getLocationBySlug } from '@/lib/data/locations'

export type QuoteKioskContext = {
  locationId: string
  locationSlug: string
}

export class QuoteKioskAuthorizationError extends Error {
  constructor() {
    super('Unauthorized kiosk quote request')
    this.name = 'QuoteKioskAuthorizationError'
  }
}

export async function requireQuoteKiosk(
  suppliedLocationSlug: string,
): Promise<QuoteKioskContext> {
  if (isDevAuthBypassEnabled()) {
    try {
      const location = await getLocationBySlug(suppliedLocationSlug)

      return {
        locationId: location.id,
        locationSlug: location.slug,
      }
    } catch {
      throw new QuoteKioskAuthorizationError()
    }
  }

  const token = await getDeviceCookie()

  if (!token) {
    throw new QuoteKioskAuthorizationError()
  }

  try {
    const device = await getDeviceByToken(token, 'kiosk')
    const deviceLocationSlug = Array.isArray(device.locations)
      ? device.locations[0]?.slug
      : device.locations?.slug

    if (deviceLocationSlug !== suppliedLocationSlug) {
      throw new QuoteKioskAuthorizationError()
    }

    return {
      locationId: device.location_id,
      locationSlug: deviceLocationSlug,
    }
  } catch {
    throw new QuoteKioskAuthorizationError()
  }
}
