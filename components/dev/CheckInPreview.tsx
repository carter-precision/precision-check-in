import {
  CheckInPreviewSelector,
  type CheckInPreviewState,
} from '@/components/dev/CheckInPreviewSelector'
import {
  CheckInShell,
  CheckInTooEarlyContent,
  CheckInUnavailableContent,
} from '@/components/check-in/CheckInShell'
import { CustomerCheckInForm } from '@/components/check-in/CustomerCheckInForm'

export function CheckInPreview({ state }: { state: CheckInPreviewState }) {
  return (
    <CheckInShell>
      <CheckInPreviewSelector state={state} />

      {state === 'resolved' && (
        <CustomerCheckInForm
          proof="preview"
          customerName="Jordan Example"
          vehicleDescription="2024 Toyota Camry White"
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

      {state === 'too-early' && <CheckInTooEarlyContent />}

      {state === 'appointment-not-found' && <CheckInUnavailableContent />}
    </CheckInShell>
  )
}

export function getCheckInPreviewState(
  value: string | undefined,
): CheckInPreviewState {
  switch (value) {
    case 'too-early':
      return 'too-early'
    case 'missing-vehicle':
      return 'missing-vehicle'
    case 'appointment-not-found':
    case 'closed':
    case 'mobile':
    case 'expired':
    case 'appointment-missing':
    case 'mismatched-invoice':
      return 'appointment-not-found'
    case 'resolved':
    default:
      return 'resolved'
  }
}
