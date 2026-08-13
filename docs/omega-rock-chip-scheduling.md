# Omega rock chip scheduling

The kiosk rock chip paths are service-request flows, not quote-result flows.
Both the walk-in entry and the header entry collect the same information and
submit through the existing kiosk Omega quote API.

## Customer flow

1. Choose cash pay or insurance. The walk-in path already reaches this choice
   after selecting Rock chip; the header path now joins the same step.
2. Enter first name, phone, optional email, and SMS consent.
3. For insurance, select the Omega insurance company and enter a policy number.
   Rock chip requests do not collect or send a deductible.
4. Choose mobile or in-shop service, enter the ZIP, and select an available
   service window or flexible follow-up.
5. Submit the lead and scheduling request.
6. Review the entered information and finish. Cash pay displays `$79.99`;
   insurance displays the claim-handling message.

## Omega request

Rock chip leads use:

```text
GET /api/2.0/Quotes/66687/WSREPAIR
```

The server sends only the fields collected or required by this flow:

```text
position=WSREPAIR
customer_zip
customer_fname
customer_phone
customer_email       # only when provided
customer_sms
folder=pag
campaign
smart=true
lead_type=web_lead
account_company_id   # insurance only
account_policy_no    # insurance only
```

Campaign attribution is exact:

```text
Rock Chip Web Quote
Ins Rock Chip Web Quote
```

Do not add year, make, model, vehicle query fields, deductible, or blank
attribution/template fields. The fixed path identifier is part of Omega's rock
chip repair route and is not customer vehicle data.

## Result and scheduling behavior

The rock chip response does not run the windshield cash completion flow and
does not fetch an invoice or expose an invoice/price result to the browser. If
Omega's initial HTML includes an invoice ID, the server uses it only to attach
the customer's held scheduling request. If no ID is available, the lead still
succeeds and the result indicates that the team must follow up.

The final kiosk step always treats the selected time as a request pending exact
confirmation. It recaps contact, service location, ZIP, requested window, and
payment/insurance details.
