'use client'

import { useState } from 'react'
import { ArrowLeft, Undo2 } from 'lucide-react'

import type {
  AppointmentAvailability,
  InsuranceCompanyOption,
} from '@/lib/omega/quote-types'
import { Button } from '@/components/ui/button'
import { KioskHeader } from '@/components/kiosk/KioskPrimitives'
import {
  RockChipContactStep,
  RockChipServiceLocationStep,
  RockChipSuccessStep,
} from '@/components/kiosk/steps/RockChipSchedulingSteps'
import { WindshieldInsuranceSuccessStep } from '@/components/kiosk/steps/WindshieldInsuranceSuccessStep'
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
  { value: 'rock-chip-contact-cash', label: 'Rock chip · Cash details' },
  {
    value: 'rock-chip-contact-insurance',
    label: 'Rock chip · Insurance details',
  },
  { value: 'rock-chip-scheduler', label: 'Rock chip · Scheduler' },
  { value: 'rock-chip-success-cash', label: 'Rock chip · Cash success' },
  {
    value: 'rock-chip-success-insurance',
    label: 'Rock chip · Insurance success',
  },
] as const

export type KioskPreviewState = (typeof kioskPreviewOptions)[number]['value']

const previewInsuranceCompanies: InsuranceCompanyOption[] = [
  { id: 'state-farm', label: 'State Farm' },
  { id: 'progressive', label: 'Progressive' },
  { id: 'allstate', label: 'Allstate' },
]

const previewAvailability: AppointmentAvailability = {
  locationLabel: 'Layton',
  flexibleToken: 'preview-flexible',
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
  'windshield-scheduler': 'windshield-glass',
  'windshield-contact-cash': 'windshield-scheduler',
  'windshield-contact-insurance': 'windshield-scheduler',
  'rock-chip-scheduler': 'rock-chip-contact-cash',
}

const outcomeStates = new Set<KioskPreviewState>([
  'windshield-success-cash',
  'windshield-success-insurance',
  'rock-chip-success-cash',
  'rock-chip-success-insurance',
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
      onStateChange(
        submission.payment.mode === 'insurance'
          ? 'rock-chip-success-insurance'
          : 'rock-chip-success-cash',
      )
    } else {
      onStateChange(
        submission.payment.mode === 'insurance'
          ? 'windshield-success-insurance'
          : 'windshield-success-cash',
      )
    }

    return true
  }

  const previewProps: KioskStepProps = {
    data,
    goTo,
    updateData,
    submitCheckIn: async () => false,
    submitQuote,
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
    case 'rock-chip-contact-cash':
    case 'rock-chip-contact-insurance':
      return (
        <RockChipContactStep
          {...previewProps}
          previewInsuranceCompanies={previewInsuranceCompanies}
        />
      )
    case 'rock-chip-scheduler':
      return (
        <RockChipServiceLocationStep
          {...previewProps}
          previewAvailability={previewAvailability}
        />
      )
    case 'rock-chip-success-cash':
    case 'rock-chip-success-insurance':
      return <RockChipSuccessStep {...previewProps} />
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
    quoteSource: 'walk_in',
    insuranceCompanyId: isInsurance ? 'state-farm' : '',
    insuranceCompanyLabel: isInsurance ? 'State Farm' : '',
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
    quoteSchedulingStatus: 'held',
    quoteResult:
      state === 'windshield-success-cash'
        ? {
            invoiceId: '123654',
            total: 389.45,
            scheduling: { status: 'held' },
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
    case 'rockChipServiceLocation':
      return 'rock-chip-scheduler'
    default:
      return null
  }
}
