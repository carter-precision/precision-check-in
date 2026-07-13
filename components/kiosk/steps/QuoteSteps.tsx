import { ShieldCheck, Wrench } from "lucide-react"

import { ChoiceButton, KioskStep } from "../KioskPrimitives"
import { getOmegaQuoteUrl, type OmegaQuoteType } from "../omega"
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

export function OmegaQuoteStep({
    location,
    type,
}: Pick<KioskStepProps, "location"> & { type: OmegaQuoteType }) {
    const title = type === "cash" ? "Windshield Quote" : type === "rockChip" ? "Rock Chip Repair" : null
    const compact = type === "insurance"

    return (
        <KioskStep>
            <div
                className={`overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white shadow-sm ${
                    compact
                        ? "mb-10 h-[85vh] pb-4 pr-4 pt-4"
                        : "mb-10 flex h-[92vh] flex-col items-center pb-4 pr-4 pt-8"
                }`}
            >
                {title && <h3 className="text-3xl font-bold leading-snug text-[#16262f]">{title}</h3>}
                <iframe src={getOmegaQuoteUrl({ location, type })} className="h-full w-full" />
            </div>
        </KioskStep>
    )
}
