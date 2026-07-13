import { Button } from "@/components/ui/button"

import { INACTIVITY_RESET_MS } from "./useKioskFlow"

export function InactivityWarning({
    onContinue,
    onReset,
}: {
    onContinue: () => void
    onReset: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16262f]/30 px-6 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
                <div className="absolute right-5 top-5">
                    <CountdownPie durationMs={INACTIVITY_RESET_MS} />
                </div>

                <h2 className="mb-3 text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
                    Are you still there?
                </h2>
                <p className="mb-7 text-lg font-medium leading-snug text-muted-foreground">
                    Tap continue to keep checking in.
                </p>

                <div className="grid gap-3">
                    <Button
                        className="h-14 rounded-2xl bg-accent text-lg font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                        onClick={onContinue}
                    >
                        Continue
                    </Button>
                    <Button
                        variant="outline"
                        className="h-14 rounded-2xl border-[#d7e1e3] text-lg font-bold text-muted-foreground"
                        onClick={onReset}
                    >
                        Start over
                    </Button>
                </div>
            </div>
        </div>
    )
}

function CountdownPie({ durationMs }: { durationMs: number }) {
    const radius = 18
    const circumference = 2 * Math.PI * radius

    return (
        <svg className="-rotate-90 size-6" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={radius} fill="none" stroke="#e7f1f2" strokeWidth="8" />
            <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="#6f7f86"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset="0"
                style={{ animation: `countdown-ring ${durationMs}ms linear forwards` }}
            />
        </svg>
    )
}
