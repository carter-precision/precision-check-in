import type { ValidatedAppointmentSubmission } from './appointment-request'
import type { SchedulingTokenPayload } from './scheduling-token'

export function buildAppointmentPayload(
  input: ValidatedAppointmentSubmission,
  token: SchedulingTokenPayload,
  invoiceId: string,
) {
  const payload: Record<string, unknown> = {
    invoice_id: invoiceId,
    status: 'HOLD',
    type: input.service.mode === 'shop' ? 'inshop' : 'mobile',
    location_id: token.omegaLocationId,
    note: buildAppointmentNote(input, token),
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

  return payload
}

function buildAppointmentNote(
  input: ValidatedAppointmentSubmission,
  token: SchedulingTokenPayload,
) {
  const preference =
    token.kind === 'window'
      ? `Customer selected ${token.windowLabel}.`
      : 'Customer is flexible. Contact them to confirm an appointment date and time.'
  const service =
    input.service.mode === 'mobile'
      ? `Mobile service requested at ${input.service.address}.`
      : `In-shop service requested at ${token.omegaLocationLabel}.`

  return `Kiosk appointment. ${preference} ${service}`
}
