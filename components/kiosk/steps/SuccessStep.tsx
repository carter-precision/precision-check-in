import { CheckCircle2 } from "lucide-react"

import { KioskStep } from "../KioskPrimitives"

export function SuccessStep() {
    return (
        <KioskStep>
            <div className="-mt-30 flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-[#e5f4ed] text-[#3b8d65]">
                    <CheckCircle2 className="h-14 w-14" />
                </div>
                <h1 className="mb-4 text-5xl font-semibold tracking-[-0.04em] text-[#16262f]">You're checked in</h1>
                <p className="max-w-sm text-xl font-medium leading-snug text-muted-foreground">
                    Please take a seat and a technician will be with you shortly.
                </p>
            </div>
        </KioskStep>
    )
}
