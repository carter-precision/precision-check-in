# Omega appointment scheduling

Windshield quotes and appointment scheduling are separate operations. The kiosk
first creates the quote, preserves its Omega invoice ID, and displays the cash
quote or insurance acknowledgement. Only after that result does the customer
choose in-shop or mobile service and select an Omega-provided appointment
window.

The server then creates the appointment with `POST /Appointments`. The request
contains only the data collected or resolved during the kiosk flow:

- `invoice_id` from the successful Quotes response
- `location_id` from the server-signed availability token
- `status: HOLD`
- `type: inshop` or `mobile`
- `requested_window_start` and `requested_window_end`
- `service_address` for mobile service
- a concise note describing the selected window and service location

Fields such as technician, inspection, signature, receipt, coordinates, bay,
skills, capacity overrides, and hold reason are not sent.

## Location ID handling

The browser does not choose or map an Omega location ID. The appointment-window
lookup resolves the correct Omega location and embeds that ID, the routing key,
service mode, and selected window in a short-lived signed token. On appointment
submission, the server verifies the token against the kiosk location, service
mode, and routing key before using its `omegaLocationId`.

For in-shop service, the selected local shop slug is mapped through
`OMEGA_LOCATION_MAP`. For mobile service, the ZIP is resolved through Omega's
quote-location route with the existing serviced-location fallback.

## Customer flow

1. Capture vehicle/VIN, glass, contact, ZIP, and payment/insurance details.
2. Create and display the quote or insurance acknowledgement.
3. Prompt the customer to schedule an appointment.
4. Choose in-shop or mobile service.
5. Choose an available date and appointment window.
6. Create a HOLD Omega appointment and display the requested appointment details.

The scheduler intentionally has no flexible option. If availability cannot be
loaded, the customer can request team follow-up without creating an Omega
appointment.

## Configuration

```env
OMEGA_DEFAULT_TIME_ZONE=America/Denver
OMEGA_SCHEDULING_SECRET=<at least 32 characters>
```

- `OMEGA_DEFAULT_TIME_ZONE` is used only when Omega omits a location timezone.
- `OMEGA_SCHEDULING_SECRET` signs short-lived availability tokens. If omitted,
  `CHECK_IN_PROOF_SECRET` is used. One of them must contain at least 32
  characters.
- `OMEGA_LOCATION_MAP` must contain every shop/location that the kiosk may
  schedule.

The Omega API key needs permission to read locations and appointment slots and
to create appointments. All Omega calls remain server-side.

## Safe local testing

```powershell
npm.cmd run omega:mock
```

The local mock returns appointment availability and accepts minimal HOLD
appointment payloads that include both `invoice_id` and `location_id`.

## Production test checklist

1. Verify the API key has appointment-create access.
2. Submit a cash quote and select an in-shop window.
3. Confirm the HOLD appointment uses the quote invoice and token location IDs.
4. Confirm its requested start/end match the selected window.
5. Submit mobile service and verify the serialized service address.
6. Repeat the flow for insurance and verify its Quotes response exposes the
   required invoice ID before scheduling begins.
