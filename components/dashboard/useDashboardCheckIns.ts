import { useCallback, useEffect, useMemo, useState } from "react"

import { closeCheckInAction } from "@/app/actions/check-ins"
import { createClient } from "@/lib/supabase/client"

import type { CheckIn, CheckInQueue } from "./types"

const RECENTLY_CLOSED_MS = 30 * 60 * 1000

type DashboardQueues = {
    appointments: CheckInQueue
    walkIns: CheckInQueue
}

export function useDashboardCheckIns({
    location,
    locationId,
    initialCheckIns,
    now,
}: {
    location: string
    locationId: string
    initialCheckIns: CheckIn[]
    now: Date | null
}) {
    const [checkIns, setCheckIns] = useState(initialCheckIns)

    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel(`check-ins-${location}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "check_ins",
                    filter: `location_id=eq.${locationId}`,
                },
                (payload) => {
                    setCheckIns((current) => {
                        if (payload.eventType === "INSERT") {
                            return addCheckIn(current, payload.new as CheckIn)
                        }

                        if (payload.eventType === "UPDATE") {
                            return updateCheckIn(current, payload.new as CheckIn)
                        }

                        return current
                    })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [location, locationId])

    const visibleCheckIns = useMemo(
        () => checkIns.filter((checkIn) => isVisibleCheckIn(checkIn, now)),
        [checkIns, now],
    )

    const queues = useMemo(() => groupCheckIns(visibleCheckIns), [visibleCheckIns])
    const waitingCount = queues.appointments.waiting.length + queues.walkIns.waiting.length

    const closeCheckIn = useCallback(
        async (id: string) => {
            const previous = checkIns.find((checkIn) => checkIn.id === id)
            const closedAt = new Date().toISOString()

            setCheckIns((current) =>
                current.map((checkIn) =>
                    checkIn.id === id
                        ? { ...checkIn, status: "closed", closed_at: closedAt }
                        : checkIn,
                ),
            )

            try {
                await closeCheckInAction(id)
            } catch (error) {
                console.error("Failed to close check-in:", error)

                if (previous) {
                    setCheckIns((current) =>
                        current.map((checkIn) => (checkIn.id === id ? previous : checkIn)),
                    )
                }

                alert("Could not acknowledge check-in. Please try again.")
            }
        },
        [checkIns],
    )

    return {
        queues,
        waitingCount,
        closeCheckIn,
    }
}

function addCheckIn(current: CheckIn[], newCheckIn: CheckIn) {
    if (newCheckIn.status !== "waiting") return current
    if (current.some((checkIn) => checkIn.id === newCheckIn.id)) return current

    return sortByCreatedAt([...current, newCheckIn])
}

function updateCheckIn(current: CheckIn[], updatedCheckIn: CheckIn) {
    if (updatedCheckIn.status === "closed" && !updatedCheckIn.closed_at) return current

    const exists = current.some((checkIn) => checkIn.id === updatedCheckIn.id)

    if (!exists && updatedCheckIn.status !== "waiting") return current
    if (!exists) return sortByCreatedAt([...current, updatedCheckIn])

    return current.map((checkIn) =>
        checkIn.id === updatedCheckIn.id ? updatedCheckIn : checkIn,
    )
}

function sortByCreatedAt(checkIns: CheckIn[]) {
    return checkIns.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function isVisibleCheckIn(checkIn: CheckIn, now: Date | null) {
    if (checkIn.status !== "closed") return true
    if (!checkIn.closed_at) return false
    if (!now) return true

    return now.getTime() - new Date(checkIn.closed_at).getTime() < RECENTLY_CLOSED_MS
}

function groupCheckIns(checkIns: CheckIn[]): DashboardQueues {
    const queues: DashboardQueues = {
        appointments: { waiting: [], recent: [] },
        walkIns: { waiting: [], recent: [] },
    }

    for (const checkIn of checkIns) {
        const queue =
            checkIn.visit_type === "appointment"
                ? queues.appointments
                : checkIn.visit_type === "walk_in"
                  ? queues.walkIns
                  : null

        if (!queue) continue

        if (checkIn.status === "waiting") queue.waiting.push(checkIn)
        if (checkIn.status === "closed") queue.recent.push(checkIn)
    }

    return queues
}
