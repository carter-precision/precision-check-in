import { useCallback, useEffect, useRef, useState } from 'react'

import { createCheckInAction } from '@/app/actions/check-ins'

import {
  KioskQuoteSubmissionError,
  submitKioskOmegaQuote,
} from './omega-quote-submit'
import {
  KioskAppointmentSubmissionError,
  submitKioskOmegaAppointment,
} from './omega-appointment-submit'
import {
  emptyQuoteOutcomeData,
  initialKioskData,
  type KioskData,
  type QuoteSubmission,
  type RockChipSubmission,
  type StepId,
  type WindshieldAppointmentSubmission,
} from './types'

const INACTIVITY_WARNING_MS = 72_000
export const INACTIVITY_RESET_MS = 8_000

const quoteInputKeys = new Set<keyof KioskData>([
  'customerName',
  'phone',
  'email',
  'serviceZip',
  'smsConsent',
  'paymentType',
  'quotePayType',
  'insuranceCompanyId',
  'insuranceCompanyLabel',
  'insurancePricingProfileId',
  'policyNumber',
  'deductibleAmount',
  'vin',
  'vinUnknown',
  'vehicleYear',
  'vehicleMakeId',
  'vehicleMake',
  'vehicleModelId',
  'vehicleModel',
  'vehicleModifierId',
  'vehicleModifierLabel',
  'quoteVehicle',
  'glassType',
  'glassPosition',
])

const appointmentInputKeys = new Set<keyof KioskData>([
  'quoteServiceMode',
  'serviceAddress',
  'shopLocation',
  'appointmentRequest',
])

export function useKioskFlow(location: string) {
  const [step, setStep] = useState<StepId>('welcome')
  const [, setHistory] = useState<StepId[]>([])
  const [data, setData] = useState<KioskData>(initialKioskData)
  const lastActivityAt = useRef<number | null>(null)
  const [showInactiveWarning, setShowInactiveWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const quoteRequestInFlight = useRef(false)

  const updateData = useCallback((partial: Partial<KioskData>) => {
    const changesQuoteInput = Object.keys(partial).some((key) =>
      quoteInputKeys.has(key as keyof KioskData),
    )
    const changesAppointmentInput = Object.keys(partial).some((key) =>
      appointmentInputKeys.has(key as keyof KioskData),
    )

    setData((current) => ({
      ...current,
      ...(changesQuoteInput ? emptyQuoteOutcomeData : {}),
      ...(changesAppointmentInput
        ? {
            quoteSchedulingStatus: null,
            appointmentSubmissionStatus: 'idle' as const,
            appointmentSubmissionError: null,
          }
        : {}),
      ...partial,
    }))
  }, [])

  const goTo = useCallback(
    (nextStep: StepId, partial?: Partial<KioskData>) => {
      if (quoteRequestInFlight.current) return
      if (partial) updateData(partial)

      setHistory((current) => [...current, step])
      setStep(nextStep)
    },
    [step, updateData],
  )

  const goBack = useCallback(() => {
    if (quoteRequestInFlight.current) return

    setHistory((current) => {
      const previousStep = current.at(-1)

      setStep(previousStep ?? 'welcome')
      return previousStep ? current.slice(0, -1) : []
    })
  }, [])

  const resetFlow = useCallback(() => {
    if (quoteRequestInFlight.current) return

    setData(initialKioskData)
    setHistory([])
    setShowInactiveWarning(false)
    lastActivityAt.current = Date.now()
    setStep('welcome')
  }, [])

  const submitQuote = useCallback(
    async (submission: QuoteSubmission) => {
      if ('serviceType' in submission) return false
      if (quoteRequestInFlight.current) return false

      quoteRequestInFlight.current = true
      setShowInactiveWarning(false)
      setData((current) => ({
        ...current,
        quoteSubmission: submission,
        quoteSubmissionStatus: 'submitting',
        quoteSubmissionError: null,
        quoteResult: null,
        quoteInvoiceId: null,
        quoteSchedulingStatus: null,
      }))

      try {
        const result = await submitKioskOmegaQuote(submission)

        if ('kind' in result) {
          if (result.kind === 'rock_chip_acknowledgement') {
            throw new KioskQuoteSubmissionError(
              'The quote service returned an invalid result.',
              'invalid_success_response',
            )
          }

          setData((current) => ({
            ...current,
            quoteSubmissionStatus: 'succeeded',
            quoteSubmissionError: null,
            quoteResult: null,
            quoteInvoiceId: result.invoiceId,
            quoteSchedulingStatus: null,
          }))
          setHistory((current) => [...current, step])
          setStep(
            result.kind === 'manual_quote_lead_acknowledgement'
              ? 'windshieldManualQuoteSuccess'
              : 'windshieldInsuranceSuccess',
          )
          return true
        }

        setData((current) => ({
          ...current,
          quoteSubmissionStatus: 'succeeded',
          quoteSubmissionError: null,
          quoteResult: result,
          quoteInvoiceId: result.invoiceId,
          quoteSchedulingStatus: null,
        }))
        setHistory((current) => [...current, step])
        setStep('windshieldQuoteResult')
        return true
      } catch (error) {
        const knownError =
          error instanceof KioskQuoteSubmissionError ? error : null
        setData((current) => ({
          ...current,
          quoteSubmissionStatus: 'failed',
          quoteSubmissionError:
            knownError?.message ??
            "We couldn't complete your quote. Please try again.",
          quoteResult: null,
          quoteInvoiceId: null,
          quoteSchedulingStatus: null,
        }))
        return false
      } finally {
        quoteRequestInFlight.current = false
      }
    },
    [step],
  )

  const submitAppointment = useCallback(
    async (submission: WindshieldAppointmentSubmission) => {
      if (quoteRequestInFlight.current) return false

      quoteRequestInFlight.current = true
      setShowInactiveWarning(false)
      setData((current) => ({
        ...current,
        appointmentSubmissionStatus: 'submitting',
        appointmentSubmissionError: null,
        quoteSchedulingStatus: null,
      }))

      try {
        const result = await submitKioskOmegaAppointment(submission)
        setData((current) => ({
          ...current,
          appointmentSubmissionStatus: 'succeeded',
          appointmentSubmissionError: null,
          quoteSchedulingStatus: result.status,
        }))
        setHistory((current) => [...current, step])
        setStep('windshieldAppointmentSuccess')
        return true
      } catch (error) {
        const knownError =
          error instanceof KioskAppointmentSubmissionError ? error : null
        setData((current) => ({
          ...current,
          appointmentSubmissionStatus: 'failed',
          appointmentSubmissionError:
            knownError?.message ??
            "We couldn't schedule your service. Please try again.",
          quoteSchedulingStatus: null,
        }))
        return false
      } finally {
        quoteRequestInFlight.current = false
      }
    },
    [step],
  )

  const submitRockChip = useCallback(
    async (submission: RockChipSubmission) => {
      if (quoteRequestInFlight.current || isSubmitting) return false

      quoteRequestInFlight.current = true
      setIsSubmitting(true)
      setShowInactiveWarning(false)

      setData((current) => ({
        ...current,
        quoteSubmission: submission,
        quoteSubmissionStatus: 'submitting',
        quoteSubmissionError: null,
        quoteResult: null,
        quoteSchedulingStatus: null,
      }))

      try {
        const [omegaResult, dashboardResult] = await Promise.allSettled([
          submitKioskOmegaQuote(submission),
          createCheckInAction({
            locationSlug: location,
            customerName: submission.customer.firstName,
            phone: submission.customer.phone,
            visitType: 'walk_in',
            serviceType: 'rock_chip',
            paymentType: submission.payment.mode,
            source: 'kiosk',
            repairAuthorized:
              submission.payment.mode === 'cash' && data.repairAuthorized,
            windshieldIntent: null,
          }),
        ])

        if (
          omegaResult.status === 'rejected' ||
          !('kind' in omegaResult.value) ||
          omegaResult.value.kind !== 'rock_chip_acknowledgement'
        ) {
          console.error(
            'Rock chip Omega lead submission failed:',
            omegaResult.status === 'rejected'
              ? omegaResult.reason
              : 'invalid acknowledgement',
          )
        }

        if (dashboardResult.status === 'rejected') {
          console.error(
            'Failed to create rock chip dashboard check-in:',
            dashboardResult.reason,
          )
        }

        setData((current) => ({
          ...current,
          quoteSubmissionStatus: 'succeeded',
          quoteSubmissionError: null,
          quoteResult: null,
          quoteSchedulingStatus: null,
        }))
        setHistory([])
        setStep('success')
        return true
      } finally {
        quoteRequestInFlight.current = false
        setIsSubmitting(false)
      }
    },
    [data.repairAuthorized, isSubmitting, location],
  )

  const submitCheckIn = useCallback(
    async (
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
          phone: finalData.phone.trim() || undefined,
          visitType: finalData.visitType ?? 'walk_in',
          serviceType: finalData.serviceType,
          paymentType: finalData.paymentType,
          source: 'kiosk',
          repairAuthorized: finalData.repairAuthorized,
          windshieldIntent: finalData.windshieldIntent,
        })

        if (options.showSuccess ?? true) {
          setHistory([])
          setStep('success')
        }

        return true
      } catch (error) {
        console.error('Failed to create check-in:', error)
        alert('Something went wrong. Please try again.')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [data, isSubmitting, location],
  )

  useEffect(() => {
    if (step !== 'success') return

    const timeout = setTimeout(resetFlow, 7_000)

    return () => clearTimeout(timeout)
  }, [resetFlow, step])

  useEffect(() => {
    function handleActivity() {
      if (!showInactiveWarning) lastActivityAt.current = Date.now()
    }

    window.addEventListener('pointerdown', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
  }, [showInactiveWarning])

  useEffect(() => {
    if (
      step === 'welcome' ||
      step === 'success' ||
      showInactiveWarning ||
      data.quoteSubmissionStatus === 'submitting'
    ) {
      return
    }

    let warningTimeout: ReturnType<typeof setTimeout>

    function scheduleWarning() {
      const lastActivity = lastActivityAt.current ?? Date.now()
      lastActivityAt.current = lastActivity
      const remaining = Math.max(
        0,
        INACTIVITY_WARNING_MS - (Date.now() - lastActivity),
      )

      warningTimeout = setTimeout(() => {
        const latestActivity = lastActivityAt.current ?? Date.now()
        lastActivityAt.current = latestActivity

        if (Date.now() - latestActivity >= INACTIVITY_WARNING_MS) {
          setShowInactiveWarning(true)
          return
        }

        scheduleWarning()
      }, remaining)
    }

    scheduleWarning()

    return () => clearTimeout(warningTimeout)
  }, [data.quoteSubmissionStatus, step, showInactiveWarning])

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
    submitQuote,
    submitAppointment,
    submitRockChip,
    continueAfterInactivity: () => {
      setShowInactiveWarning(false)
      lastActivityAt.current = Date.now()
    },
  }
}
