import type { ValidatedQuoteSubmission } from './quote-request'
import type { SchedulingTokenPayload } from './scheduling-token'

export function buildHeldAppointmentPayload(
  input: ValidatedQuoteSubmission,
  token: SchedulingTokenPayload,
  invoiceId: string,
  holdReason: string | null,
) {
  const payload: Record<string, unknown> = {
    invoice_id: Number(invoiceId),
    status: 'HOLD',
    type: input.service.mode === 'shop' ? 'inshop' : 'mobile',
    location_id: Number(token.omegaLocationId),
    note: buildAppointmentNote(input, token),
    ignore_capacity: false,
  }

  if (token.kind === 'window') {
    payload.requested_window_start = token.startTime
    payload.requested_window_end = token.endTime
  }

  if (input.service.mode === 'mobile') {
    payload.service_address = JSON.stringify({
      description: input.service.address,
    })
  }

  if (holdReason) payload.hold_reason = holdReason

  return payload
}

function buildAppointmentNote(
  input: ValidatedQuoteSubmission,
  token: SchedulingTokenPayload,
) {
  const preference =
    token.kind === 'window'
      ? `Customer requested ${token.windowLabel}. Exact appointment time is pending confirmation.`
      : 'Customer is flexible. Contact them to confirm an appointment date and time.'
  const service =
    input.service.mode === 'mobile'
      ? `Mobile service requested at ${input.service.address}.`
      : `In-shop service requested at ${token.omegaLocationLabel}.`

  return `Kiosk scheduling request. ${preference} ${service}`
}
