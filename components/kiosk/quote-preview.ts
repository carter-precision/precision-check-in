import type { KioskData } from "./types"

export type QuotePreview =
    | { type: "cash"; low: number; high: number }
    | { type: "insurance"; deductible: string }

// Replace this adapter with the Omega API response once its contract is available.
export function getQuotePreview(data: KioskData): QuotePreview {
    if (data.quotePayType === "insurance") {
        return {
            type: "insurance",
            deductible:
                data.knowsDeductible && data.deductibleAmount
                    ? `$${data.deductibleAmount.replace(/^\$/, "")}`
                    : "Pending verification",
        }
    }

    let low = 260
    let high = 340

    if (data.glassType === "windshield") [low, high] = [310, 420]
    if (data.glassType === "back") [low, high] = [240, 320]
    if (["driver_front", "passenger_front"].includes(data.glassType ?? "")) [low, high] = [190, 260]
    if (["driver_rear", "passenger_rear"].includes(data.glassType ?? "")) [low, high] = [170, 230]
    if (["driver_quarter", "passenger_quarter"].includes(data.glassType ?? "")) [low, high] = [140, 195]
    if (data.glassType === "sunroof") [low, high] = [380, 560]

    const extras = data.vehicleFeatures.filter((feature) => feature !== "none").length
    low += extras * 35
    high += extras * 55

    if (data.vehicleFeatures.includes("adas")) {
        low += 120
        high += 180
    }

    return { type: "cash", low, high }
}
