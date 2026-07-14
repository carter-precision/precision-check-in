import { useCallback, useEffect, useState } from "react"

import { createCheckInAction } from "@/app/actions/check-ins"

import { initialKioskData, type KioskData, type StepId } from "./types"

const INACTIVITY_WARNING_MS = 52_000
export const INACTIVITY_RESET_MS = 8_000

export function useKioskFlow(location: string) {
    const [step, setStep] = useState<StepId>("welcome")
    const [, setHistory] = useState<StepId[]>([])
    const [data, setData] = useState<KioskData>(initialKioskData)
    const [lastActivityAt, setLastActivityAt] = useState(() => Date.now())
    const [showInactiveWarning, setShowInactiveWarning] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const updateData = useCallback((partial: Partial<KioskData>) => {
        setData((current) => ({ ...current, ...partial }))
    }, [])

    const goTo = useCallback((nextStep: StepId, partial?: Partial<KioskData>) => {
        if (partial) updateData(partial)

        setHistory((current) => [...current, step])
        setStep(nextStep)
    }, [step, updateData])

    const goBack = useCallback(() => {
        setHistory((current) => {
            const previousStep = current.at(-1)

            setStep(previousStep ?? "welcome")
            return previousStep ? current.slice(0, -1) : []
        })
    }, [])

    const resetFlow = useCallback(() => {
        setData(initialKioskData)
        setHistory([])
        setShowInactiveWarning(false)
        setLastActivityAt(Date.now())
        setStep("welcome")
    }, [])

    const submitCheckIn = useCallback(async (
        overrides?: Partial<KioskData>,
        options: { showSuccess?: boolean } = {},
    ) => {
        if (isSubmitting) return false

        setIsSubmitting(true)
        const finalData = { ...data, ...overrides }

        try {
            await createCheckInAction({
                locationSlug: location,
                customerName: finalData.customerName.trim(),
                visitType: finalData.visitType ?? "walk_in",
                serviceType: finalData.serviceType,
                paymentType: finalData.paymentType,
                source: "kiosk",
                repairAuthorized: finalData.repairAuthorized,
                windshieldIntent: finalData.windshieldIntent,
            })

            if (options.showSuccess ?? true) {
                setHistory([])
                setStep("success")
            }

            return true
        } catch (error) {
            console.error("Failed to create check-in:", error)
            alert("Something went wrong. Please try again.")
            return false
        } finally {
            setIsSubmitting(false)
        }
    }, [data, isSubmitting, location])

    useEffect(() => {
        if (step !== "success") return

        const timeout = setTimeout(resetFlow, 7_000)

        return () => clearTimeout(timeout)
    }, [resetFlow, step])

    useEffect(() => {
        function handleActivity() {
            if (!showInactiveWarning) setLastActivityAt(Date.now())
        }

        window.addEventListener("pointerdown", handleActivity)
        window.addEventListener("keydown", handleActivity)

        return () => {
            window.removeEventListener("pointerdown", handleActivity)
            window.removeEventListener("keydown", handleActivity)
        }
    }, [showInactiveWarning])

    useEffect(() => {
        if (step === "welcome" || step === "success" || showInactiveWarning) return

        const remaining = Math.max(0, INACTIVITY_WARNING_MS - (Date.now() - lastActivityAt))
        const warningTimeout = setTimeout(() => setShowInactiveWarning(true), remaining)

        return () => clearTimeout(warningTimeout)
    }, [step, lastActivityAt, showInactiveWarning])

    useEffect(() => {
        if (!showInactiveWarning) return

        const resetTimeout = setTimeout(resetFlow, INACTIVITY_RESET_MS)

        return () => clearTimeout(resetTimeout)
    }, [resetFlow, showInactiveWarning])

    return {
        step,
        data,
        isSubmitting,
        showInactiveWarning,
        goTo,
        goBack,
        resetFlow,
        updateData,
        submitCheckIn,
        continueAfterInactivity: () => {
            setShowInactiveWarning(false)
            setLastActivityAt(Date.now())
        },
    }
}
