import { BookOpen, Volume2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DashboardConnectionStatus } from './types'

const connectionDetails: Record<
  DashboardConnectionStatus,
  { label: string; description: string; className: string }
> = {
  live: {
    label: 'Live',
    description: 'Check-ins are updating in real time.',
    className: 'bg-[#e5f4ed] text-[#2f7655]',
  },
  backup: {
    label: 'Backup sync',
    description:
      'Live updates are reconnecting. Check-ins are refreshing every 10 seconds.',
    className: 'bg-amber-100 text-amber-800',
  },
  offline: {
    label: 'Offline',
    description:
      'The dashboard cannot refresh check-ins. Check the internet connection.',
    className: 'bg-red-100 text-red-800',
  },
}

export function DashboardHeader({
  clock,
  connectionStatus,
  location,
  onOpenShopFlowGuide,
  onOpenSoundSettings,
}: {
  clock: string
  connectionStatus: DashboardConnectionStatus
  location: string
  onOpenShopFlowGuide: () => void
  onOpenSoundSettings: () => void
}) {
  const connection = connectionDetails[connectionStatus]

  return (
    <header className="flex items-center justify-between px-0.5">
      <div>
        <h1 className="text-3xl font-bold capitalize tracking-[-0.04em] text-[#16262f]">
          {location.replaceAll('-', ' ') || 'Front desk'}
        </h1>
        <p className="text-base font-medium capitalize text-[#6f7f86]">
          Live customer activity
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="status"
          title={connection.description}
          className={`mr-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${connection.className}`}
        >
          <span className="size-2 rounded-full bg-current" aria-hidden="true" />
          {connection.label}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="mr-2 rounded-xl bg-[#e7f1f2] p-6 text-[#2f6975] hover:bg-[#e5f4ed] hover:text-[#3b8d65]"
          onClick={onOpenShopFlowGuide}
          aria-label="Open shop flow guide"
          title="Shop flow guide"
        >
          <BookOpen className="size-[2.1rem] stroke-[1.8]" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="rounded-xl text-[#6f7f86] hover:bg-[#e7f1f2] hover:text-[#2f6975]"
          onClick={onOpenSoundSettings}
          aria-label="Choose chime sound"
          title="Chime sound"
        >
          <Volume2 className="size-6 stroke-[2.3]" />
        </Button>
        <div className="text-lg font-semibold tabular-nums text-[#6f7f86]">
          {clock}
        </div>
      </div>
    </header>
  )
}
