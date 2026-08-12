import { useEffect, useMemo, useState } from 'react'
import { format, isSameMonth } from 'date-fns'
import { CalendarClock, CalendarIcon, MapPin, Store } from 'lucide-react'

import type { AppointmentAvailability } from '@/lib/omega/quote-types'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { KioskStep } from '../KioskPrimitives'
import {
  QuoteContinueButton,
  QuoteField,
  QuoteForm,
  QuoteHelperButton,
  QuoteInput,
  QuoteSelect,
  QuoteToggle,
} from '../QuoteForm'
import { VehicleGlassDiagram } from '../VehicleGlassDiagram'
import {
  GLASS_OPTIONS,
  getGlassDropdownValue,
  getGlassPosition,
  getLocationLabel,
  isGlassQuoteSupported,
  KIOSK_LOCATIONS,
} from '../quote-options'
import type { GlassType, KioskStepProps } from '../types'
import { loadAppointmentAvailability } from '../omega-quote-lookups'

type AvailabilityStatus = 'idle' | 'loading' | 'ready' | 'error'

export function WindshieldGlassStep({
  data,
  updateData,
  goTo,
  location,
}: KioskStepProps) {
  const glassPosition = getGlassPosition(data.glassType)
  const canContinue =
    isGlassQuoteSupported(data.glassType) &&
    data.glassPosition === glassPosition

  function selectGlass(glassType: GlassType) {
    updateData({
      glassType,
      glassPosition: getGlassPosition(glassType),
    })
  }

  return (
    <KioskStep title="What needs replacing?">
      <QuoteForm>
        <p className="text-center text-lg font-medium text-muted-foreground">
          Tap the damaged glass on the vehicle.
        </p>
        <VehicleGlassDiagram selected={data.glassType} onSelect={selectGlass} />

        <div className="text-center">
          <QuoteHelperButton onClick={() => selectGlass('other')}>
            Not sure or multiple pieces
          </QuoteHelperButton>
        </div>

        <QuoteField id="glass-type" label="Selected glass">
          <QuoteSelect
            id="glass-type"
            value={getGlassDropdownValue(data.glassType) ?? ''}
            onChange={(event) =>
              event.target.value
                ? selectGlass(event.target.value as GlassType)
                : updateData({ glassType: null, glassPosition: null })
            }
          >
            <option value="">Choose the damaged glass</option>
            {GLASS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </QuoteSelect>
          <p className="text-center text-base font-medium text-muted-foreground">
            Choose from the list or tap a glass panel on the vehicle.
          </p>
          {data.glassType && !canContinue && (
            <p className="rounded-xl bg-accent-tint p-4 text-center text-sm font-semibold text-[#40525a]">
              Online pricing is not currently available for this selection. A
              team member can help with next steps.
            </p>
          )}
        </QuoteField>

        <QuoteContinueButton
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue) return
            goTo('windshieldServiceLocation', {
              shopLocation: data.shopLocation || location,
            })
          }}
        />
      </QuoteForm>
    </KioskStep>
  )
}

export function WindshieldServiceLocationStep({
  data,
  updateData,
  goTo,
  location,
}: KioskStepProps) {
  const [availability, setAvailability] =
    useState<AppointmentAvailability | null>(null)
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>('idle')
  const [availabilityRetry, setAvailabilityRetry] = useState(0)
  const [availabilityResultKey, setAvailabilityResultKey] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const selectedShop = data.shopLocation || location
  const zipIsValid = /^\d{5}$/.test(data.serviceZip)
  const serviceDetailsAreValid =
    data.quoteServiceMode === 'mobile'
      ? data.serviceAddress.trim().length > 3
      : data.quoteServiceMode === 'shop' && Boolean(selectedShop)
  const canLoadAvailability = serviceDetailsAreValid && zipIsValid
  const canContinue = canLoadAvailability && Boolean(data.appointmentRequest)
  const availabilityQueryKey = `${data.quoteServiceMode}:${selectedShop}:${data.serviceZip}:${availabilityRetry}`
  const displayedAvailabilityStatus = !canLoadAvailability
    ? 'idle'
    : availabilityResultKey === availabilityQueryKey
      ? availabilityStatus
      : 'loading'
  const availableDates = useMemo(
    () =>
      availability
        ? [...new Set(availability.windows.map((window) => window.date))].sort()
        : [],
    [availability],
  )
  const requestedDate =
    data.appointmentRequest?.kind === 'window'
      ? data.appointmentRequest.date
      : ''
  const activeDate = availableDates.includes(selectedDate)
    ? selectedDate
    : availableDates.includes(requestedDate)
      ? requestedDate
      : (availableDates[0] ?? '')
  const displayedWindows =
    availability?.windows.filter((window) => window.date === activeDate) ?? []
  const locations = [
    ...KIOSK_LOCATIONS.filter((shop) => shop.slug === location),
    ...KIOSK_LOCATIONS.filter((shop) => shop.slug !== location),
  ]

  useEffect(() => {
    if (!canLoadAvailability || !data.quoteServiceMode) return

    const controller = new AbortController()

    void loadAppointmentAvailability(
      location,
      {
        mode: data.quoteServiceMode,
        shopLocation: data.quoteServiceMode === 'shop' ? selectedShop : null,
        postalCode: data.serviceZip,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setAvailability(result)
        setAvailabilityStatus('ready')
        setAvailabilityResultKey(availabilityQueryKey)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setAvailability(null)
        setAvailabilityStatus('error')
        setAvailabilityResultKey(availabilityQueryKey)
      })

    return () => controller.abort()
  }, [
    availabilityRetry,
    availabilityQueryKey,
    canLoadAvailability,
    data.quoteServiceMode,
    data.serviceZip,
    location,
    selectedShop,
  ])

  return (
    <KioskStep title="Where should we do the work?">
      <QuoteForm>
        <p className="text-center text-lg font-medium text-muted-foreground">
          We can come to you, or you can visit one of our shops.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <QuoteToggle
            selected={data.quoteServiceMode === 'mobile'}
            onClick={() =>
              updateData({
                quoteServiceMode: 'mobile',
                appointmentRequest: null,
              })
            }
          >
            <span className="flex items-center justify-center gap-2">
              <MapPin className="size-5" />
              We come to you
            </span>
          </QuoteToggle>
          <QuoteToggle
            selected={data.quoteServiceMode === 'shop'}
            onClick={() =>
              updateData({
                quoteServiceMode: 'shop',
                shopLocation: selectedShop,
                appointmentRequest: null,
              })
            }
          >
            <span className="flex items-center justify-center gap-2">
              <Store className="size-5" />
              I'll come in
            </span>
          </QuoteToggle>
        </div>

        {data.quoteServiceMode === 'mobile' && (
          <QuoteField id="service-address" label="Service address">
            <QuoteInput
              id="service-address"
              value={data.serviceAddress}
              placeholder="Street address, city"
              onChange={(event) =>
                updateData({ serviceAddress: event.target.value })
              }
            />
          </QuoteField>
        )}

        {data.quoteServiceMode === 'shop' && (
          <QuoteField id="shop-location" label="Shop location">
            <QuoteSelect
              id="shop-location"
              value={selectedShop}
              onChange={(event) =>
                updateData({
                  shopLocation: event.target.value,
                  appointmentRequest: null,
                })
              }
            >
              {locations.map((shop) => (
                <option key={shop.slug} value={shop.slug}>
                  {shop.label}
                  {shop.slug === location ? ' (this location)' : ''}
                </option>
              ))}
            </QuoteSelect>
            <p className="text-sm font-medium text-muted-foreground">
              {getLocationLabel(location)} is selected by default for this
              kiosk.
            </p>
          </QuoteField>
        )}

        {data.quoteServiceMode && (
          <QuoteField id="quote-zip" label="ZIP code">
            <QuoteInput
              id="quote-zip"
              inputMode="numeric"
              maxLength={5}
              value={data.serviceZip}
              placeholder="84045"
              autoComplete="postal-code"
              aria-invalid={data.serviceZip.length > 0 && !zipIsValid}
              onChange={(event) => {
                setSelectedDate('')
                updateData({
                  serviceZip: event.target.value.replace(/\D/g, '').slice(0, 5),
                  appointmentRequest: null,
                })
              }}
            />
          </QuoteField>
        )}

        {canLoadAvailability && (
          <QuoteField label="Preferred service window">
            <div className="space-y-3" aria-live="polite">
              {displayedAvailabilityStatus === 'loading' && (
                <div className="rounded-xl border border-[#d7e1e3] bg-white p-5 text-center font-semibold text-muted-foreground shadow-sm">
                  Loading available service windows…
                </div>
              )}

              {displayedAvailabilityStatus === 'ready' && availability && (
                <>
                  <p className="text-sm font-medium text-muted-foreground">
                    These windows reflect current availability for{' '}
                    {availability.locationLabel}. We’ll contact you to confirm
                    the exact appointment.
                  </p>
                  {availableDates.length > 0 && (
                    <AvailabilityDatePicker
                      availableDates={availableDates}
                      value={activeDate}
                      onChange={(date) => {
                        setSelectedDate(date)
                        if (
                          data.appointmentRequest?.kind === 'window' &&
                          data.appointmentRequest.date !== date
                        ) {
                          updateData({ appointmentRequest: null })
                        }
                      }}
                    />
                  )}

                  {displayedWindows.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {displayedWindows.map((window) => {
                        const selected =
                          data.appointmentRequest?.kind === 'window' &&
                          data.appointmentRequest.token === window.token

                        return (
                          <button
                            type="button"
                            key={`${window.date}-${window.start}-${window.end}`}
                            aria-pressed={selected}
                            className={`rounded-xl border p-4 text-left font-bold transition ${
                              selected
                                ? 'border-accent bg-accent-tint text-[#16262f] shadow-sm'
                                : 'border-[#d7e1e3] bg-white text-[#40525a] hover:border-[#a9c7ce]'
                            }`}
                            onClick={() =>
                              updateData({
                                appointmentRequest: {
                                  kind: 'window',
                                  token: window.token,
                                  date: window.date,
                                  start: window.start,
                                  end: window.end,
                                  label: window.label,
                                  locationLabel: availability.locationLabel,
                                },
                              })
                            }
                          >
                            <span className="flex items-center gap-2">
                              <CalendarClock className="size-5 text-accent" />
                              {window.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    aria-pressed={data.appointmentRequest?.kind === 'flexible'}
                    className={`w-full rounded-xl border p-4 text-left font-bold transition ${
                      data.appointmentRequest?.kind === 'flexible'
                        ? 'border-accent bg-accent-tint text-[#16262f] shadow-sm'
                        : 'border-[#d7e1e3] bg-white text-[#40525a] hover:border-[#a9c7ce]'
                    }`}
                    onClick={() =>
                      updateData({
                        appointmentRequest: {
                          kind: 'flexible',
                          token: availability.flexibleToken,
                          locationLabel: availability.locationLabel,
                        },
                      })
                    }
                  >
                    I’m flexible—have the team contact me
                  </button>
                </>
              )}

              {displayedAvailabilityStatus === 'error' && (
                <div className="space-y-3 rounded-xl bg-accent-tint p-4">
                  <p className="font-semibold text-[#40525a]">
                    We couldn’t load scheduling options. You can retry or have
                    our team contact you.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="font-bold text-accent underline decoration-2 underline-offset-4"
                      onClick={() => {
                        updateData({ appointmentRequest: null })
                        setAvailabilityRetry((value) => value + 1)
                      }}
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      className="font-bold text-[#16262f] underline decoration-2 underline-offset-4"
                      onClick={() =>
                        updateData({
                          appointmentRequest: { kind: 'follow_up' },
                        })
                      }
                    >
                      Have the team contact me
                    </button>
                  </div>
                </div>
              )}
            </div>
          </QuoteField>
        )}

        <QuoteContinueButton
          disabled={!canContinue}
          onClick={() => goTo('windshieldContact')}
        />
      </QuoteForm>
    </KioskStep>
  )
}

function AvailabilityDatePicker({
  availableDates,
  value,
  onChange,
}: {
  availableDates: string[]
  value: string
  onChange: (date: string) => void
}) {
  const [open, setOpen] = useState(false)
  const availableDateSet = useMemo(
    () => new Set(availableDates),
    [availableDates],
  )
  const selectedDate = useMemo(
    () => (value ? parseDateKey(value) : undefined),
    [value],
  )
  const firstDate = useMemo(
    () => parseDateKey(availableDates[0]),
    [availableDates],
  )
  const lastDate = useMemo(
    () => parseDateKey(availableDates[availableDates.length - 1]),
    [availableDates],
  )
  const [month, setMonth] = useState(selectedDate ?? firstDate)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!selectedDate}
          aria-label="Preferred service date"
          className={cn(
            'h-14 w-full justify-start bg-white px-4 text-left text-base font-semibold aria-expanded:bg-white has-data-[icon=inline-start]:pl-4',
            'data-[empty=true]:text-muted-foreground',
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          month={month}
          onMonthChange={setMonth}
          startMonth={firstDate}
          endMonth={lastDate}
          hideNavigation={isSameMonth(firstDate, lastDate)}
          disabled={(date) => !availableDateSet.has(format(date, 'yyyy-MM-dd'))}
          onSelect={(date) => {
            if (!date) return

            const dateKey = format(date, 'yyyy-MM-dd')
            if (!availableDateSet.has(dateKey)) return

            setMonth(date)
            onChange(dateKey)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

function parseDateKey(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}
