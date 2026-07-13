import { Construction, ShieldCheck, Wrench } from "lucide-react"

import { ChoiceButton, KioskStep } from "../KioskPrimitives"
import type { KioskStepProps } from "../types"

export function QuoteServiceTypeStep({ goTo }: KioskStepProps) {
    return (
        <KioskStep title="What do you need a quote for?">
            <div className="grid gap-4">
                <ChoiceButton
                    icon={<ShieldCheck />}
                    label="Windshield"
                    description="Start a windshield quote."
                    onClick={() =>
                        goTo("windshieldQuotePayType", {
                            quoteSource: "header",
                            serviceType: "windshield",
                            paymentType: null,
                        })
                    }
                />
                <ChoiceButton
                    icon={<Wrench />}
                    label="Rock chip"
                    description="Start a rock chip repair quote."
                    onClick={() =>
                        goTo("rockChipQuote", {
                            quoteSource: "header",
                            serviceType: "rock_chip",
                            paymentType: null,
                        })
                    }
                />
            </div>
        </KioskStep>
    )
}

export function RockChipQuotePlaceholderStep() {
    return (
        <KioskStep title="Rock chip quote">
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-12 text-center">
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
                    <Construction className="size-10" />
                </div>
                <h2 className="text-2xl font-bold text-[#16262f]">Rock chip form coming soon</h2>
                <p className="mt-3 max-w-md text-lg font-medium leading-relaxed text-muted-foreground">
                    Insert rock chip quote form here once the Omega API workflow is ready.
                </p>
            </div>
        </KioskStep>
    )
}
