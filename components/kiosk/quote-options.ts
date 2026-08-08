import type { GlassType, OmegaGlassPosition, VehicleFeature } from './types'

export const KIOSK_LOCATIONS = [
  { slug: 'layton', label: 'Layton' },
  { slug: 'centerville', label: 'Centerville' },
  { slug: 'ogden', label: 'Ogden' },
  { slug: 'south-jordan', label: 'South Jordan' },
  { slug: 'cedar-city', label: 'Cedar City' },
  { slug: 'st-george', label: 'St. George' },
] as const

export const VEHICLE_FEATURES: Array<{ value: VehicleFeature; label: string }> =
  [
    { value: 'rain', label: 'Rain-sensing wipers' },
    { value: 'hud', label: 'Heads-up display' },
    { value: 'heated', label: 'Heated wiper park' },
    { value: 'adas', label: 'Camera / lane assist' },
    { value: 'acoustic', label: 'Acoustic glass' },
    { value: 'humidity', label: 'Humidity sensor' },
    { value: 'none', label: 'None of these' },
  ]

export const GLASS_OPTIONS: Array<{ value: GlassType; label: string }> = [
  { value: 'windshield', label: 'Windshield' },
  { value: 'driver_front', label: 'Front driver door glass' },
  { value: 'passenger_front', label: 'Front passenger door glass' },
  { value: 'driver_rear', label: 'Rear driver door glass' },
  { value: 'passenger_rear', label: 'Rear passenger door glass' },
  { value: 'quarter', label: 'Quarter glass' },
  { value: 'vent', label: 'Vent glass' },
  { value: 'back', label: 'Back/rear glass' },
  { value: 'sunroof', label: 'Sunroof/moonroof' },
  { value: 'other', label: 'Not sure / multiple pieces' },
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
  driver_front: 'Front driver door glass',
  passenger_front: 'Front passenger door glass',
  driver_rear: 'Rear driver door glass',
  passenger_rear: 'Rear passenger door glass',
  driver_quarter: 'Quarter glass',
  passenger_quarter: 'Quarter glass',
  quarter: 'Quarter glass',
  vent: 'Vent glass',
  back: 'Back/rear glass',
  sunroof: 'Sunroof/moonroof',
  other: 'Not sure / multiple pieces',
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
