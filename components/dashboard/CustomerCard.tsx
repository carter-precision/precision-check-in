import type { ReactNode } from "react"
import { BellRing, CheckCircle2, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { CheckIn } from "./types"

const ATTENTION_THRESHOLD_SECONDS = 8

export function CustomerCard({
    checkIn,
    now,
    onCloseCheckIn,
}: {
    checkIn: CheckIn
    now: Date | null
    onCloseCheckIn: () => void
}) {
    const isClosed = checkIn.status === "closed"
    const elapsedSeconds = now
        ? Math.max(
              0,
              Math.floor((now.getTime() - new Date(checkIn.created_at).getTime()) / 1000),
          )
        : 0
    const needsAttention = !isClosed && elapsedSeconds >= ATTENTION_THRESHOLD_SECONDS

    return (
        <article
            className={`rounded-[1.4rem] border p-5 shadow-sm transition ${
                isClosed
                    ? "border-[#d7e1e3] bg-[#f7f9f9] opacity-75"
                    : needsAttention
                      ? "border-[#e35f5f] bg-[#ffe8e8]"
                      : "border-[#e3b75f] bg-[#fff8e8]"
            }`}
        >
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-2xl font-bold tracking-[-0.03em] text-[#16262f]">
                            {checkIn.customer_name}
                        </h3>
                        {needsAttention && (
                            <span className="rounded-full bg-[#ffc2c2] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#9b0000]">
                                Needs attention
                            </span>
                        )}
                        {isClosed && (
                            <span className="rounded-full bg-[#e5f4ed] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#3b8d65]">
                                Acknowledged
                            </span>
                        )}
                    </div>
                    <div className="text-lg font-medium text-[#6f7f86]">{formatServiceLabel(checkIn)}</div>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold tabular-nums text-muted-foreground shadow-sm">
                    <Clock className="size-4" />
                    {isClosed ? formatClosedLabel(checkIn, now) : formatWaitingLabel(elapsedSeconds)}
                </div>
            </div>

            {!isClosed && (
                <div className="flex items-center justify-end gap-4">
                    <Button
                        className="h-12 rounded-2xl bg-[#2f6975] px-6 text-base font-bold shadow-lg shadow-[#2f6975]/20 hover:bg-[#285a64]"
                        onClick={onCloseCheckIn}
                    >
                        <CheckCircle2 className="size-5" />
                        Acknowledge
                    </Button>
                </div>
            )}
        </article>
    )
}

function formatWaitingLabel(elapsedSeconds: number) {
    if (elapsedSeconds < 60) return `0:${String(elapsedSeconds).padStart(2, "0")}`
    return `${Math.floor(elapsedSeconds / 60)} min`
}

function formatClosedLabel(checkIn: CheckIn, now: Date | null) {
    if (!checkIn.closed_at) return "Acknowledged"

    const elapsedSeconds = now
        ? Math.max(
              0,
              Math.floor((now.getTime() - new Date(checkIn.closed_at).getTime()) / 1000),
          )
        : 0

    if (elapsedSeconds < 60) return "just now"
    return `${Math.floor(elapsedSeconds / 60)} min`
}

function formatServiceLabel(checkIn: CheckIn): ReactNode {
    if (checkIn.visit_type === "appointment") return "Appointment"
    if (checkIn.service_type === "windshield" && checkIn.windshield_intent === "quoted") {
        return "Windshield – Quoted"
    }
    if (checkIn.service_type === "windshield" && checkIn.windshield_intent === "inspection") {
        return "Windshield Inspection"
    }
    if (checkIn.service_type === "rock_chip" && checkIn.payment_type === "cash") {
        return "Rock Chip – Cash"
    }
    if (checkIn.service_type === "rock_chip" && checkIn.payment_type === "insurance") {
        return "Rock Chip – Insurance"
    }
    if (checkIn.service_type === "other") return "Other Service"
    if (checkIn.service_type === "bell") {
        return (
            <span className="flex items-center gap-2">
                <BellRing className="size-5 stroke-2 stroke-yellow-500" />
                Help Requested
            </span>
        )
    }
    return "Unknown Service"
}
