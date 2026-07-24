"use client"

import { useEffect, useState } from "react"

export function useNow() {
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        // Initialize after mount so the server and first client render both use null.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNow(new Date())

        const interval = setInterval(() => {
            setNow(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return now
}
