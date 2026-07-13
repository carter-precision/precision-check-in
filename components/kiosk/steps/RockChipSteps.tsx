import { ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { KioskStep } from "../KioskPrimitives"
import type { KioskStepProps } from "../types"

export function RockChipCashAuthorizationStep({
    data,
    updateData,
    goTo,
    isSubmitting,
    pendingRockChipCheckIn,
    startRockChipDelayedCheckIn,
}: KioskStepProps) {
    return (
        <KioskStep title="Repair Authorization">
            <div className="mt-4 space-y-5">
                <div className="rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 text-left shadow-sm">
                    <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                        I authorize Precision Auto Glass to inspect and perform the agreed repair on my vehicle. Resin repairs improve appearance and structural integrity but may leave a faint blemish. I understand a chip can occasionally spread during repair, in which case a replacement may be recommended.
                    </p>
                    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f9f9] p-4">
                        <input
                            type="checkbox"
                            checked={data.repairAuthorized}
                            onChange={(event) => updateData({ repairAuthorized: event.target.checked })}
                            className="mt-1 size-5 accent-accent"
                        />
                        <span className="text-base font-bold leading-snug text-[#16262f]">
                            I have read and agree to the repair authorization.
                        </span>
                    </label>
                </div>
                <Input
                    value={data.customerName}
                    onChange={(event) => updateData({ customerName: event.target.value })}
                    placeholder="Enter your name"
                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                />
                <Button
                    className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                    disabled={
                        isSubmitting ||
                        pendingRockChipCheckIn ||
                        data.customerName.trim().length < 2 ||
                        !data.repairAuthorized
                    }
                    onClick={() => {
                        goTo("rockChipQuote")
                        startRockChipDelayedCheckIn()
                    }}
                >
                    {isSubmitting || pendingRockChipCheckIn ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </KioskStep>
    )
}

export function RockChipInsuranceNameStep({
    data,
    updateData,
    goTo,
    isSubmitting,
    pendingRockChipCheckIn,
    startRockChipDelayedCheckIn,
}: KioskStepProps) {
    return (
        <KioskStep>
            <div className="mt-4 space-y-5">
                <div className="flex flex-col items-center rounded-[1.4rem] border border-[#a9c7ce] bg-accent-tint/50 p-6 text-center shadow-sm">
                    <ShieldCheck className="mx-auto mb-4 size-10 text-accent" />
                    <p className="text-xl font-bold leading-snug text-[#16262f]">We’re thrilled to help you!</p>
                    <p className="mt-3 max-w-150 text-lg font-medium leading-snug text-muted-foreground">
                        Insurance rock chip setups can be a rather arduous process — but we’re here to make things as smooth as possible.
                    </p>
                </div>
                <Input
                    value={data.customerName}
                    onChange={(event) => updateData({ customerName: event.target.value })}
                    placeholder="Enter your name"
                    className="h-16 rounded-2xl border-[#d7e1e3] bg-white text-center text-2xl font-semibold shadow-sm placeholder:text-[#9aa8ad]"
                />
                <Button
                    className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                    disabled={isSubmitting || pendingRockChipCheckIn || data.customerName.trim().length < 2}
                    onClick={() => {
                        goTo("rockChipQuote")
                        startRockChipDelayedCheckIn()
                    }}
                >
                    {isSubmitting || pendingRockChipCheckIn ? "Submitting..." : "Submit"}
                </Button>
            </div>
        </KioskStep>
    )
}
