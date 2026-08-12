import { CheckCircle2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { KioskStep } from '../KioskPrimitives'
import type { KioskStepProps } from '../types'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function WindshieldInsuranceSuccessStep({
  data,
  resetFlow,
}: KioskStepProps) {
  const deductible = data.deductibleAmount.trim()
    ? Number(data.deductibleAmount)
    : null

  return (
    <KioskStep>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent">
          <ShieldCheck className="size-10" />
        </div>

        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#16262f]">
          We&apos;ll handle the insurance claim
        </h1>
        <p className="mt-4 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
          We received your information and will work with{' '}
          {data.insuranceCompanyLabel || 'your insurance company'}. Our team
          will contact you about the next steps.
        </p>

        <p className="mt-5 max-w-xl rounded-xl bg-accent-tint px-5 py-4 text-sm font-semibold leading-relaxed text-[#40525a]">
          {data.quoteSchedulingStatus === 'held'
            ? 'Your preferred service request is in our scheduling queue. We’ll contact you to confirm the exact appointment time.'
            : 'We’ll contact you to arrange and confirm your appointment.'}
        </p>

        <div className="mt-8 w-full rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 text-left shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">
            Your responsibility
          </p>
          <p className="mt-2 text-xl font-bold text-[#16262f]">
            You will be responsible for your insurance deductible.
          </p>
          <p className="mt-2 font-medium text-muted-foreground">
            {deductible !== null
              ? `The deductible you provided is ${currencyFormatter.format(deductible)}.`
              : 'We will confirm the deductible amount with you and your insurance company.'}
          </p>
        </div>

        <Button
          className="mt-8 h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
          onClick={resetFlow}
        >
          <CheckCircle2 className="size-6" />
          Finish
        </Button>
      </div>
    </KioskStep>
  )
}
