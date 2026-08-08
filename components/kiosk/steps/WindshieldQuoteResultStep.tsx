import { CheckCircle2, FileWarning } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import { getGlassLabel, getLocationLabel } from '../quote-options'
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
      <div className="mx-auto w-full max-w-3xl space-y-6 py-8">
        <div className="rounded-[1.4rem] bg-[#16262f] p-8 text-center text-white shadow-lg">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent-tint">
            Your quote total
          </p>
          <p className="text-5xl font-bold">{formatCurrency(result.total)}</p>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-[#c8d4d8]">
            Quote #{result.invoiceId}. Pricing comes from the completed quote
            for the vehicle and glass details you provided.
          </p>
        </div>

        <section className="overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white shadow-sm">
          <h2 className="px-6 pb-2 pt-5 text-xl font-bold text-[#16262f]">
            Price details
          </h2>
          <div className="divide-y divide-[#d7e1e3] px-6">
            {result.subtotal !== null && (
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(result.subtotal)}
              />
            )}
            <SummaryRow label="Tax" value={formatCurrency(result.tax)} />
            <SummaryRow
              label="Quote total"
              value={formatCurrency(result.total)}
            />
            {data.quotePayType === 'insurance' && (
              <SummaryRow
                label="Your deductible"
                value={formatCurrency(Number(data.deductibleAmount))}
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white shadow-sm">
          <h2 className="px-6 pb-2 pt-5 text-xl font-bold text-[#16262f]">
            Included in this quote
          </h2>
          <div className="divide-y divide-[#d7e1e3] px-6">
            {result.items.map((item, index) => (
              <div
                key={`${item.sku ?? 'item'}-${index}`}
                className="flex items-start justify-between gap-6 py-4"
              >
                <div>
                  <p className="font-bold text-[#16262f]">{item.description}</p>
                  {item.sku && (
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {item.sku}
                    </p>
                  )}
                </div>
                <p className="shrink-0 font-bold text-[#16262f]">
                  {formatCurrency(item.price)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="divide-y divide-[#d7e1e3] rounded-[1.4rem] border border-[#d7e1e3] bg-white px-6 shadow-sm">
          {data.quotePayType === 'insurance' && (
            <SummaryRow label="Carrier" value={data.insuranceCompanyLabel} />
          )}
          <SummaryRow label="Vehicle" value={formatVehicle(data)} />
          <SummaryRow label="Glass" value={getGlassLabel(data.glassType)} />
          <SummaryRow label="Service" value={formatService(data)} />
          <SummaryRow
            label="Preferred date"
            value={formatDate(data.preferredDate)}
          />
          <SummaryRow label="Contact" value={data.customerName} />
        </div>

        <Button
          className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
          onClick={resetFlow}
        >
          <CheckCircle2 className="size-6" />
          Finish
        </Button>
      </div>
    </KioskStep>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 text-base">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <span className="text-right font-bold text-[#16262f]">
        {value || 'Not provided'}
      </span>
    </div>
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

function formatService(data: KioskData) {
  if (data.quoteServiceMode === 'mobile') {
    return `Mobile — ${data.serviceAddress}`
  }
  if (data.quoteServiceMode === 'shop') {
    return `In shop — ${getLocationLabel(data.shopLocation)}`
  }
  return 'Not selected'
}

function formatDate(value: string) {
  if (!value) return 'No preference'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}
