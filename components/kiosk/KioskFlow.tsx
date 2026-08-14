'use client'

import type { ComponentType } from 'react'
import { ArrowLeft, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'

import { InactivityWarning } from './InactivityWarning'
import { KioskHeader, RingTeamButton } from './KioskPrimitives'
import {
  AppointmentStep,
  PaymentTypeStep,
  ServiceTypeStep,
  WelcomeStep,
} from './steps/EntrySteps'
import { NameStep } from './steps/NameStep'
import { QuoteServiceTypeStep } from './steps/QuoteSteps'
import { RockChipContactStep } from './steps/RockChipSteps'
import { SuccessStep } from './steps/SuccessStep'
import { WindshieldIntentStep } from './steps/WindshieldSteps'
import { WindshieldVehicleStep } from './steps/WindshieldQuoteDetailsSteps'
import {
  WindshieldGlassStep,
  WindshieldServiceLocationStep,
} from './steps/WindshieldQuoteServiceSteps'
import { WindshieldQuoteContactStep } from './steps/WindshieldQuoteContactStep'
import { WindshieldInsuranceSuccessStep } from './steps/WindshieldInsuranceSuccessStep'
import { WindshieldAppointmentSuccessStep } from './steps/WindshieldAppointmentSuccessStep'
import { WindshieldQuoteResultStep } from './steps/WindshieldQuoteResultStep'
import type { KioskStepProps, StepId } from './types'
import { useKioskFlow } from './useKioskFlow'

const stepComponents: Partial<Record<StepId, ComponentType<KioskStepProps>>> = {
  welcome: WelcomeStep,
  appointment: AppointmentStep,
  serviceType: ServiceTypeStep,
  paymentType: PaymentTypeStep,
  name: NameStep,
  windshieldIntent: WindshieldIntentStep,
  windshieldVehicle: WindshieldVehicleStep,
  windshieldGlass: WindshieldGlassStep,
  windshieldServiceLocation: WindshieldServiceLocationStep,
  windshieldContact: WindshieldQuoteContactStep,
  windshieldQuoteResult: WindshieldQuoteResultStep,
  windshieldInsuranceSuccess: WindshieldInsuranceSuccessStep,
  windshieldAppointmentSuccess: WindshieldAppointmentSuccessStep,
  rockChipContact: RockChipContactStep,
  success: SuccessStep,
  quoteServiceType: QuoteServiceTypeStep,
}

const showFlowControls: Partial<Record<StepId, boolean>> = {
  welcome: false,
  appointment: false,
  serviceType: true,
  paymentType: true,
  name: true,
  windshieldIntent: true,
  windshieldVehicle: true,
  windshieldGlass: true,
  windshieldServiceLocation: true,
  windshieldContact: true,
  windshieldQuoteResult: false,
  windshieldInsuranceSuccess: false,
  windshieldAppointmentSuccess: false,
  rockChipContact: true,
  success: false,
  quoteServiceType: true,
}

export function KioskFlow({ location }: { location: string }) {
  const now = useNow()
  const flow = useKioskFlow(location)
  const CurrentStep = stepComponents[flow.step] ?? WelcomeStep
  const quoteIsSubmitting =
    flow.isSubmitting || flow.data.quoteSubmissionStatus === 'submitting'
  const clock = now
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
    : ''

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
        <KioskHeader
          clock={clock}
          goTo={flow.goTo}
          disabled={quoteIsSubmitting}
        />

        <div className="flex flex-1 flex-col overflow-x-hidden px-8 pb-8 pt-6">
          <CurrentStep location={location} {...flow} />

          {showFlowControls[flow.step] === true && (
            <div className="mb-2 flex items-center justify-between px-5">
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                disabled={quoteIsSubmitting}
                onClick={flow.goBack}
              >
                <ArrowLeft className="size-5" />
                Back
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border-4 px-4 text-md text-muted-foreground"
                disabled={quoteIsSubmitting}
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
