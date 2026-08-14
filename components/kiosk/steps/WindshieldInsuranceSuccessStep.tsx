import {
  CarFront,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  UserRound,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import { QuoteSuccessDetail, QuoteSuccessDetails } from '../QuoteSuccess'
import { getGlassLabel } from '../quote-options'
import type { KioskData, KioskStepProps } from '../types'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function WindshieldInsuranceSuccessStep({
  data,
  goTo,
  resetFlow,
}: KioskStepProps) {
  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 py-8">
        <div className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
            <ShieldCheck className="size-10" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#16262f]">
            We&apos;ll handle the insurance claim
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            We received your information and will work with{' '}
            {data.insuranceCompanyLabel || 'your insurance company'}. You can
            schedule your appointment now.
          </p>
        </div>

        <QuoteSuccessDetails>
          <QuoteSuccessDetail
            icon={<CarFront />}
            label="Vehicle"
            value={formatVehicle(data)}
          />
          <QuoteSuccessDetail
            icon={<Wrench />}
            label="Glass"
            value={getGlassLabel(data.glassType)}
          />
          <QuoteSuccessDetail
            icon={<UserRound />}
            label="Contact"
            value={formatContact(data)}
          />
          <QuoteSuccessDetail
            icon={<ShieldCheck />}
            label="Insurance"
            value={formatInsurance(data)}
          />
          <QuoteSuccessDetail
            icon={<CreditCard />}
            label="Your responsibility"
            value={formatDeductible(data.deductibleAmount)}
          />
        </QuoteSuccessDetails>

        <div className="flex flex-col gap-3">
          <Button
            className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
            onClick={() =>
              goTo('windshieldServiceLocation', {
                shopLocation:
                  data.shopLocation || data.quoteSubmission?.locationSlug || '',
              })
            }
          >
            Schedule an appointment
          </Button>
          <Button variant="ghost" className="h-12" onClick={resetFlow}>
            <CheckCircle2 data-icon="inline-start" />
            Finish without scheduling
          </Button>
        </div>
      </div>
    </KioskStep>
  )
}

function formatVehicle(data: KioskData) {
  const vehicle = data.quoteVehicle
  if (!vehicle) return 'Not provided'

  return [
    vehicle.year,
    vehicle.makeLabel,
    vehicle.modelLabel,
    vehicle.modifierLabel,
  ]
    .filter(Boolean)
    .join(' ')
}

function formatContact(data: KioskData) {
  return [data.customerName, data.phone, data.email].filter(Boolean).join(' · ')
}

function formatInsurance(data: KioskData) {
  return [
    data.insuranceCompanyLabel || 'Insurance company not provided',
    data.policyNumber ? `Policy ${data.policyNumber}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function formatDeductible(value: string) {
  const deductible = value.trim() ? Number(value) : null

  return deductible !== null
    ? `Deductible provided: ${currencyFormatter.format(deductible)}`
    : 'We’ll confirm your deductible with you and your insurance company.'
}
