import { CreditCard, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import {
  buildRockChipSubmission,
  isValidQuoteEmail,
  isValidQuotePhone,
} from '../quote-submission'
import {
  QuoteContinueButton,
  QuoteField,
  QuoteForm,
  QuoteInput,
} from '../QuoteForm'
import type { KioskStepProps } from '../types'
import { VehicleLookupFields } from './WindshieldQuoteDetailsSteps'

export function RockChipContactStep({
  data,
  updateData,
  submitRockChip,
  location,
  isSubmitting,
}: KioskStepProps) {
  const isInsurance = data.quotePayType === 'insurance'
  const submission = buildRockChipSubmission(data, location)
  const phoneIsValid = isValidQuotePhone(data.phone)
  const emailIsValid = isValidQuoteEmail(data.email)
  const submitting = isSubmitting || data.quoteSubmissionStatus === 'submitting'

  return (
    <KioskStep title="Rock chip repair">
      <QuoteForm>
        {isInsurance ? (
          <div className="flex flex-col items-center gap-3 rounded-[1.4rem] bg-accent-tint/50 p-6 text-center shadow-sm">
            <ShieldCheck className="size-10 text-accent" />
            <p className="text-xl font-bold leading-snug text-[#16262f]">
              We're thrilled to help you!
            </p>
            <p className="max-w-150 text-lg font-medium leading-snug text-muted-foreground">
              Insurance rock chip setups can be a rather arduous process — but
              we're here to make things as smooth as possible.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-1 rounded-full"
              disabled={submitting}
              onClick={() =>
                updateData({
                  paymentType: 'cash',
                  quotePayType: 'cash',
                  repairAuthorized: false,
                })
              }
            >
              <CreditCard data-icon="inline-start" />
              Pay cash instead
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 text-left shadow-sm">
            <p className="text-lg font-medium leading-relaxed text-muted-foreground">
              I authorize Precision Auto Glass to inspect and perform the agreed
              repair on my vehicle. Resin repairs improve appearance and
              structural integrity but may leave a faint blemish. I understand a
              chip can occasionally spread during repair, in which case a
              replacement may be recommended.
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f7f9f9] p-4">
              <input
                type="checkbox"
                checked={data.repairAuthorized}
                className="mt-1 size-5 accent-accent"
                onChange={(event) =>
                  updateData({ repairAuthorized: event.target.checked })
                }
              />
              <span className="text-base font-bold leading-snug text-[#16262f]">
                I have read and agree to the repair authorization.
              </span>
            </label>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <QuoteField id="rock-chip-first-name" label="First name">
            <QuoteInput
              id="rock-chip-first-name"
              value={data.customerName}
              placeholder="Jane"
              autoComplete="given-name"
              onChange={(event) =>
                updateData({ customerName: event.target.value })
              }
            />
          </QuoteField>
          <QuoteField id="rock-chip-phone" label="Phone">
            <QuoteInput
              id="rock-chip-phone"
              type="tel"
              inputMode="tel"
              value={data.phone}
              placeholder="(801) 555-0100"
              autoComplete="tel"
              aria-invalid={data.phone.length > 0 && !phoneIsValid}
              onChange={(event) => updateData({ phone: event.target.value })}
            />
          </QuoteField>
        </div>

        <QuoteField id="rock-chip-email" label="Email" optional>
          <QuoteInput
            id="rock-chip-email"
            type="email"
            inputMode="email"
            value={data.email}
            placeholder="jane@example.com"
            autoComplete="email"
            aria-invalid={data.email.length > 0 && !emailIsValid}
            onChange={(event) => updateData({ email: event.target.value })}
          />
        </QuoteField>

        <div className="pt-2">
          <VehicleLookupFields
            data={data}
            updateData={updateData}
            location={location}
            showIntroduction={false}
          />
        </div>

        {data.quoteSubmissionError && (
          <p
            role="alert"
            className="text-center font-semibold text-destructive"
          >
            {data.quoteSubmissionError}
          </p>
        )}

        {data.quoteVehicle && (
          <QuoteContinueButton
            disabled={!submission || submitting}
            loading={submitting}
            onClick={() => {
              if (submission) void submitRockChip(submission)
            }}
          >
            Check in
          </QuoteContinueButton>
        )}
      </QuoteForm>
    </KioskStep>
  )
}
