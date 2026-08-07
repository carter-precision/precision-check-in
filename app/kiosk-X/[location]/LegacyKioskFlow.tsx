'use client'

import type { ComponentType } from 'react'
import { ArrowLeft, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { InactivityWarning } from '@/components/kiosk/InactivityWarning'
import {
  KioskHeader,
  PayCashInsteadButton,
  RingTeamButton,
} from '@/components/kiosk/KioskPrimitives'
import {
  AppointmentStep,
  PaymentTypeStep,
  ServiceTypeStep,
  WelcomeStep,
} from '@/components/kiosk/steps/EntrySteps'
import { NameStep } from '@/components/kiosk/steps/NameStep'
import { QuoteServiceTypeStep } from '@/components/kiosk/steps/QuoteSteps'
import { SuccessStep } from '@/components/kiosk/steps/SuccessStep'
import {
  WindshieldIntentStep,
  WindshieldQuotePayTypeStep,
} from '@/components/kiosk/steps/WindshieldSteps'
import type { KioskStepProps, StepId } from '@/components/kiosk/types'
import { useKioskFlow } from '@/components/kiosk/useKioskFlow'

import {
  LegacyRockChipCashAuthorizationStep,
  LegacyRockChipInsuranceNameStep,
} from './LegacyRockChipSteps'
import {
  LegacyRockChipQuoteStep,
  LegacyWindshieldCashQuoteStep,
  LegacyWindshieldInsuranceQuoteStep,
} from './LegacyQuoteSteps'

const legacyStepComponents: Partial<
  Record<StepId, ComponentType<KioskStepProps>>
> = {
  welcome: WelcomeStep,
  appointment: AppointmentStep,
  serviceType: ServiceTypeStep,
  paymentType: PaymentTypeStep,
  name: NameStep,
  windshieldIntent: WindshieldIntentStep,
  windshieldQuotePayType: WindshieldQuotePayTypeStep,
  windshieldInsuranceDetails: LegacyWindshieldInsuranceQuoteStep,
  windshieldVehicle: LegacyWindshieldCashQuoteStep,
  rockChipCashAuthorization: LegacyRockChipCashAuthorizationStep,
  rockChipInsuranceName: LegacyRockChipInsuranceNameStep,
  success: SuccessStep,
  quoteServiceType: QuoteServiceTypeStep,
  rockChipQuote: LegacyRockChipQuoteStep,
}

export function LegacyKioskFlow({ location }: { location: string }) {
  const now = useNow()
  const flow = useKioskFlow(location)
  const CurrentStep = legacyStepComponents[flow.step]
  const clock = now
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
    : ''
  const showFlowControls =
    flow.step !== 'welcome' &&
    flow.step !== 'appointment' &&
    flow.step !== 'success'

  if (!CurrentStep) {
    throw new Error(`Unsupported legacy kiosk step: ${flow.step}`)
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
        <KioskHeader clock={clock} goTo={flow.goTo} />

        <div className="flex flex-1 flex-col overflow-hidden px-8 pb-8 pt-6">
          <CurrentStep location={location} {...flow} />

          {showFlowControls && (
            <div className="mb-2 flex items-center justify-between px-5">
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                onClick={flow.goBack}
              >
                <ArrowLeft className="size-5" />
                Back
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                onClick={flow.resetFlow}
              >
                <Undo2 className="size-5" />
                Restart
              </Button>
            </div>
          )}

          {flow.step === 'appointment' && (
            <RingTeamButton
              onClick={() =>
                flow.goTo('name', {
                  visitType: 'walk_in',
                  serviceType: 'bell',
                  paymentType: null,
                })
              }
            />
          )}

          {flow.step === 'rockChipInsuranceName' && (
            <PayCashInsteadButton
              onClick={() =>
                flow.goTo('rockChipCashAuthorization', {
                  paymentType: 'cash',
                  repairAuthorized: false,
                })
              }
            />
          )}
        </div>
      </div>

      {flow.showInactiveWarning && (
        <InactivityWarning
          onContinue={flow.continueAfterInactivity}
          onReset={flow.resetFlow}
        />
      )}
    </main>
  )
}
