import {
  CheckInShell,
  CheckInTooEarlyContent,
  CheckInUnavailableContent,
} from '@/components/check-in/CheckInShell'
import {
  CustomerCheckInForm,
  CustomerCheckInSuccess,
} from '@/components/check-in/CustomerCheckInForm'

const PREVIEW_APPOINTMENT_START = 1_894_728_600_000

export const checkInPreviewOptions = [
  { value: 'resolved', label: 'Ready to check in' },
  { value: 'missing-vehicle', label: 'Missing vehicle details' },
  { value: 'too-early', label: 'Too early' },
  { value: 'appointment-not-found', label: 'Appointment not found' },
  { value: 'success', label: 'Check-in complete' },
] as const

export type CheckInPreviewState =
  (typeof checkInPreviewOptions)[number]['value']

export function CheckInPreview({ state }: { state: CheckInPreviewState }) {
  return (
    <CheckInShell>
      {state === 'resolved' && (
        <CustomerCheckInForm
          proof="preview"
          customerName="Jordan Example"
          vehicleDescription="2024 Toyota Camry"
          preview
        />
      )}

      {state === 'missing-vehicle' && (
        <CustomerCheckInForm
          proof="preview"
          customerName="Jordan Example"
          vehicleDescription={null}
          preview
        />
      )}

      {state === 'too-early' && (
        <CheckInTooEarlyContent appointmentStart={PREVIEW_APPOINTMENT_START} />
      )}

      {state === 'appointment-not-found' && <CheckInUnavailableContent />}

      {state === 'success' && (
        <CustomerCheckInSuccess
          message="You're checked in. We'll be with you soon."
          arrivalMode="lobby"
        />
      )}
    </CheckInShell>
  )
}
