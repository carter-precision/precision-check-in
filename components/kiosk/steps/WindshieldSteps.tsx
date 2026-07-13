import { CircleHelp, CreditCard, FileText, ShieldCheck } from "lucide-react"

import { ChoiceButton, KioskStep } from "../KioskPrimitives"
import type { KioskStepProps } from "../types"

export function WindshieldIntentStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="What do you need today?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<FileText />}
                    label="Get a quote and schedule"
                    description="I know I need windshield service and want to start the quote."
                    onClick={() =>
                        goTo("windshieldQuotePayType", {
                            windshieldIntent: "quote",
                            quoteSource: "walk_in",
                        })
                    }
                />
                <ChoiceButton
                    icon={<CircleHelp />}
                    label="Talk to a technician"
                    description="I need help, have questions, or need an on-site inspection."
                    onClick={() =>
                        goTo("name", {
                            windshieldIntent: "inspection",
                            serviceType: "windshield",
                            paymentType: null,
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}

export function WindshieldQuotePayTypeStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="How will you be using the quote?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<ShieldCheck />}
                    label="With insurance"
                    description="Use insurance information for the quote."
                    onClick={() =>
                        goTo("windshieldInsuranceDetails", {
                            quotePayType: "insurance",
                            paymentType: "insurance",
                        })
                    }
                />
                <ChoiceButton
                    icon={<CreditCard />}
                    label="Cash or self-pay"
                    description="Get a quote without using your insurance."
                    onClick={() =>
                        goTo("windshieldVehicle", {
                            quotePayType: "cash",
                            paymentType: "cash",
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}
