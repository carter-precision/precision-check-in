'use client'

import { useActionState, useState } from 'react'
import { Building2, CarFront, CheckCircle2, LoaderCircle } from 'lucide-react'

import {
  createCustomerCheckInAction,
  type CustomerCheckInActionState,
} from '@/app/actions/check-ins'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const initialCustomerCheckInActionState: CustomerCheckInActionState = {
  status: 'idle',
}

export function CustomerCheckInForm({
  proof,
  customerName,
  vehicleDescription,
  preview = false,
}: {
  proof: string
  customerName: string
  vehicleDescription: string | null
  preview?: boolean
}) {
  const [isVehicleInputVisible, setIsVehicleInputVisible] = useState(false)
  const [state, action, isPending] = useActionState(
    preview ? completePreviewCheckIn : createCustomerCheckInAction,
    initialCustomerCheckInActionState,
  )

  if (state.status === 'success') {
    const isVehicleCheckIn = state.arrivalMode === 'vehicle'

    return (
      <div
        className="animate-in fade-in zoom-in-95 py-8 text-center duration-300"
        role="status"
      >
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#e9f5e3] text-accent">
          <CheckCircle2 className="size-11" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
          You're checked in
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
          {state.message}
        </p>
        <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-2xl border border-[#dce7d5] bg-accent-tint px-5 py-3 text-left">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-accent shadow-sm [&_svg]:size-6">
            {isVehicleCheckIn ? <CarFront /> : <Building2 />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
              Check-in location
            </div>
            <div className="mt-0.5 text-base font-bold text-[#16262f]">
              {isVehicleCheckIn
                ? 'Waiting in your vehicle'
                : 'Waiting in the lobby'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="proof" value={proof} />

      <div className="mb-7 text-center">
        <p className="mt-3 text-xl font-medium text-accent">
          Welcome, {firstName(customerName)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
          Where can we find you?
        </h1>
        <p className="mt-3 text-base font-medium text-muted-foreground">
          Choose the best option and we'll come to you
        </p>
      </div>

      {vehicleDescription ? (
        <ArrivalButton
          name="arrivalMode"
          value="vehicle"
          icon={<CarFront />}
          label="I'm waiting in my vehicle"
          description={`We'll look for your ${vehicleDescription}.`}
          disabled={isPending}
        />
      ) : isVehicleInputVisible ? (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-[1.4rem] border border-[#b8d1a6] bg-accent-tint p-5 duration-200">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-sm [&_svg]:size-7">
              <CarFront />
            </div>
            <div>
              <div className="text-xl font-bold tracking-[-0.02em] text-[#16262f]">
                I'm waiting in my vehicle
              </div>
              <div className="mt-1 text-base font-medium leading-snug text-muted-foreground">
                Tell us which vehicle you're in.
              </div>
            </div>
          </div>

          <label
            htmlFor="vehicle-info"
            className="mt-5 block text-sm font-bold text-[#34454d]"
          >
            Vehicle information
          </label>
          <Input
            autoFocus
            id="vehicle-info"
            name="vehicleInfo"
            type="text"
            required
            maxLength={28}
            autoComplete="off"
            placeholder="Color, make/model, or license plate"
            disabled={isPending}
            className="mt-2 h-12 rounded-xl border-[#b7c8cc] bg-white px-4 text-base shadow-sm focus-visible:border-accent focus-visible:ring-accent/20"
          />
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Enter up to 28 characters.
          </p>

          <button
            type="submit"
            name="arrivalMode"
            value="vehicle"
            disabled={isPending}
            className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-accent px-5 py-3 text-base font-bold text-white shadow-md shadow-accent/20 transition hover:bg-accent-shade disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55"
          >
            Check in from my vehicle
          </button>
        </div>
      ) : (
        <ArrivalButton
          type="button"
          icon={<CarFront />}
          label="I'm waiting in my vehicle"
          description="Tell us which vehicle you're in."
          disabled={isPending}
          aria-expanded={false}
          aria-controls="vehicle-info"
          onClick={() => setIsVehicleInputVisible(true)}
        />
      )}

      <ArrivalButton
        name="arrivalMode"
        value="lobby"
        icon={<Building2 />}
        label="I'm in the lobby"
        description="We'll come greet you inside."
        disabled={isPending}
        tone="secondary"
      />

      {isPending && (
        <div
          className="flex items-center justify-center gap-2 pt-3 text-sm font-bold text-muted-foreground"
          role="status"
        >
          <LoaderCircle className="size-4 animate-spin" />
          Checking you in…
        </div>
      )}

      {state.status === 'error' && (
        <div
          className="rounded-2xl border border-[#efcaca] bg-[#fff4f4] px-4 py-3 text-center text-sm font-semibold leading-relaxed text-[#8f3434]"
          role="alert"
        >
          {state.message}
        </div>
      )}
    </form>
  )
}

function ArrivalButton({
  icon,
  label,
  description,
  tone = 'primary',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  icon: React.ReactNode
  label: string
  description: string
  tone?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="submit"
      className={cn(
        'group flex w-full cursor-pointer items-center gap-4 min-h-28 border-[#d7e1e3] bg-white shadow-sm hover:border-[#a9c7ce] hover:shadow-md rounded-[1.4rem] border p-5 text-left transition hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-2xl [&_svg]:size-7',
          tone === 'primary'
            ? 'size-14 bg-accent-tint text-accent'
            : 'size-14 bg-[#f9f9f9] text-[#78888f]',
        )}
      >
        {icon}
      </div>
      <div>
        <div
          className={cn(
            'font-bold tracking-[-0.02em]',
            tone === 'primary'
              ? 'text-xl text-[#16262f]'
              : 'text-lg text-[#4d5d64]',
          )}
        >
          {label}
        </div>
        <div
          className={cn(
            'mt-1 font-medium text-base leading-snug text-muted-foreground',
            tone === 'primary' ? 'text-base' : 'text-sm',
          )}
        >
          {description}
        </div>
      </div>
    </button>
  )
}

function firstName(customerName: string) {
  return customerName.trim().split(/\s+/)[0] || customerName
}

async function completePreviewCheckIn(
  _previousState: CustomerCheckInActionState,
  formData: FormData,
): Promise<CustomerCheckInActionState> {
  const arrivalMode = formData.get('arrivalMode')

  if (arrivalMode !== 'lobby' && arrivalMode !== 'vehicle') {
    return {
      status: 'error',
      message: 'Choose where you are waiting.',
    }
  }

  return {
    status: 'success',
    message: "You're checked in. We'll be with you soon.",
    arrivalMode,
  }
}
