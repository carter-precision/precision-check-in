import type { ReactNode } from 'react'
import { BellRing, CreditCard, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { KioskData, StepId } from './types'

export function KioskHeader({
  clock,
  goTo,
}: {
  clock: string
  goTo: (step: StepId, partial?: Partial<KioskData>) => void
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Start a quote"
        className="text-muted-foreground"
        onClick={() =>
          goTo('quoteServiceType', {
            quoteSource: 'header',
            serviceType: null,
            paymentType: null,
          })
        }
      >
        <FileText className="size-6" />
      </Button>

      <div className="text-sm font-semibold text-muted-foreground">{clock}</div>
    </div>
  )
}

export function KioskStep({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-1 animate-in fade-in slide-in-from-bottom-3 duration-300 flex-col">
      {title && (
        <div className="mb-7 pt-16 text-center">
          {title && (
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#16262f]">
              {title}
            </h1>
          )}
        </div>
      )}

      {children}
    </section>
  )
}

export function ChoiceButton({
  icon,
  label,
  description,
  trailing,
  onClick,
}: {
  icon: ReactNode
  label: string
  description: string
  trailing?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-28 w-full cursor-pointer items-center gap-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c7ce] hover:shadow-md active:translate-y-0"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent transition group-hover:brightness-97">
        <div className="[&_svg]:h-7 [&_svg]:w-7">{icon}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xl font-bold tracking-[-0.02em] text-[#16262f]">
          {label}
        </div>
        <div className="mt-1 text-base font-medium leading-snug text-muted-foreground">
          {description}
        </div>
      </div>

      {trailing && <div className="ml-4 shrink-0">{trailing}</div>}
    </button>
  )
}

export function ChoiceCard({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-64 min-w-0 cursor-pointer flex-col items-center justify-center gap-6 rounded-[1.4rem] border border-[#d7e1e3] bg-white px-3 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c7ce] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent active:translate-y-0 md:min-h-72 md:px-5"
    >
      <span aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-3xl bg-accent-tint text-accent transition group-hover:brightness-97 [&_svg]:size-12 md:size-28 md:[&_svg]:size-14">
        {icon}
      </span>
      <span className="text-xl font-bold tracking-[-0.02em] text-[#16262f] md:text-2xl">
        {label}
      </span>
    </button>
  )
}

export function RingTeamButton({ onClick }: { onClick: () => void }) {
  return (
    <FloatingActionButton
      icon={<BellRing className="size-6" />}
      onClick={onClick}
    >
      Ring for a team member
    </FloatingActionButton>
  )
}

export function PayCashInsteadButton({ onClick }: { onClick: () => void }) {
  return (
    <FloatingActionButton
      icon={<CreditCard className="size-6" />}
      onClick={onClick}
    >
      Pay cash instead
    </FloatingActionButton>
  )
}

function FloatingActionButton({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode
  children: ReactNode
  onClick: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-5">
      <Button
        className="pointer-events-auto h-16 gap-3 rounded-full border border-[#d7e1e3] bg-white px-9 text-lg font-bold text-[#16262f] shadow-md hover:bg-[#d7e1e3]/20"
        onClick={onClick}
      >
        {icon}
        {children}
      </Button>
    </div>
  )
}
