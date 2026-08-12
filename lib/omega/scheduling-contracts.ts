import { z } from 'zod'

import type { AppointmentWindowOption } from './quote-types'

export class OmegaSchedulingContractError extends Error {
  constructor(contract: string) {
    super(`Omega returned a malformed ${contract} response`)
    this.name = 'OmegaSchedulingContractError'
  }
}

const numericIdSchema = z
  .union([z.string(), z.number().int().positive()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^[1-9]\d*$/))
const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)

const rawLocationSchema = z.object({
  id: numericIdSchema,
  name: z.string().trim().min(1).optional(),
  company: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  active: z.union([z.string(), z.number(), z.boolean()]).optional(),
  serviced: z.union([z.string(), z.number(), z.boolean()]).optional(),
  serviced_postal_code: z.union([z.string(), z.number(), z.null()]).optional(),
  distance: z.union([z.string(), z.number(), z.null()]).optional(),
})

const rawSlotSchema = z.object({
  start: timeSchema,
  end: timeSchema,
})

const rawDaySchema = z.object({
  date: dateSchema,
  appointment_slots: z.array(rawSlotSchema).default([]),
})

export type OmegaSchedulingLocation = {
  id: string
  label: string
  timeZone: string
  serviced: boolean
  servicedPostalCode: string | null
  distance: number | null
}

export type NormalizedAppointmentWindow = Omit<
  AppointmentWindowOption,
  'token'
> & {
  startTime: number
  endTime: number
}

export function normalizeOmegaLocation(
  payload: unknown,
  fallbackLabel: string,
): OmegaSchedulingLocation {
  const parsed = rawLocationSchema.safeParse(payload)

  if (!parsed.success) {
    throw new OmegaSchedulingContractError('location')
  }

  return mapLocation(parsed.data, fallbackLabel)
}

export function normalizeOmegaQuoteLocations(
  payload: unknown,
): OmegaSchedulingLocation[] {
  const parsed = z
    .union([
      z.array(rawLocationSchema),
      z.object({ data: z.array(rawLocationSchema) }),
      z.object({ results: z.array(rawLocationSchema) }),
    ])
    .safeParse(payload)

  if (!parsed.success) {
    throw new OmegaSchedulingContractError('quote locations')
  }

  const locations = Array.isArray(parsed.data)
    ? parsed.data
    : 'data' in parsed.data
      ? parsed.data.data
      : parsed.data.results

  return locations
    .filter((location) => isActive(location.active))
    .map((location) => mapLocation(location, `Location ${location.id}`))
}

export function normalizeOmegaAppointmentSlots(
  payload: unknown,
  timeZone: string,
): NormalizedAppointmentWindow[] {
  const parsed = z
    .union([
      z.array(rawDaySchema),
      z.object({ data: z.array(rawDaySchema) }),
      z.object({ results: z.array(rawDaySchema) }),
    ])
    .safeParse(payload)

  if (!parsed.success) {
    throw new OmegaSchedulingContractError('appointment slots')
  }

  const days = Array.isArray(parsed.data)
    ? parsed.data
    : 'data' in parsed.data
      ? parsed.data.data
      : parsed.data.results
  const windows: NormalizedAppointmentWindow[] = []

  for (const day of days) {
    for (const slot of day.appointment_slots) {
      const startTime = zonedDateTimeToUnixSeconds(
        day.date,
        slot.start,
        timeZone,
      )
      const endTime = zonedDateTimeToUnixSeconds(day.date, slot.end, timeZone)

      if (endTime <= startTime) continue

      windows.push({
        date: day.date,
        start: slot.start,
        end: slot.end,
        label: formatWindowLabel(day.date, slot.start, slot.end, timeZone),
        startTime,
        endTime,
      })
    }
  }

  return windows.sort((left, right) => left.startTime - right.startTime)
}

export function selectMobileSchedulingLocation(
  locations: OmegaSchedulingLocation[],
  postalCode: string,
  mappedLocationIds: Set<string>,
) {
  return locations
    .filter(
      (location) => mappedLocationIds.has(location.id) && location.serviced,
    )
    .sort((left, right) => {
      const leftExact = left.servicedPostalCode === postalCode ? 0 : 1
      const rightExact = right.servicedPostalCode === postalCode ? 0 : 1

      if (leftExact !== rightExact) return leftExact - rightExact
      return (
        (left.distance ?? Number.POSITIVE_INFINITY) -
        (right.distance ?? Number.POSITIVE_INFINITY)
      )
    })[0]
}

function mapLocation(
  location: z.infer<typeof rawLocationSchema>,
  fallbackLabel: string,
): OmegaSchedulingLocation {
  const timeZone = location.timezone ?? defaultTimeZone()

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
  } catch {
    throw new OmegaSchedulingContractError('location timezone')
  }

  return {
    id: location.id,
    label: location.name ?? location.company ?? fallbackLabel,
    timeZone,
    serviced: isActive(location.serviced),
    servicedPostalCode: normalizeNullableString(location.serviced_postal_code),
    distance: normalizeNullableNumber(location.distance),
  }
}

function isActive(value: string | number | boolean | undefined) {
  if (value === undefined) return true
  if (typeof value === 'boolean') return value
  return String(value).trim() !== '0'
}

function defaultTimeZone() {
  return process.env.OMEGA_DEFAULT_TIME_ZONE?.trim() || 'America/Denver'
}

function normalizeNullableString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function normalizeNullableNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : null
}

function zonedDateTimeToUnixSeconds(
  date: string,
  time: string,
  timeZone: string,
) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute)
  let candidate = desiredUtc
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    )
    const representedUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )

    candidate += desiredUtc - representedUtc
  }

  return Math.floor(candidate / 1_000)
}

function formatWindowLabel(
  date: string,
  start: string,
  end: string,
  timeZone: string,
) {
  const startTime = zonedDateTimeToUnixSeconds(date, start, timeZone)
  const endTime = zonedDateTimeToUnixSeconds(date, end, timeZone)
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(startTime * 1_000))
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })

  return `${dateLabel}, ${timeFormatter.format(new Date(startTime * 1_000))}–${timeFormatter.format(new Date(endTime * 1_000))}`
}
