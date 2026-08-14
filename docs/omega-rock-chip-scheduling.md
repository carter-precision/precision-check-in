# Omega rock chip walk-ins

The kiosk rock chip paths are in-shop walk-in lead flows, not quote-result or
scheduling flows. Both the walk-in entry and the header entry collect the same
information and submit through the existing kiosk Omega quote API.

## Customer flow

1. Choose cash pay or insurance.
2. Enter first name, phone, and optional email.
3. Resolve the vehicle through VIN or year/make/model/body-style selection.
4. Cash customers accept the repair authorization. Insurance customers see the
   claim-handling message and can switch to cash pay.
5. Submit the Omega lead and dashboard check-in.
6. Show the default kiosk check-in success step.

The flow does not collect service location, appointment time, ZIP, SMS consent,
insurance company, policy number, deductible, or damaged-glass details.

## Omega request

Rock chip leads use the vehicle ID returned by the existing Omega vehicle lookup
flow:

```text
GET /api/2.0/Quotes/{resolved_vehicle_id}/WSREPAIR
```

The request sends:

```text
position=WSREPAIR
customer_fname
customer_phone
customer_email       # only when provided
folder=pag
campaign=Rock Chip Web Quote   # cash only
smart=true
lead_type=web_lead
```

Insurance rock chip requests omit campaign and insurance-account fields. Do not
use a fixed vehicle ID or add year, make, model, deductible, scheduling, or blank
attribution/template fields to the query.

## Result behavior

The rock chip response does not run the windshield cash completion flow, create
an appointment, or expose invoice/price details to the browser. Omega lead
creation and the dashboard check-in are attempted independently from the same
guarded submission. An Omega failure does not block the dashboard request or
the default kiosk success step, so the customer is not prompted to resubmit.
