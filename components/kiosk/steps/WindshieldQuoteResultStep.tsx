import { CarFront, CheckCircle2, FileWarning, UserRound, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import { QuoteSuccessDetail, QuoteSuccessDetails } from '../QuoteSuccess'
import { getGlassLabel } from '../quote-options'
import type { KioskData, KioskStepProps } from '../types'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function WindshieldQuoteResultStep({
  data,
  goTo,
  resetFlow,
}: KioskStepProps) {
  const result = data.quoteResult

  if (!result) {
    return (
      <KioskStep title="Quote unavailable">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-12 text-center">
          <div className="mb-5 flex size-18 items-center justify-center rounded-full bg-accent-tint text-accent">
            <FileWarning className="size-9" />
          </div>
          <p className="max-w-md text-lg font-medium text-muted-foreground">
            Return to your details and try the quote again.
          </p>
          <Button
            className="mt-7 h-14 rounded-xl bg-accent px-8 text-lg font-bold hover:bg-accent-shade"
            onClick={() => goTo('windshieldContact')}
          >
            Return to quote details
          </Button>
        </div>
      </KioskStep>
    )
  }

  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
        <div className="rounded-[1.4rem] bg-[#16262f] p-8 text-center text-white shadow-lg">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-tint">
            QUOTE #{result.invoiceId}
          </p>
          <p className="text-5xl font-bold">{formatCurrency(result.total)}</p>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-[#c8d4d8]">
            If there are any specialized adjustments, we will let you know
            prior to any booking confirmation or completed work.
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
        </QuoteSuccessDetails>

        <p className="px-4 text-center text-xs font-medium italic leading-relaxed text-muted-foreground">
          Confirmed quotes are valid for 48 hours because prices can change.
        </p>

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

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}
