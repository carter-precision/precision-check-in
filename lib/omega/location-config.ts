import 'server-only'

import { z } from 'zod'

export class OmegaLocationConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OmegaLocationConfigurationError'
  }
}

export function getOmegaLocationId(locationSlug: string) {
  const mapping = readOmegaLocationMap()
  const match = Object.entries(mapping).find(
    ([, slug]) => normalizeSlug(slug) === normalizeSlug(locationSlug),
  )

  if (!match) {
    throw new OmegaLocationConfigurationError(
      `No Omega location is mapped to ${locationSlug}`,
    )
  }

  return match[0]
}

export function getMappedOmegaLocationIds() {
  return new Set(Object.keys(readOmegaLocationMap()))
}

function readOmegaLocationMap() {
  const rawMapping = process.env.OMEGA_LOCATION_MAP

  if (!rawMapping) {
    throw new OmegaLocationConfigurationError(
      'OMEGA_LOCATION_MAP is not configured',
    )
  }

  let mapping: unknown

  try {
    mapping = JSON.parse(rawMapping)
  } catch {
    throw new OmegaLocationConfigurationError(
      'OMEGA_LOCATION_MAP is invalid JSON',
    )
  }

  const parsed = z
    .record(z.string().regex(/^[1-9]\d*$/), z.string().min(1))
    .safeParse(mapping)

  if (!parsed.success) {
    throw new OmegaLocationConfigurationError(
      'OMEGA_LOCATION_MAP has an invalid value',
    )
  }

  return parsed.data
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase()
}
