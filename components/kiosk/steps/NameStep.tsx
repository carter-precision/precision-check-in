import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { KioskStep } from "../KioskPrimitives"
import type { KioskStepProps } from "../types"

export function NameStep({
    data,
    updateData,
    submitCheckIn,
    isSubmitting,
}: KioskStepProps) {
    return (
        <KioskStep title="What's your name?">
            <div className="mt-8 space-y-5">
                <Input
                    value={data.customerName}
                    onChange={(event) => updateData({ customerName: event.target.value })}
                    placeholder="Enter your name"
                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                />
                <Button
                    className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                    disabled={isSubmitting || data.customerName.trim().length < 2}
                    onClick={() => submitCheckIn()}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </KioskStep>
    )
}
