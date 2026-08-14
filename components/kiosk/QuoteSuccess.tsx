import type { ReactNode } from 'react'

export function QuoteSuccessDetails({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-6 shadow-sm">
      {children}
    </div>
  )
}

export function QuoteSuccessDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 text-accent [&_svg]:size-5">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 font-semibold text-[#16262f]">{value}</div>
      </div>
    </div>
  )
}
