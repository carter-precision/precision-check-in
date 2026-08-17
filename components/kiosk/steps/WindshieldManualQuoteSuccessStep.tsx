import { CarFront, CheckCircle2, UserRound, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import { getGlassLabel } from '../quote-options'
import { QuoteSuccessDetail, QuoteSuccessDetails } from '../QuoteSuccess'
import type { KioskData, KioskStepProps } from '../types'

export function WindshieldManualQuoteSuccessStep({
  data,
  resetFlow,
}: KioskStepProps) {
  const isSunroof = data.glassType === 'sunroof'

  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 py-8">
        <div className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#16262f]">
            {isSunroof
              ? 'We received your sunroof request'
              : 'We received your glass request'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            {isSunroof
              ? 'Sunroof parts require a manual review. Our team will contact you with pricing and next steps.'
              : "We'll contact you to confirm which glass needs replacement, then provide pricing and next steps."}
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

        <Button
          className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
          onClick={resetFlow}
        >
          <CheckCircle2 data-icon="inline-start" />
          Finish
        </Button>
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
