# Customer check-in integration

The customer check-in page accepts an Omega appointment GUID and invoice ID:

```text
https://<app-host>/check-in?appointment={{appointment_guid}}&id={{id}}
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

## UI preview

Open `/prod-preview` in any environment to review common Kiosk, Dashboard, and
Check-in screens. The page uses fake data and local-only interactions; it does
not call Omega or Supabase and cannot create or update production records.

The preview is available in production by default so it can be shared with
non-technical reviewers. Set `DISABLE_PREVIEW=true` to make the route return a
404 response. The page is marked `noindex, nofollow` whether enabled or disabled.

The Check-in tab includes ready, missing-vehicle, too-early, unavailable, and
completed states. The ready and missing-vehicle forms can be exercised without
creating a check-in.

Only `OPEN` appointments with type `inshop` are eligible. Check-in opens 15
minutes before the appointment and closes at the appointment end time. A failed,
mismatched, mobile, closed, or expired lookup never displays customer
information and does not offer a manual form.

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
