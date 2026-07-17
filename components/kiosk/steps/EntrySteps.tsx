import { CalendarCheck, CarFront, CircleHelp, CreditCard, KeyRound, ShieldCheck, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"

import { ChoiceButton, KioskStep } from "../KioskPrimitives"
import type { KioskStepProps } from "../types"

export function WelcomeStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep>
            <div className="-mt-30 flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="mb-4 text-5xl font-semibold tracking-[-0.04em]">Happy to see you!</h1>
                <p className="mb-10 max-w-sm text-xl font-medium leading-snug text-muted-foreground">
                    Let&apos;s get things rolling.
                </p>
                <Button
                    className="h-20 w-70 rounded-full bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
                    onClick={() => goTo("appointment")}
                >
                    Tap to check in
                </Button>
            </div>
        </KioskStep>
    )
}

export function AppointmentStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="Do you have an appointment?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<CalendarCheck />}
                    label="Yes, I have an appointment"
                    description="We’ll let the shop know you’re here."
                    onClick={() =>
                        goTo("name", {
                            visitType: "appointment",
                            serviceType: null,
                            paymentType: null,
                        })
                    }
                />

                <ChoiceButton
                    icon={<CarFront />}
                    label="No, I’m a walk-in"
                    description="A technician will come assist you."
                    onClick={() =>
                        goTo("serviceType", {
                            visitType: "walk_in",
                            serviceType: null,
                            paymentType: null,
                        })
                    }
                />

                <ChoiceButton
                    icon={<KeyRound />}
                    label="I’m picking up my vehicle"
                    description="We’ll be right out with your keys."
                    onClick={() =>
                        goTo("name", {
                            visitType: "vehicle_pickup",
                            serviceType: null,
                            paymentType: null,
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}

export function ServiceTypeStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="How can we help?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<ShieldCheck />}
                    label="Windshield"
                    description="For windshield service or replacement."
                    onClick={() =>
                        goTo("windshieldIntent", {
                            quoteSource: "walk_in",
                            serviceType: "windshield",
                            paymentType: null,
                        })
                    }
                />
                <ChoiceButton
                    icon={<Wrench />}
                    label="Rock chip"
                    description="Repair for small chips or cracks."
                    onClick={() =>
                        goTo("paymentType", {
                            serviceType: "rock_chip",
                            paymentType: null,
                        })
                    }
                />
                <ChoiceButton
                    icon={<CircleHelp />}
                    label="Something else"
                    description="A technician will help sort it out."
                    onClick={() =>
                        goTo("name", {
                            serviceType: "other",
                            paymentType: null,
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}

export function PaymentTypeStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="How would you like to pay?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<CreditCard />}
                    label="Cash pay"
                    description="You’ll pay directly for the repair."
                    trailing={<div className="-mt-1 text-3xl font-bold tracking-tight text-accent">$79.99</div>}
                    onClick={() =>
                        goTo("rockChipCashAuthorization", {
                            paymentType: "cash",
                            repairAuthorized: false,
                        })
                    }
                />
                <ChoiceButton
                    icon={<ShieldCheck />}
                    label="Insurance"
                    description="Often covered at no cost."
                    onClick={() =>
                        goTo("rockChipInsuranceName", {
                            paymentType: "insurance",
                            repairAuthorized: false,
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}
