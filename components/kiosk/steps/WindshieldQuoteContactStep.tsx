import { useEffect, useState } from 'react'

import type { InsuranceCompanyOption } from '@/lib/omega/quote-types'

import { KioskStep } from '../KioskPrimitives'
import { loadInsuranceCompanies } from '../omega-quote-lookups'
import {
  buildQuoteSubmission,
  isValidQuoteEmail,
  isValidQuotePhone,
} from '../quote-submission'
import {
  QuoteContinueButton,
  QuoteField,
  QuoteForm,
  QuoteInput,
  QuoteSelect,
  QuoteToggle,
} from '../QuoteForm'
import type { KioskStepProps } from '../types'

type CompanyStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export function WindshieldQuoteContactStep({
  data,
  updateData,
  submitQuote,
  location,
  previewInsuranceCompanies,
}: KioskStepProps & {
  previewInsuranceCompanies?: InsuranceCompanyOption[]
}) {
  const [companies, setCompanies] = useState<InsuranceCompanyOption[]>(
    previewInsuranceCompanies ?? [],
  )
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus>(
    previewInsuranceCompanies
      ? 'ready'
      : data.quotePayType === 'insurance'
        ? 'loading'
        : 'idle',
  )
  const [companyRetry, setCompanyRetry] = useState(0)
  const submission = buildQuoteSubmission(data, location)
  const phoneIsValid = isValidQuotePhone(data.phone)
  const emailIsValid = isValidQuoteEmail(data.email)
  const isSubmitting = data.quoteSubmissionStatus === 'submitting'

  useEffect(() => {
    if (previewInsuranceCompanies || data.quotePayType !== 'insurance') return

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
  }, [companyRetry, data.quotePayType, location, previewInsuranceCompanies])

  function updateQuoteData(partial: Parameters<typeof updateData>[0]) {
    updateData({
      ...partial,
      quoteSubmission: null,
      quoteSubmissionStatus: 'idle',
      quoteSubmissionError: null,
      quoteResult: null,
    })
  }

  function selectCash() {
    updateQuoteData({
      paymentType: 'cash',
      quotePayType: 'cash',
      insuranceCompanyId: '',
      insuranceCompanyLabel: '',
      policyNumber: '',
      deductibleAmount: '',
    })
  }

  function selectInsurance() {
    if (data.quotePayType === 'insurance') return
    setCompanyStatus('loading')
    updateQuoteData({
      paymentType: 'insurance',
      quotePayType: 'insurance',
    })
  }

  function selectCompany(companyId: string) {
    const company = companies.find((option) => option.id === companyId)
    updateQuoteData({
      insuranceCompanyId: company?.id ?? '',
      insuranceCompanyLabel: company?.label ?? '',
    })
  }

  function updateDeductible(value: string) {
    if (/^\d*(?:\.\d{0,2})?$/.test(value)) {
      updateQuoteData({ deductibleAmount: value })
    }
  }

  return (
    <KioskStep title="Your quote details">
      <QuoteForm>
        <p className="text-center text-lg font-medium text-muted-foreground">
          Tell us where to send the quote and whether you are using insurance.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <QuoteField id="quote-first-name" label="First name">
            <QuoteInput
              id="quote-first-name"
              value={data.customerName}
              placeholder="Jane"
              autoComplete="given-name"
              onChange={(event) =>
                updateQuoteData({ customerName: event.target.value })
              }
            />
          </QuoteField>
          <QuoteField id="quote-phone" label="Phone">
            <QuoteInput
              id="quote-phone"
              type="tel"
              inputMode="tel"
              value={data.phone}
              placeholder="(801) 555-0100"
              autoComplete="tel"
              aria-invalid={data.phone.length > 0 && !phoneIsValid}
              onChange={(event) =>
                updateQuoteData({ phone: event.target.value })
              }
            />
          </QuoteField>
        </div>

        <QuoteField id="quote-email" label="Email" optional>
          <QuoteInput
            id="quote-email"
            type="email"
            inputMode="email"
            value={data.email}
            placeholder="jane@example.com"
            autoComplete="email"
            aria-invalid={!emailIsValid}
            onChange={(event) => updateQuoteData({ email: event.target.value })}
          />
        </QuoteField>

        <QuoteField id="quote-zip" label="ZIP code">
          <QuoteInput
            id="quote-zip"
            inputMode="numeric"
            maxLength={5}
            value={data.serviceZip}
            placeholder="84045"
            autoComplete="postal-code"
            aria-invalid={
              data.serviceZip.length > 0 && !/^\d{5}$/.test(data.serviceZip)
            }
            onChange={(event) =>
              updateQuoteData({
                serviceZip: event.target.value.replace(/\D/g, '').slice(0, 5),
              })
            }
          />
        </QuoteField>

        <QuoteField label="How will you pay?">
          <div
            className="grid grid-cols-2 gap-3"
            role="group"
            aria-label="Payment method"
          >
            <QuoteToggle
              selected={data.quotePayType === 'cash'}
              onClick={selectCash}
            >
              Cash / self-pay
            </QuoteToggle>
            <QuoteToggle
              selected={data.quotePayType === 'insurance'}
              onClick={selectInsurance}
            >
              Insurance
            </QuoteToggle>
          </div>
        </QuoteField>

        {data.quotePayType === 'insurance' && (
          <div className="space-y-5 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 shadow-sm">
            <QuoteField id="insurance-company" label="Insurance company">
              <QuoteSelect
                id="insurance-company"
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
                    : "We couldn't load insurance companies."}
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

            <div className="grid gap-5 md:grid-cols-2">
              <QuoteField id="policy-number" label="Policy number">
                <QuoteInput
                  id="policy-number"
                  required
                  value={data.policyNumber}
                  placeholder="Found on your insurance card"
                  onChange={(event) =>
                    updateQuoteData({ policyNumber: event.target.value })
                  }
                />
              </QuoteField>
              <QuoteField id="deductible" label="Deductible" optional>
                <QuoteInput
                  id="deductible"
                  type="text"
                  inputMode="decimal"
                  value={data.deductibleAmount}
                  placeholder="If known"
                  onChange={(event) => updateDeductible(event.target.value)}
                />
              </QuoteField>
            </div>
          </div>
        )}

        {data.quoteSubmissionStatus === 'failed' &&
          data.quoteSubmissionError && (
            <div role="alert" className="rounded-xl bg-accent-tint p-4">
              <p className="font-bold text-[#16262f]">
                We couldn't finish your quote
              </p>
              <p className="mt-1 font-medium text-[#40525a]">
                {data.quoteSubmissionError}
              </p>
            </div>
          )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d7e1e3] bg-white p-4 text-base font-medium text-[#40525a] shadow-sm">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-[#009fc0]"
            checked={data.smsConsent}
            onChange={(event) =>
              updateQuoteData({ smsConsent: event.target.checked })
            }
          />
          <span>
            I agree to receive text messages about this quote and appointment.
          </span>
        </label>

        <QuoteContinueButton
          disabled={!submission || isSubmitting}
          loading={isSubmitting}
          onClick={() => {
            if (submission) {
              void submitQuote(submission)
            }
          }}
        >
          {isSubmitting
            ? 'Getting your quote…'
            : data.quoteSubmissionStatus === 'failed'
              ? 'Try again'
              : 'Get my quote'}
        </QuoteContinueButton>
      </QuoteForm>
    </KioskStep>
  )
}
