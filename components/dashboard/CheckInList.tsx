import { AlarmClock } from "lucide-react"

import { CustomerCard } from "./CustomerCard"
import type { CheckInQueue } from "./types"

export function CheckInList({
    queue,
    emptyLabel,
    now,
    onCloseCheckIn,
}: {
    queue: CheckInQueue
    emptyLabel: string
    now: Date | null
    onCloseCheckIn: (id: string) => void
}) {
    return (
        <div className="grid gap-4">
            {queue.waiting.length > 0 ? (
                queue.waiting.map((checkIn) => (
                    <CustomerCard
                        key={checkIn.id}
                        checkIn={checkIn}
                        now={now}
                        onCloseCheckIn={() => onCloseCheckIn(checkIn.id)}
                    />
                ))
            ) : (
                <EmptyState label={emptyLabel} compact={queue.recent.length > 0} />
            )}

            {queue.recent.length > 0 && (
                <div className="mt-3 border-t border-[#d7e1e3] pt-4">
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.07em] text-[#9aa8ad]">
                        Recently acknowledged
                    </p>
                    <div className="grid gap-3">
                        {queue.recent.map((checkIn) => (
                            <CustomerCard
                                key={checkIn.id}
                                checkIn={checkIn}
                                now={now}
                                onCloseCheckIn={() => onCloseCheckIn(checkIn.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
    return (
        <div
            className={`flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-[#d7e1e3] bg-[#f7f9f9] text-center ${
                compact ? "min-h-36" : "min-h-105"
            }`}
        >
            <AlarmClock className="mb-4 size-12 text-[#b6c2c6]" />
            <p className="text-xl font-semibold text-[#9aa8ad]">{label}</p>
        </div>
    )
}
