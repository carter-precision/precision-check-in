import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { KioskStep } from "../KioskPrimitives"
import { getGlassLabel, getLocationLabel } from "../quote-options"
import { getQuotePreview } from "../quote-preview"
import type { KioskData, KioskStepProps } from "../types"

export function WindshieldQuoteResultStep({ data, resetFlow }: KioskStepProps) {
    const preview = getQuotePreview(data)

    return (
        <KioskStep>
            <div className="mx-auto w-full max-w-3xl space-y-6 py-8">
                <div className="rounded-[1.4rem] bg-[#16262f] p-8 text-center text-white shadow-lg">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-tint">
                        {preview.type === "cash" ? "Your estimate" : "Your deductible"}
                    </p>
                    <p className="text-5xl font-bold">
                        {preview.type === "cash"
                            ? `$${preview.low}–$${preview.high}`
                            : preview.deductible}
                    </p>
                    <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-[#c8d4d8]">
                        {preview.type === "cash"
                            ? "Final pricing will be confirmed after we verify the exact glass specification."
                            : `We'll verify coverage with ${data.insuranceCarrier || "your carrier"} before scheduling.`}
                    </p>
                </div>

                <div className="divide-y divide-[#d7e1e3] rounded-[1.4rem] border border-[#d7e1e3] bg-white px-6 shadow-sm">
                    {preview.type === "insurance" && (
                        <SummaryRow label="Carrier" value={data.insuranceCarrier} />
                    )}
                    <SummaryRow label="Vehicle" value={formatVehicle(data)} />
                    <SummaryRow label="Glass" value={getGlassLabel(data.glassType)} />
                    <SummaryRow label="Service" value={formatService(data)} />
                    <SummaryRow label="Preferred date" value={formatDate(data.preferredDate)} />
                    <SummaryRow label="Contact" value={data.customerName} />
                </div>

                <p className="text-center text-sm font-medium leading-relaxed text-muted-foreground">
                    This estimate is sample data while the live Omega pricing connection is being completed.
                </p>

                <Button
                    className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                    onClick={resetFlow}
                >
                    <CheckCircle2 className="size-6" />
                    Finish
                </Button>
            </div>
        </KioskStep>
    )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-6 py-4 text-base">
            <span className="font-semibold text-muted-foreground">{label}</span>
            <span className="text-right font-bold text-[#16262f]">{value || "Not provided"}</span>
        </div>
    )
}

function formatVehicle(data: KioskData) {
    if (data.vin && !data.vinUnknown) return `VIN ending ${data.vin.slice(-4)}`
    return [data.vehicleYear, data.vehicleMake, data.vehicleModel].filter(Boolean).join(" ") || "To be confirmed"
}

function formatService(data: KioskData) {
    if (data.quoteServiceMode === "mobile") return `Mobile — ${data.serviceAddress}`
    if (data.quoteServiceMode === "shop") return `In shop — ${getLocationLabel(data.shopLocation)}`
    return "Not selected"
}

function formatDate(value: string) {
    if (!value) return "No preference"

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value}T00:00:00Z`))
}
