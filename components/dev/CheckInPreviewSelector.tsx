'use client'

import { useRouter } from 'next/navigation'

export const checkInPreviewStates = [
  'resolved',
  'too-early',
  'missing-vehicle',
  'appointment-not-found',
] as const

export type CheckInPreviewState = (typeof checkInPreviewStates)[number]

const previewOptions: {
  value: CheckInPreviewState
  label: string
}[] = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'too-early', label: 'Too Early' },
  { value: 'missing-vehicle', label: 'Missing Vehicle' },
  { value: 'appointment-not-found', label: 'Appointment Not Found' },
]

export function CheckInPreviewSelector({
  state,
}: {
  state: CheckInPreviewState
}) {
  const router = useRouter()

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-4 sm:top-4">
      <select
        aria-label="Check-in preview state"
        value={state}
        onChange={(event) => {
          router.replace(
            `/check-in?preview=1&state=${event.currentTarget.value}`,
            { scroll: false },
          )
        }}
        className="h-9 cursor-pointer rounded-lg border border-[#d7e1e3] bg-white/95 px-3 pr-8 text-xs font-bold text-[#16262f] shadow-sm outline-none backdrop-blur transition hover:border-[#a9c7ce] focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        {previewOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
