import type {
  VehicleMakeOption,
  VehicleModelOption,
  VehicleVariantOption,
  VehicleYearOption,
  VinVehicleResult,
} from '@/lib/omega/quote-types'

type LookupErrorBody = {
  error?: {
    code?: string
    message?: string
  }
}

export class KioskOmegaLookupError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'KioskOmegaLookupError'
  }
}

export function loadVehicleYears(location: string, signal?: AbortSignal) {
  return fetchLookup<VehicleYearOption[]>(
    '/api/kiosk/omega/vehicles/years',
    { location },
    signal,
  )
}

export function loadVehicleMakes(
  location: string,
  year: string,
  signal?: AbortSignal,
) {
  return fetchLookup<VehicleMakeOption[]>(
    '/api/kiosk/omega/vehicles/makes',
    { location, year },
    signal,
  )
}

export function loadVehicleModels(
  location: string,
  year: string,
  makeId: string,
  signal?: AbortSignal,
) {
  return fetchLookup<VehicleModelOption[]>(
    '/api/kiosk/omega/vehicles/models',
    { location, year, makeId },
    signal,
  )
}

export function loadVehicleVariants(
  location: string,
  input: {
    year: string
    makeId: string
    modelId: string
    modifierId: string | null
  },
  signal?: AbortSignal,
) {
  return fetchLookup<VehicleVariantOption[]>(
    '/api/kiosk/omega/vehicles/variants',
    {
      location,
      year: input.year,
      makeId: input.makeId,
      modelId: input.modelId,
      ...(input.modifierId ? { modifierId: input.modifierId } : {}),
    },
    signal,
  )
}

export function loadVehicleByVin(
  location: string,
  vin: string,
  signal?: AbortSignal,
) {
  return fetchLookup<VinVehicleResult>(
    '/api/kiosk/omega/vehicles/vin',
    { location, vin },
    signal,
  )
}

async function fetchLookup<TResult>(
  path: string,
  query: Record<string, string>,
  signal?: AbortSignal,
): Promise<TResult> {
  const search = new URLSearchParams(query)
  const response = await fetch(`${path}?${search}`, {
    cache: 'no-store',
    signal,
  })
  const payload = (await response.json().catch(() => null)) as
    ({ data?: TResult } & LookupErrorBody) | null

  if (!response.ok) {
    throw new KioskOmegaLookupError(
      payload?.error?.code ?? 'lookup_failed',
      payload?.error?.message ?? 'The vehicle lookup could not be completed.',
    )
  }

  if (!payload || payload.data === undefined) {
    throw new KioskOmegaLookupError(
      'invalid_response',
      'The vehicle lookup returned an invalid response.',
    )
  }

  return payload.data
}
