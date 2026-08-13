# Omega availability-aware scheduling requests

The kiosk now replaces the arbitrary preferred-date field with availability
returned by Omega. Customers can select an Omega-provided service window or
indicate that they are flexible. The selected window is a request, not a
confirmed appointment.

After a windshield quote or rock chip lead creates an Omega invoice, the server
attempts to create an appointment with:

- `status: HOLD`
- `type: inshop` or `mobile`
- the Omega location used for the availability lookup
- `requested_window_start` and `requested_window_end` when a window was chosen
- a kiosk note stating that the exact time still requires confirmation
- `ignore_capacity: false`

Held appointments are intended to give reps a structured scheduling queue
without consuming schedule capacity or promising an exact appointment to the
customer.

## Customer flow

1. Choose mobile or in-shop service.
2. Enter the service ZIP. Mobile requests use it to resolve an Omega quote
   location; in-shop requests use the selected shop's configured Omega ID.
3. Choose one of Omega's current windows or choose the flexible option.
4. Complete the windshield quote or rock chip service request.
5. The result explains that a rep will confirm the exact appointment.

If availability cannot be loaded, the customer can choose rep follow-up and
finish without an appointment write. If lead/quote creation succeeds but the
held appointment write fails, the submission remains successful and the result
uses the same follow-up wording. This avoids retrying the state-changing Omega
request and creating a duplicate invoice.

Rock chip requests use the same availability and held-appointment mechanism,
but skip windshield quote completion and invoice fetching. See
`omega-rock-chip-scheduling.md` for the minimal request contract and campaign
tags.

## Configuration

The existing `OMEGA_LOCATION_MAP` maps Omega location IDs to local slugs and is
used in reverse for in-shop availability.

For mobile work, the server first checks Omega's quote-location route. Some
serviced ZIP codes return an empty result from that route, so the integration
falls back to Omega's location-search route. The fallback accepts only active,
serviced locations present in `OMEGA_LOCATION_MAP`, preferring an explicit ZIP
match and then the nearest location. Internal or unmapped Omega locations are
never offered to the kiosk.

Optional scheduling variables:

```env
OMEGA_DEFAULT_TIME_ZONE=America/Denver
OMEGA_SCHEDULING_SECRET=<at least 32 characters>
OMEGA_KIOSK_HOLD_REASON=Kiosk scheduling request
```

- `OMEGA_DEFAULT_TIME_ZONE` is used only when Omega omits a location timezone.
- `OMEGA_SCHEDULING_SECRET` signs short-lived availability tokens. If omitted,
  `CHECK_IN_PROOF_SECRET` is used. One of them must contain at least 32
  characters.
- `OMEGA_KIOSK_HOLD_REASON` is optional. When supplied, it must match a hold
  reason accepted by the Omega account. When omitted, `hold_reason` is not sent.

The Omega API key needs permission to view locations/availability and create
appointments. Omega calls remain server-side.

## Safe local testing

The local mock supports the new read and write routes:

```powershell
npm.cmd run omega:mock
```

It returns seven days of mock availability and accepts only appointment POSTs
whose status is `HOLD`. No request reaches Omega when `OMEGA_API_URL` points to
the local mock.

## Production test checklist

When you are ready to test against Omega:

1. Verify the API key has appointment-create access.
2. If using `OMEGA_KIOSK_HOLD_REASON`, configure the exact same reason in Omega.
3. Submit one cash quote using a window.
4. Confirm the new appointment is in Omega's Hold queue, does not consume
   capacity, and contains the requested window and kiosk note.
5. Submit a flexible request and confirm it creates a hold without a requested
   window.
6. Test mobile routing with a ZIP near each service area.
7. Test insurance separately. Omega's insurance response does not always expose
   an invoice ID; in that case the quote succeeds and the kiosk reports that a
   rep will follow up rather than attempting an appointment write.
