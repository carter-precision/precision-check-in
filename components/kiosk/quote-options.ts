import type { GlassType, OmegaGlassPosition } from './types'

export const KIOSK_LOCATIONS = [
  { slug: 'layton', label: 'Layton' },
  { slug: 'centerville', label: 'Centerville' },
  { slug: 'ogden', label: 'Ogden' },
  { slug: 'south-jordan', label: 'South Jordan' },
  { slug: 'cedar-city', label: 'Cedar City' },
  { slug: 'st-george', label: 'St. George' },
] as const

export const GLASS_OPTIONS: Array<{ value: GlassType; label: string }> = [
  { value: 'windshield', label: 'Windshield' },
  { value: 'driver_front', label: 'Door – Front driver' },
  { value: 'passenger_front', label: 'Door – Front passenger' },
  { value: 'driver_rear', label: 'Door – Rear driver' },
  { value: 'passenger_rear', label: 'Door – Rear passenger' },
  { value: 'quarter', label: 'Quarter glass' },
  { value: 'vent', label: 'Vent glass' },
  { value: 'back', label: 'Back/rear glass' },
  { value: 'sunroof', label: 'Sunroof' },
  { value: 'other', label: 'Not sure or multiple pieces' },
]

const GLASS_POSITIONS: Record<GlassType, OmegaGlassPosition | null> = {
  windshield: 'W',
  driver_front: 'D_FRONT_LEFT',
  passenger_front: 'D_FRONT_RIGHT',
  driver_rear: 'D_REAR_LEFT',
  passenger_rear: 'D_REAR_RIGHT',
  driver_quarter: 'Q',
  passenger_quarter: 'Q',
  quarter: 'Q',
  vent: 'V',
  back: 'B',
  sunroof: null,
  other: null,
}

const GLASS_LABELS: Record<GlassType, string> = {
  windshield: 'Windshield',
  driver_front: 'Door – Front driver',
  passenger_front: 'Door – Front passenger',
  driver_rear: 'Door – Rear driver',
  passenger_rear: 'Door – Rear passenger',
  driver_quarter: 'Quarter glass',
  passenger_quarter: 'Quarter glass',
  quarter: 'Quarter glass',
  vent: 'Vent glass',
  back: 'Back/rear glass',
  sunroof: 'Sunroof',
  other: 'Not sure or multiple pieces',
}

export function getLocationLabel(slug: string) {
  return (
    KIOSK_LOCATIONS.find((location) => location.slug === slug)?.label ??
    slug.replaceAll('-', ' ')
  )
}

export function getGlassLabel(value: GlassType | null) {
  return value ? GLASS_LABELS[value] : 'Not selected'
}

export function getGlassPosition(value: GlassType | null) {
  return value ? GLASS_POSITIONS[value] : null
}

export function getGlassDropdownValue(value: GlassType | null) {
  return value === 'driver_quarter' || value === 'passenger_quarter'
    ? 'quarter'
    : value
}

export function isGlassQuoteSupported(value: GlassType | null) {
  return getGlassPosition(value) !== null
}
