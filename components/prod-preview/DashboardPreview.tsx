'use client'

import { useMemo, useState } from 'react'

import { DashboardView } from '@/components/dashboard/TechDashboard'
import { ShopFlowGuide } from '@/components/dashboard/ShopFlowGuide'
import { SoundSettingsDialog } from '@/components/dashboard/DashboardSound'
import type { CheckIn, CheckInQueue } from '@/components/dashboard/types'

export const dashboardPreviewOptions = [
  { value: 'empty', label: 'Empty dashboard' },
  { value: 'new-arrival', label: 'New arrival' },
  { value: 'needs-attention', label: 'Needs attention' },
  { value: 'mixed', label: 'Mixed queue' },
] as const

export type DashboardPreviewState =
  (typeof dashboardPreviewOptions)[number]['value']

const PREVIEW_NOW = new Date('2026-08-13T14:30:00.000Z')

export function DashboardPreview({ state }: { state: DashboardPreviewState }) {
  const [checkIns, setCheckIns] = useState(() => getPreviewCheckIns(state))
  const [showShopFlowGuide, setShowShopFlowGuide] = useState(false)
  const [showSoundSettings, setShowSoundSettings] = useState(false)
  const queues = useMemo(() => groupCheckIns(checkIns), [checkIns])

  function closeCheckIn(id: string) {
    setCheckIns((current) =>
      current.map((checkIn) =>
        checkIn.id === id
          ? {
              ...checkIn,
              status: 'closed',
              closed_at: PREVIEW_NOW.toISOString(),
            }
          : checkIn,
      ),
    )
  }

  return (
    <>
      <DashboardView
        location="layton"
        clock="10:30 AM"
        queues={queues}
        now={PREVIEW_NOW}
        onCloseCheckIn={closeCheckIn}
        onOpenShopFlowGuide={() => setShowShopFlowGuide(true)}
        onOpenSoundSettings={() => setShowSoundSettings(true)}
      />

      <ShopFlowGuide
        open={showShopFlowGuide}
        onOpenChange={setShowShopFlowGuide}
      />

      {showSoundSettings && (
        <SoundSettingsDialog
          selectedSoundPath="/sound-1.mp3"
          onSelectSound={() => undefined}
          onClose={() => setShowSoundSettings(false)}
        />
      )}
    </>
  )
}

function getPreviewCheckIns(state: DashboardPreviewState): CheckIn[] {
  if (state === 'empty') return []

  const newArrival = createCheckIn({
    id: 'preview-new-arrival',
    customer_name: 'Alex Morgan',
    visit_type: 'appointment',
    arrival_mode: 'vehicle',
    vehicle_description: '2022 Subaru Outback',
    created_at: '2026-08-13T14:29:57.000Z',
  })

  const needsAttention = createCheckIn({
    id: 'preview-needs-attention',
    customer_name: 'Taylor Reed',
    visit_type: 'walk_in',
    service_type: 'rock_chip',
    payment_type: 'insurance',
    created_at: '2026-08-13T14:26:00.000Z',
  })

  if (state === 'new-arrival') return [newArrival]
  if (state === 'needs-attention') return [needsAttention]

  return [
    newArrival,
    createCheckIn({
      id: 'preview-pickup',
      customer_name: 'Sam Patel',
      visit_type: 'vehicle_pickup',
      created_at: '2026-08-13T14:28:30.000Z',
    }),
    needsAttention,
    createCheckIn({
      id: 'preview-help',
      customer_name: 'Jamie Chen',
      visit_type: 'walk_in',
      service_type: 'bell',
      created_at: '2026-08-13T14:29:10.000Z',
    }),
    createCheckIn({
      id: 'preview-closed',
      customer_name: 'Casey Williams',
      visit_type: 'appointment',
      status: 'closed',
      closed_at: '2026-08-13T14:28:00.000Z',
      created_at: '2026-08-13T14:20:00.000Z',
    }),
  ]
}

function createCheckIn(overrides: Partial<CheckIn>): CheckIn {
  return {
    id: 'preview-check-in',
    location_id: 'preview-location',
    customer_name: 'Preview Customer',
    phone: null,
    visit_type: 'walk_in',
    service_type: 'other',
    payment_type: null,
    source: 'preview',
    status: 'waiting',
    repair_authorized: false,
    windshield_intent: null,
    arrival_mode: null,
    vehicle_description: null,
    omega_appointment_guid_hash: null,
    omega_appointment_id: null,
    omega_invoice_id: null,
    created_at: '2026-08-13T14:29:00.000Z',
    closed_at: null,
    ...overrides,
  }
}

function groupCheckIns(checkIns: CheckIn[]): {
  appointments: CheckInQueue
  walkIns: CheckInQueue
} {
  const queues = {
    appointments: { waiting: [], recent: [] } as CheckInQueue,
    walkIns: { waiting: [], recent: [] } as CheckInQueue,
  }

  for (const checkIn of checkIns) {
    const queue =
      checkIn.visit_type === 'appointment' ||
      checkIn.visit_type === 'vehicle_pickup'
        ? queues.appointments
        : queues.walkIns

    if (checkIn.status === 'closed') queue.recent.push(checkIn)
    else queue.waiting.push(checkIn)
  }

  return queues
}
