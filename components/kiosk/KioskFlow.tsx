"use client"

import type { ComponentType } from "react"
import { ArrowLeft, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/useNow"

import { InactivityWarning } from "./InactivityWarning"
import {
    KioskHeader,
    PayCashInsteadButton,
    RingTeamButton,
} from "./KioskPrimitives"
import {
    AppointmentStep,
    PaymentTypeStep,
    ServiceTypeStep,
    WelcomeStep,
} from "./steps/EntrySteps"
import { NameStep } from "./steps/NameStep"
import { OmegaQuoteStep, QuoteServiceTypeStep } from "./steps/QuoteSteps"
import {
    RockChipCashAuthorizationStep,
    RockChipInsuranceNameStep,
} from "./steps/RockChipSteps"
import { SuccessStep } from "./steps/SuccessStep"
import {
    WindshieldIntentStep,
    WindshieldQuotePayTypeStep,
} from "./steps/WindshieldSteps"
import type { KioskStepProps, StepId } from "./types"
import { useKioskFlow } from "./useKioskFlow"

const stepComponents: Record<StepId, ComponentType<KioskStepProps>> = {
    welcome: WelcomeStep,
    appointment: AppointmentStep,
    serviceType: ServiceTypeStep,
    paymentType: PaymentTypeStep,
    name: NameStep,
    windshieldIntent: WindshieldIntentStep,
    windshieldQuotePayType: WindshieldQuotePayTypeStep,
    windshieldInsuranceQuote: ({ location }) => <OmegaQuoteStep location={location} type="insurance" />,
    windshieldCashQuote: ({ location }) => <OmegaQuoteStep location={location} type="cash" />,
    rockChipCashAuthorization: RockChipCashAuthorizationStep,
    rockChipInsuranceName: RockChipInsuranceNameStep,
    success: SuccessStep,
    quoteServiceType: QuoteServiceTypeStep,
    rockChipQuote: ({ location }) => <OmegaQuoteStep location={location} type="rockChip" />,
}

const showFlowControls: Record<StepId, boolean> = {
    welcome: false,
    appointment: false,
    serviceType: true,
    paymentType: true,
    name: true,
    windshieldIntent: true,
    windshieldQuotePayType: true,
    windshieldInsuranceQuote: false,
    windshieldCashQuote: false,
    rockChipCashAuthorization: true,
    rockChipInsuranceName: true,
    success: false,
    quoteServiceType: true,
    rockChipQuote: false,
}

export function KioskFlow({ location }: { location: string }) {
    const now = useNow()
    const flow = useKioskFlow(location)
    const CurrentStep = stepComponents[flow.step]
    const clock = now
        ? new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
          }).format(now)
        : ""

    return (
        <main className="min-h-screen">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 md:px-12">
                <KioskHeader clock={clock} goTo={flow.goTo} />

                <div className="flex flex-1 flex-col overflow-hidden px-8 pb-8 pt-6">
                    <CurrentStep location={location} {...flow} />

                    {showFlowControls[flow.step] && (
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

                    {flow.step === "appointment" && (
                        <RingTeamButton
                            onClick={() =>
                                flow.goTo("name", {
                                    visitType: "walk_in",
                                    serviceType: "bell",
                                    paymentType: null,
                                })
                            }
                        />
                    )}

                    {flow.step === "rockChipInsuranceName" && (
                        <PayCashInsteadButton
                            onClick={() =>
                                flow.goTo("rockChipCashAuthorization", {
                                    paymentType: "cash",
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
