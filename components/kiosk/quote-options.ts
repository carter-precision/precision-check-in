import type { GlassType, VehicleFeature } from "./types"

export const KIOSK_LOCATIONS = [
    { slug: "layton", label: "Layton" },
    { slug: "centerville", label: "Centerville" },
    { slug: "ogden", label: "Ogden" },
    { slug: "south-jordan", label: "South Jordan" },
    { slug: "cedar-city", label: "Cedar City" },
    { slug: "st-george", label: "St. George" },
] as const

export const INSURANCE_CARRIERS = [
    "State Farm",
    "Progressive",
    "Geico",
    "Allstate",
    "Farmers",
    "USAA",
    "Liberty Mutual",
    "Nationwide",
]

export const VEHICLE_FEATURES: Array<{ value: VehicleFeature; label: string }> = [
    { value: "rain", label: "Rain-sensing wipers" },
    { value: "hud", label: "Heads-up display" },
    { value: "heated", label: "Heated wiper park" },
    { value: "adas", label: "Camera / lane assist" },
    { value: "acoustic", label: "Acoustic glass" },
    { value: "humidity", label: "Humidity sensor" },
    { value: "none", label: "None of these" },
]

export const GLASS_OPTIONS: Array<{ value: GlassType; label: string }> = [
    { value: "windshield", label: "Windshield" },
    { value: "back", label: "Back glass" },
    { value: "driver_front", label: "Driver front window" },
    { value: "driver_rear", label: "Driver rear window" },
    { value: "driver_quarter", label: "Driver quarter glass" },
    { value: "passenger_front", label: "Passenger front window" },
    { value: "passenger_rear", label: "Passenger rear window" },
    { value: "passenger_quarter", label: "Passenger quarter glass" },
    { value: "sunroof", label: "Sunroof / moonroof" },
    { value: "other", label: "Not sure / multiple pieces" },
]

const newestModelYear = new Date().getFullYear() + 1
export const VEHICLE_YEARS = Array.from({ length: 30 }, (_, index) =>
    String(newestModelYear - index),
)

export function getLocationLabel(slug: string) {
    return KIOSK_LOCATIONS.find((location) => location.slug === slug)?.label ?? slug.replaceAll("-", " ")
}

export function getGlassLabel(value: GlassType | null) {
    return GLASS_OPTIONS.find((option) => option.value === value)?.label ?? "Not selected"
}
