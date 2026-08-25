'use client'

import { useState } from 'react'
import { CalendarCheck, UserRound } from 'lucide-react'

import { useCheckInChime } from '@/hooks/useCheckInChime'
import { useNow } from '@/hooks/useNow'

import { CheckInList } from './CheckInList'
import { DashboardColumn } from './DashboardColumn'
import { DashboardHeader } from './DashboardHeader'
import { EnableSoundOverlay, SoundSettingsDialog } from './DashboardSound'
import { ShopFlowGuide } from './ShopFlowGuide'
import type { CheckIn, CheckInQueue, DashboardConnectionStatus } from './types'
import { useDashboardCheckIns } from './useDashboardCheckIns'

type DashboardQueues = {
  appointments: CheckInQueue
  walkIns: CheckInQueue
}

export function TechDashboard({
  location,
  locationId,
  initialCheckIns,
}: {
  location: string
  locationId: string
  initialCheckIns: CheckIn[]
}) {
  const now = useNow()
  const [showSoundSettings, setShowSoundSettings] = useState(false)
  const [showShopFlowGuide, setShowShopFlowGuide] = useState(false)
  const { queues, waitingCount, connectionStatus, closeCheckIn } =
    useDashboardCheckIns({
      location,
      locationId,
      initialCheckIns,
      now,
    })
  const { isAudioUnlocked, soundPath, enableChime, changeSound } =
    useCheckInChime(waitingCount > 0)
  const clock = now
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
    : ''

  return (
    <>
      <DashboardView
        connectionStatus={connectionStatus}
        location={location}
        clock={clock}
        queues={queues}
        now={now}
        onCloseCheckIn={closeCheckIn}
        onOpenShopFlowGuide={() => setShowShopFlowGuide(true)}
        onOpenSoundSettings={() => setShowSoundSettings(true)}
      />

      {!isAudioUnlocked && <EnableSoundOverlay onEnableSound={enableChime} />}

      {showSoundSettings && (
        <SoundSettingsDialog
          selectedSoundPath={soundPath}
          onSelectSound={changeSound}
          onClose={() => setShowSoundSettings(false)}
        />
      )}

      <ShopFlowGuide
        open={showShopFlowGuide}
        onOpenChange={setShowShopFlowGuide}
      />
    </>
  )
}

export function DashboardView({
  connectionStatus,
  location,
  clock,
  queues,
  now,
  onCloseCheckIn,
  onOpenShopFlowGuide,
  onOpenSoundSettings,
}: {
  connectionStatus: DashboardConnectionStatus
  location: string
  clock: string
  queues: DashboardQueues
  now: Date | null
  onCloseCheckIn: (id: string) => void
  onOpenShopFlowGuide: () => void
  onOpenSoundSettings: () => void
}) {
  return (
    <main className="min-h-screen bg-[#f7f9f9] text-[#1f2933]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-5 sm:px-8 md:px-10">
        <DashboardHeader
          connectionStatus={connectionStatus}
          location={location}
          clock={clock}
          onOpenShopFlowGuide={onOpenShopFlowGuide}
          onOpenSoundSettings={onOpenSoundSettings}
        />

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-2">
          <DashboardColumn
            title="Appointments"
            count={queues.appointments.waiting.length}
            icon={<CalendarCheck />}
            accent="green"
          >
            <CheckInList
              queue={queues.appointments}
              emptyLabel="No appointments waiting"
              now={now}
              onCloseCheckIn={onCloseCheckIn}
            />
          </DashboardColumn>

          <DashboardColumn
            title="Walk-ins"
            count={queues.walkIns.waiting.length}
            icon={<UserRound />}
            accent="blue"
          >
            <CheckInList
              queue={queues.walkIns}
              emptyLabel="No walk-ins waiting"
              now={now}
              onCloseCheckIn={onCloseCheckIn}
            />
          </DashboardColumn>
        </div>
      </div>
    </main>
  )
}
