import { KioskStep } from "../KioskPrimitives"
import { QuoteContinueButton, QuoteField, QuoteForm, QuoteInput } from "../QuoteForm"
import type { KioskStepProps } from "../types"

export function WindshieldQuoteContactStep({ data, updateData, goTo }: KioskStepProps) {
    const canContinue =
        data.customerName.trim().length > 1 && data.phone.replace(/\D/g, "").length >= 7

    return (
        <KioskStep title="Almost there">
            <QuoteForm>
                <p className="text-center text-lg font-medium text-muted-foreground">
                    Where should we send your quote?
                </p>
                <QuoteField id="quote-name" label="Full name">
                    <QuoteInput
                        id="quote-name"
                        value={data.customerName}
                        placeholder="Jane Doe"
                        onChange={(event) => updateData({ customerName: event.target.value })}
                    />
                </QuoteField>
                <QuoteField id="quote-phone" label="Phone">
                    <QuoteInput
                        id="quote-phone"
                        type="tel"
                        inputMode="tel"
                        value={data.phone}
                        placeholder="(801) 555-0100"
                        onChange={(event) => updateData({ phone: event.target.value })}
                    />
                </QuoteField>
                <QuoteField id="quote-email" label="Email" optional>
                    <QuoteInput
                        id="quote-email"
                        type="email"
                        inputMode="email"
                        value={data.email}
                        placeholder="jane@example.com"
                        onChange={(event) => updateData({ email: event.target.value })}
                    />
                </QuoteField>
                <QuoteContinueButton disabled={!canContinue} onClick={() => goTo("windshieldQuoteResult")}>
                    Get my quote
                </QuoteContinueButton>
            </QuoteForm>
        </KioskStep>
    )
}
