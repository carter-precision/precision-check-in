import { useEffect, useState, type ReactNode } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Store,
} from 'lucide-react'

import type { InsuranceCompanyOption } from '@/lib/omega/quote-types'

import { KioskStep } from '../KioskPrimitives'
import { loadInsuranceCompanies } from '../omega-quote-lookups'
import { getLocationLabel } from '../quote-options'
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
  QuoteSelect,
} from '../QuoteForm'
import type { KioskStepProps } from '../types'
import { WindshieldServiceLocationStep } from './WindshieldQuoteServiceSteps'

type CompanyStatus = 'loading' | 'ready' | 'empty' | 'error'

export function RockChipContactStep({
  data,
  updateData,
  goTo,
  location,
}: KioskStepProps) {
  const isInsurance = data.quotePayType === 'insurance'
  const [companies, setCompanies] = useState<InsuranceCompanyOption[]>([])
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus>('loading')
  const [companyRetry, setCompanyRetry] = useState(0)
  const phoneIsValid = isValidQuotePhone(data.phone)
  const emailIsValid = isValidQuoteEmail(data.email)
  const insuranceIsValid =
    !isInsurance ||
    (Boolean(data.insuranceCompanyId) && Boolean(data.policyNumber.trim()))
  const canContinue =
    data.customerName.trim().length > 0 &&
    phoneIsValid &&
    emailIsValid &&
    Boolean(data.quotePayType) &&
    insuranceIsValid

  useEffect(() => {
    if (!isInsurance) return

    const controller = new AbortController()

    void loadInsuranceCompanies(location, controller.signal)
      .then((options) => {
        if (controller.signal.aborted) return
        setCompanies(options)
        setCompanyStatus(options.length > 0 ? 'ready' : 'empty')
      })
      .catch(() => {
        if (!controller.signal.aborted) setCompanyStatus('error')
      })

    return () => controller.abort()
  }, [companyRetry, isInsurance, location])

  function selectCompany(companyId: string) {
    const company = companies.find((option) => option.id === companyId)
    updateData({
      insuranceCompanyId: company?.id ?? '',
      insuranceCompanyLabel: company?.label ?? '',
    })
  }

  return (
    <KioskStep title="Schedule your rock chip repair">
      <QuoteForm>
        <p className="text-center text-lg font-medium text-muted-foreground">
          Tell us how to reach you, then choose where and when you’d like
          service.
        </p>

        {isInsurance && (
          <div className="flex items-center gap-4 rounded-[1.4rem] border border-[#a9c7ce] bg-accent-tint/50 p-5 shadow-sm">
            <ShieldCheck className="size-8 shrink-0 text-accent" />
            <div>
              <p className="font-bold text-[#16262f]">
                We’ll handle your claim
              </p>
              <p className="mt-1 font-medium text-muted-foreground">
                Just share your insurance company and policy number below.
              </p>
            </div>
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
            aria-invalid={!emailIsValid}
            onChange={(event) => updateData({ email: event.target.value })}
          />
        </QuoteField>

        {isInsurance && (
          <div className="space-y-5 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 shadow-sm">
            <QuoteField
              id="rock-chip-insurance-company"
              label="Insurance company"
            >
              <QuoteSelect
                id="rock-chip-insurance-company"
                value={data.insuranceCompanyId}
                disabled={companyStatus !== 'ready'}
                onChange={(event) => selectCompany(event.target.value)}
              >
                <option value="">
                  {companyStatus === 'loading'
                    ? 'Loading insurance companies…'
                    : 'Select insurance company'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.label}
                  </option>
                ))}
              </QuoteSelect>
            </QuoteField>

            {(companyStatus === 'empty' || companyStatus === 'error') && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-tint p-3">
                <p className="text-sm font-medium text-[#40525a]">
                  {companyStatus === 'empty'
                    ? 'No insurance companies are available.'
                    : 'We couldn’t load insurance companies.'}
                </p>
                <button
                  type="button"
                  className="shrink-0 text-sm font-bold text-accent underline decoration-2 underline-offset-4"
                  onClick={() => {
                    setCompanyStatus('loading')
                    setCompanyRetry((value) => value + 1)
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            <QuoteField id="rock-chip-policy-number" label="Policy number">
              <QuoteInput
                id="rock-chip-policy-number"
                value={data.policyNumber}
                placeholder="Found on your insurance card"
                onChange={(event) =>
                  updateData({ policyNumber: event.target.value })
                }
              />
            </QuoteField>
          </div>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d7e1e3] bg-white p-4 text-base font-medium text-[#40525a] shadow-sm">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[#009fc0]"
            checked={data.smsConsent}
            onChange={(event) =>
              updateData({ smsConsent: event.target.checked })
            }
          />
          <span>
            I agree to receive text messages about this service and scheduling.
          </span>
        </label>

        <QuoteContinueButton
          disabled={!canContinue}
          onClick={() =>
            goTo('rockChipServiceLocation', {
              shopLocation: data.shopLocation || location,
            })
          }
        >
          Choose service time
        </QuoteContinueButton>
      </QuoteForm>
    </KioskStep>
  )
}

export function RockChipServiceLocationStep(props: KioskStepProps) {
  const submission = buildRockChipSubmission(props.data, props.location)
  const isSubmitting = props.data.quoteSubmissionStatus === 'submitting'

  return (
    <WindshieldServiceLocationStep
      {...props}
      title="Where should we repair your chip?"
      introduction="Choose mobile or in-shop service, then request a time that works for you."
      continueLabel="Schedule my repair"
      continueLoading={isSubmitting}
      continueError={
        props.data.quoteSubmissionStatus === 'failed'
          ? props.data.quoteSubmissionError
          : null
      }
      continueDisabled={!submission || isSubmitting}
      onContinue={() => {
        if (submission) void props.submitQuote(submission)
      }}
    />
  )
}

export function RockChipSuccessStep({ data, resetFlow }: KioskStepProps) {
  const isInsurance = data.quotePayType === 'insurance'
  const appointment = data.appointmentRequest
  const serviceLocation =
    data.quoteServiceMode === 'mobile'
      ? data.serviceAddress
      : getLocationLabel(data.shopLocation)
  const appointmentLabel =
    appointment?.kind === 'window'
      ? appointment.label
      : appointment?.kind === 'flexible'
        ? 'Flexible — contact me to choose a time'
        : 'Team follow-up requested'

  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-8">
        <div className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
            <CheckCircle2 className="size-11" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#16262f]">
            Your repair request is in
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg font-medium text-muted-foreground">
            We’ll contact you to confirm the exact appointment.
          </p>
        </div>

        <div className="mt-8 space-y-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 shadow-sm">
          <SummaryRow
            icon={<CalendarClock />}
            label="Requested time"
            value={appointmentLabel}
          />
          <SummaryRow
            icon={data.quoteServiceMode === 'mobile' ? <MapPin /> : <Store />}
            label={
              data.quoteServiceMode === 'mobile'
                ? 'Mobile service'
                : 'In-shop service'
            }
            value={`${serviceLocation} · ${data.serviceZip}`}
          />
          <SummaryRow
            icon={<CreditCard />}
            label="Contact"
            value={`${data.customerName} · ${data.phone}${data.email ? ` · ${data.email}` : ''}`}
          />
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-[#a9c7ce] bg-accent-tint/50 p-5 text-center">
          {isInsurance ? (
            <>
              <p className="text-xl font-bold text-[#16262f]">
                We’ll handle your claim
              </p>
              <p className="mt-1 font-medium text-muted-foreground">
                {data.insuranceCompanyLabel} · Policy {data.policyNumber}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-muted-foreground">
                Cash-pay repair
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-accent">
                $79.99
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <QuoteContinueButton onClick={resetFlow}>Finish</QuoteContinueButton>
        </div>
      </div>
    </KioskStep>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 text-accent [&_svg]:size-5">{icon}</div>
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 font-semibold text-[#16262f]">{value}</p>
      </div>
    </div>
  )
}
