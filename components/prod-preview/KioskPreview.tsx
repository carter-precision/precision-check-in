'use client'

import { useState } from 'react'
import { ArrowLeft, Undo2 } from 'lucide-react'

import type {
  AppointmentAvailability,
  InsuranceCompanyOption,
} from '@/lib/omega/quote-types'
import { Button } from '@/components/ui/button'
import { KioskHeader } from '@/components/kiosk/KioskPrimitives'
import { RockChipContactStep } from '@/components/kiosk/steps/RockChipSteps'
import { WindshieldInsuranceSuccessStep } from '@/components/kiosk/steps/WindshieldInsuranceSuccessStep'
import { WindshieldAppointmentSuccessStep } from '@/components/kiosk/steps/WindshieldAppointmentSuccessStep'
import { WindshieldQuoteContactStep } from '@/components/kiosk/steps/WindshieldQuoteContactStep'
import { WindshieldVehicleStep } from '@/components/kiosk/steps/WindshieldQuoteDetailsSteps'
import { WindshieldQuoteResultStep } from '@/components/kiosk/steps/WindshieldQuoteResultStep'
import {
  WindshieldGlassStep,
  WindshieldServiceLocationStep,
} from '@/components/kiosk/steps/WindshieldQuoteServiceSteps'
import {
  initialKioskData,
  type KioskData,
  type KioskStepProps,
  type QuoteSubmission,
  type StepId,
} from '@/components/kiosk/types'

export const kioskPreviewOptions = [
  { value: 'windshield-vehicle', label: 'Windshield · VIN / vehicle' },
  { value: 'windshield-glass', label: 'Windshield · Glass diagram' },
  { value: 'windshield-scheduler', label: 'Windshield · Scheduler' },
  { value: 'windshield-contact-cash', label: 'Windshield · Cash details' },
  {
    value: 'windshield-contact-insurance',
    label: 'Windshield · Insurance details',
  },
  { value: 'windshield-success-cash', label: 'Windshield · Cash quote' },
  {
    value: 'windshield-success-insurance',
    label: 'Windshield · Insurance success',
  },
  {
    value: 'windshield-appointment-success',
    label: 'Windshield · Appointment success',
  },
  { value: 'rock-chip-contact-cash', label: 'Rock chip · Cash details' },
  {
    value: 'rock-chip-contact-insurance',
    label: 'Rock chip · Insurance details',
  },
] as const

export type KioskPreviewState = (typeof kioskPreviewOptions)[number]['value']

const previewInsuranceCompanies: InsuranceCompanyOption[] = [
  { id: '1', label: 'State Farm', pricingProfileId: '1' },
  { id: '2', label: 'Progressive', pricingProfileId: '2' },
  { id: '42', label: 'Allstate', pricingProfileId: '13' },
]

const previewAvailability: AppointmentAvailability = {
  locationLabel: 'Layton',
  windows: [
    {
      token: 'preview-morning',
      date: '2026-08-17',
      start: '09:00',
      end: '11:00',
      label: '9:00 AM – 11:00 AM',
    },
    {
      token: 'preview-afternoon',
      date: '2026-08-17',
      start: '13:00',
      end: '15:00',
      label: '1:00 PM – 3:00 PM',
    },
    {
      token: 'preview-next-day',
      date: '2026-08-18',
      start: '10:00',
      end: '12:00',
      label: '10:00 AM – 12:00 PM',
    },
  ],
}

const previousStates: Partial<Record<KioskPreviewState, KioskPreviewState>> = {
  'windshield-glass': 'windshield-vehicle',
  'windshield-contact-cash': 'windshield-glass',
  'windshield-contact-insurance': 'windshield-glass',
  'windshield-scheduler': 'windshield-success-cash',
}

const outcomeStates = new Set<KioskPreviewState>([
  'windshield-success-cash',
  'windshield-success-insurance',
  'windshield-appointment-success',
])

export function KioskPreview({
  state,
  onStateChange,
}: {
  state: KioskPreviewState
  onStateChange: (state: KioskPreviewState) => void
}) {
  const [data, setData] = useState<KioskData>(() => getPreviewData(state))

  function updateData(partial: Partial<KioskData>) {
    setData((current) => ({ ...current, ...partial }))
  }

  function goTo(step: StepId, partial?: Partial<KioskData>) {
    if (partial) updateData(partial)

    const nextState = mapStepToPreviewState(step, data)
    if (nextState) onStateChange(nextState)
  }

  function resetFlow() {
    onStateChange('windshield-vehicle')
  }

  async function submitQuote(submission: QuoteSubmission) {
    if ('serviceType' in submission) {
      return false
    }

    onStateChange(
      submission.payment.mode === 'insurance'
        ? 'windshield-success-insurance'
        : 'windshield-success-cash',
    )

    return true
  }

  async function submitRockChip() {
    return true
  }

  async function submitAppointment() {
    onStateChange('windshield-appointment-success')
    return true
  }

  const previewProps: KioskStepProps = {
    data,
    goTo,
    updateData,
    submitCheckIn: async () => false,
    submitQuote,
    submitAppointment,
    submitRockChip,
    resetFlow,
    isSubmitting: false,
    location: 'layton',
  }
  const previousState = previousStates[state]

  return (
    <main className="min-h-180 bg-background">
      <div className="mx-auto flex min-h-180 w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
        <KioskHeader clock="10:24 AM" goTo={goTo} />

        <div className="flex flex-1 flex-col overflow-x-hidden px-3 pb-8 pt-6 sm:px-8">
          <PreviewStep state={state} previewProps={previewProps} />

          {!outcomeStates.has(state) && (
            <div className="mb-2 flex items-center justify-between px-5">
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                disabled={!previousState}
                onClick={() => previousState && onStateChange(previousState)}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                onClick={resetFlow}
              >
                <Undo2 data-icon="inline-start" />
                Restart
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function PreviewStep({
  state,
  previewProps,
}: {
  state: KioskPreviewState
  previewProps: KioskStepProps
}) {
  switch (state) {
    case 'windshield-vehicle':
      return <WindshieldVehicleStep {...previewProps} />
    case 'windshield-glass':
      return <WindshieldGlassStep {...previewProps} />
    case 'windshield-scheduler':
      return (
        <WindshieldServiceLocationStep
          {...previewProps}
          previewAvailability={previewAvailability}
        />
      )
    case 'windshield-contact-cash':
    case 'windshield-contact-insurance':
      return (
        <WindshieldQuoteContactStep
          {...previewProps}
          previewInsuranceCompanies={previewInsuranceCompanies}
        />
      )
    case 'windshield-success-cash':
      return <WindshieldQuoteResultStep {...previewProps} />
    case 'windshield-success-insurance':
      return <WindshieldInsuranceSuccessStep {...previewProps} />
    case 'windshield-appointment-success':
      return <WindshieldAppointmentSuccessStep {...previewProps} />
    case 'rock-chip-contact-cash':
    case 'rock-chip-contact-insurance':
      return <RockChipContactStep {...previewProps} />
  }
}

function getPreviewData(state: KioskPreviewState): KioskData {
  const isInsurance = state.includes('insurance')
  const isRockChip = state.startsWith('rock-chip')

  return {
    ...initialKioskData,
    visitType: 'walk_in',
    serviceType: isRockChip ? 'rock_chip' : 'windshield',
    paymentType: isInsurance ? 'insurance' : 'cash',
    customerName: 'Jordan',
    phone: '(801) 555-0142',
    email: 'jordan@example.com',
    serviceZip: '84041',
    smsConsent: true,
    windshieldIntent: isRockChip ? null : 'quote',
    quotePayType: isInsurance ? 'insurance' : 'cash',
    repairAuthorized: !isInsurance,
    quoteSource: 'walk_in',
    insuranceCompanyId: isInsurance ? '1' : '',
    insuranceCompanyLabel: isInsurance ? 'State Farm' : '',
    insurancePricingProfileId: isInsurance ? '1' : '',
    policyNumber: isInsurance ? 'SF-2048-UT' : '',
    deductibleAmount: isInsurance ? '500' : '',
    vin: '4T1G11AK5RU123456',
    vehicleYear: '2024',
    vehicleMakeId: 'toyota',
    vehicleMake: 'Toyota',
    vehicleModelId: 'camry',
    vehicleModel: 'Camry',
    vehicleModifierId: null,
    vehicleModifierLabel: null,
    quoteVehicle: {
      year: '2024',
      makeId: 'toyota',
      makeLabel: 'Toyota',
      modelId: 'camry',
      modelLabel: 'Camry',
      modifierId: null,
      modifierLabel: null,
      vehicleId: 'preview-camry',
      variantLabel: '4-door sedan',
      vin: '4T1G11AK5RU123456',
    },
    glassType: 'windshield',
    glassPosition: 'W',
    quoteServiceMode: 'shop',
    shopLocation: 'layton',
    appointmentRequest: {
      kind: 'window',
      token: 'preview-morning',
      date: '2026-08-17',
      start: '09:00',
      end: '11:00',
      label: '9:00 AM – 11:00 AM',
      locationLabel: 'Layton',
    },
    quoteSubmissionStatus: state.includes('success') ? 'succeeded' : 'idle',
    quoteInvoiceId: '123654',
    quoteSchedulingStatus:
      state === 'windshield-appointment-success' ? 'held' : null,
    appointmentSubmissionStatus:
      state === 'windshield-appointment-success' ? 'succeeded' : 'idle',
    quoteResult:
      state === 'windshield-success-cash'
        ? {
            invoiceId: '123654',
            total: 389.45,
          }
        : null,
  }
}

function mapStepToPreviewState(
  step: StepId,
  data: KioskData,
): KioskPreviewState | null {
  switch (step) {
    case 'windshieldVehicle':
      return 'windshield-vehicle'
    case 'windshieldGlass':
      return 'windshield-glass'
    case 'windshieldServiceLocation':
      return 'windshield-scheduler'
    case 'windshieldContact':
      return data.quotePayType === 'insurance'
        ? 'windshield-contact-insurance'
        : 'windshield-contact-cash'
    case 'rockChipContact':
      return data.quotePayType === 'insurance'
        ? 'rock-chip-contact-insurance'
        : 'rock-chip-contact-cash'
    default:
      return null
  }
}
