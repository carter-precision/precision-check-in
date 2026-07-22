# Customer check-in integration

The customer check-in page accepts an Omega appointment GUID and invoice ID:

```text
https://<app-host>/check-in?appointment_guid={{appointment_guid}}&invoice_id={{id}}
```

The location is determined from the matched Omega appointment. The appointment's numeric `location_id` is converted to the corresponding local location slug through `OMEGA_LOCATION_MAP`. The invoice location is not used because an invoice and its appointment may legitimately have different locations.

## Required environment variables

```text
OMEGA_API_KEY=<Omega API key>
OMEGA_API_URL=https://app.omegaedi.com/api/2.0
OMEGA_LOCATION_MAP={"1":"layton"}
CHECK_IN_PROOF_SECRET=<at least 32 random characters>
```

`OMEGA_API_URL` is optional and defaults to the production Omega 2.0 API.

## Development preview

When the app is running in development, open this URL to exercise the customer UI without calling Omega or Supabase:

```text
/check-in?preview=1
```

The preview uses fake customer and vehicle data. Either arrival button displays the success state without creating a check-in. The preview flag is ignored in production.

Only `OPEN` appointments with type `inshop` are eligible. Check-in opens 90 minutes before the appointment and closes two hours after its end time. A failed, mismatched, mobile, closed, or expired lookup never displays customer information and does not offer a manual form.

## Pending database review

No migration or Supabase schema change has been made. Customer check-in submission expects these nullable columns on `check_ins`:

```text
arrival_mode text                 -- lobby | vehicle
vehicle_description text
omega_appointment_id text
omega_invoice_id text
omega_appointment_guid_hash text
```

`omega_appointment_id` should have a partial unique index for non-null values so retries and double taps remain idempotent. The code treats PostgreSQL unique-violation error `23505` as an already-completed check-in.

After the database is updated, regenerate `lib/supabase/types.ts`. Until then, the new page can resolve and display appointments, but final submission will fail because the new columns do not exist.
