import 'server-only'

import {
  getMappedOmegaLocationIds,
  getOmegaLocationId,
} from './location-config'
import {
  QuoteOmegaApiError,
  quoteOmegaJsonPost,
  quoteOmegaJsonRequest,
} from './quote-client'
import type { AppointmentAvailability, SchedulingResult } from './quote-types'
import type { ValidatedQuoteSubmission } from './quote-request'
import { buildHeldAppointmentPayload } from './scheduling-request'
import {
  normalizeOmegaAppointmentSlots,
  normalizeOmegaLocation,
  normalizeOmegaQuoteLocations,
  selectMobileSchedulingLocation,
} from './scheduling-contracts'
import {
  createSchedulingToken,
  readSchedulingToken,
  SchedulingTokenError,
  type SchedulingTokenPayload,
} from './scheduling-token'

type AvailabilityInput = {
  kioskLocationSlug: string
  serviceMode: 'mobile' | 'shop'
  shopLocation: string | null
  postalCode: string
}

export type PreparedHeldAppointment = {
  token: SchedulingTokenPayload
}

export class InvalidSchedulingRequestError extends Error {
  constructor() {
    super('The scheduling request is invalid or expired')
    this.name = 'InvalidSchedulingRequestError'
  }
}

export async function getAppointmentAvailability(
  input: AvailabilityInput,
): Promise<AppointmentAvailability> {
  const routingKey = getRoutingKey(input)
  const resolvedLocation = await resolveSchedulingLocation(input)
  const locationPayloadPromise = quoteOmegaJsonRequest(
    `/Locations/${encodeURIComponent(resolvedLocation.id)}`,
  )
  const slotQuery = new URLSearchParams({
    type: input.serviceMode === 'shop' ? 'inshop' : 'mobile',
  })
  const slotsPayloadPromise = quoteOmegaJsonRequest(
    `/Locations/${encodeURIComponent(resolvedLocation.id)}/AppointmentSlots`,
    slotQuery,
  )
  const [locationPayload, slotsPayload] = await Promise.all([
    locationPayloadPromise,
    slotsPayloadPromise,
  ])
  const location = normalizeOmegaLocation(
    locationPayload,
    resolvedLocation.label,
  )
  const windows = normalizeOmegaAppointmentSlots(
    slotsPayload,
    location.timeZone,
  ).filter((window) => window.endTime > Math.floor(Date.now() / 1_000))
  const tokenBase = {
    kioskLocationSlug: input.kioskLocationSlug,
    serviceMode: input.serviceMode,
    routingKey,
    omegaLocationId: location.id,
    omegaLocationLabel: location.label,
  } as const

  return {
    locationLabel: location.label,
    windows: windows.map((window) => ({
      date: window.date,
      start: window.start,
      end: window.end,
      label: window.label,
      token: createSchedulingToken({
        ...tokenBase,
        kind: 'window',
        startTime: window.startTime,
        endTime: window.endTime,
        windowLabel: window.label,
      }),
    })),
    flexibleToken: createSchedulingToken({
      ...tokenBase,
      kind: 'flexible',
      startTime: null,
      endTime: null,
      windowLabel: null,
    }),
  }
}

export function prepareHeldAppointment(
  input: ValidatedQuoteSubmission,
): PreparedHeldAppointment | null {
  const request = input.service.appointmentRequest

  if (request.kind === 'follow_up') return null

  let token: SchedulingTokenPayload

  try {
    token = readSchedulingToken(request.token)
  } catch (error) {
    if (error instanceof SchedulingTokenError) {
      throw new InvalidSchedulingRequestError()
    }
    throw error
  }

  const routingKey =
    input.service.mode === 'shop'
      ? input.service.shopLocation
      : input.customer.zip

  if (
    token.kioskLocationSlug !== input.locationSlug ||
    token.serviceMode !== input.service.mode ||
    token.routingKey !== routingKey ||
    token.kind !== request.kind
  ) {
    throw new InvalidSchedulingRequestError()
  }

  return { token }
}

export async function createHeldAppointment(
  input: ValidatedQuoteSubmission,
  prepared: PreparedHeldAppointment | null,
  invoiceId: string | null,
): Promise<SchedulingResult> {
  if (!prepared || !invoiceId) return { status: 'needs_follow_up' }

  const { token } = prepared
  const holdReason = process.env.OMEGA_KIOSK_HOLD_REASON?.trim()
  const payload = buildHeldAppointmentPayload(
    input,
    token,
    invoiceId,
    holdReason || null,
  )

  try {
    await quoteOmegaJsonPost('/Appointments', payload)
    return { status: 'held' }
  } catch (error) {
    console.error('Kiosk Omega appointment hold failed', {
      location: input.locationSlug,
      serviceMode: input.service.mode,
      omegaLocationId: token.omegaLocationId,
      invoiceId,
      kind: error instanceof Error ? error.name : 'unexpected',
    })
    return { status: 'needs_follow_up' }
  }
}

async function resolveSchedulingLocation(input: AvailabilityInput) {
  if (input.serviceMode === 'shop') {
    if (!input.shopLocation) throw new InvalidSchedulingRequestError()
    return {
      id: getOmegaLocationId(input.shopLocation),
      label: formatLocationName(input.shopLocation),
    }
  }

  const query = new URLSearchParams({ postal_code: input.postalCode })
  let locations = await getQuoteLocations(query)

  if (locations.length === 0) {
    const searchPayload = await quoteOmegaJsonRequest(
      '/Locations/search/',
      query,
    )
    const fallbackLocation = selectMobileSchedulingLocation(
      normalizeOmegaQuoteLocations(searchPayload),
      input.postalCode,
      getMappedOmegaLocationIds(),
    )
    locations = fallbackLocation ? [fallbackLocation] : []
  }

  const location = locations[0]

  if (!location) throw new InvalidSchedulingRequestError()
  return location
}

async function getQuoteLocations(query: URLSearchParams) {
  try {
    const payload = await quoteOmegaJsonRequest('/Locations/Quotes/', query)
    return normalizeOmegaQuoteLocations(payload)
  } catch (error) {
    if (error instanceof QuoteOmegaApiError && error.kind === 'not_found') {
      return []
    }
    throw error
  }
}

function getRoutingKey(input: AvailabilityInput) {
  if (input.serviceMode === 'shop') {
    if (!input.shopLocation) throw new InvalidSchedulingRequestError()
    return input.shopLocation
  }

  return input.postalCode
}

function formatLocationName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}
