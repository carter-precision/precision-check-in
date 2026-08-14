import {
  CalendarClock,
  CarFront,
  CheckCircle2,
  MapPin,
  Store,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import {
  QuoteSuccessDetail,
  QuoteSuccessDetails,
} from '../QuoteSuccess'
import { getLocationLabel } from '../quote-options'
import type { KioskData, KioskStepProps } from '../types'

export function WindshieldAppointmentSuccessStep({
  data,
  resetFlow,
}: KioskStepProps) {
  const needsFollowUp = data.quoteSchedulingStatus === 'needs_follow_up'

  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 py-8">
        <div className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#16262f]">
            {needsFollowUp
              ? 'Your appointment request is in'
              : 'Appointment request received'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            {needsFollowUp
              ? 'We’ll contact you to finish scheduling your service.'
              : 'We’ll contact you to confirm the appointment details below.'}
          </p>
        </div>

        <QuoteSuccessDetails>
          <QuoteSuccessDetail
            icon={<CarFront />}
            label={data.quoteInvoiceId ? 'Quote' : 'Insurance request'}
            value={formatQuoteReference(data)}
          />
          <QuoteSuccessDetail
            icon={<CalendarClock />}
            label="Requested time"
            value={formatAppointmentRequest(data)}
          />
          <QuoteSuccessDetail
            icon={data.quoteServiceMode === 'mobile' ? <MapPin /> : <Store />}
            label={
              data.quoteServiceMode === 'mobile'
                ? 'Mobile service'
                : 'In-shop service'
            }
            value={formatServiceLocation(data)}
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

function formatQuoteReference(data: KioskData) {
  if (data.quoteInvoiceId) return `#${data.quoteInvoiceId}`
  return 'Submitted to our team'
}

function formatServiceLocation(data: KioskData) {
  const location =
    data.quoteServiceMode === 'mobile'
      ? data.serviceAddress
      : getLocationLabel(data.shopLocation)

  return [location, data.serviceZip].filter(Boolean).join(' · ')
}

function formatAppointmentRequest(data: KioskData) {
  const request = data.appointmentRequest
  if (!request || request.kind === 'follow_up') {
    return 'Team follow-up requested'
  }
  return `${formatAppointmentDate(request.date)} · ${request.label}`
}

function formatAppointmentDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(value)
}

function formatContact(data: KioskData) {
  return [data.customerName, data.phone, data.email].filter(Boolean).join(' · ')
}
