<!-- AGENTS: Implementation note: Use omega-quote-integration-implementation-roadmap.md as the authoritative source for implementation scope, UI flow, validation, and phased delivery. This specification remains the reference for Omega behavior and integration rationale. Where the documents conflict, the roadmap takes precedence. -->

# Omega EDI Custom Quote Integration — Functional Design Specification

## Purpose

Wire the existing custom quote UI to Omega EDI end to end so the app can:

1. populate the vehicle-identification controls from Omega/NAGS data,
2. normalize whichever vehicle-identification path the customer uses into the identifiers Omega's quote engine needs,
3. collect customer, damaged-glass, SMS-consent, and optional insurance information,
4. invoke Omega's Web Quoter pricing logic through the discovered `Quotes` endpoint,
5. extract the resulting Omega invoice ID from the returned HTML,
6. fetch the completed invoice through Omega's documented JSON API,
7. and display the authoritative Omega-calculated quote in the app's existing result UI.

The UI is already visually designed. This document is concerned with **functionality, data flow, integration behavior, and the contract with Omega**, not with redesigning the screens or prescribing component-level implementation.

Codex should review the current codebase first and fit this behavior into the project's existing architecture, state-management patterns, validation patterns, and visual design.

---

# Core Design Principle

Treat Omega as an external quote engine:

```text
The app owns the customer experience.
Omega owns NAGS vehicle data, default part selection, pricing-profile logic,
tax calculation, and invoice/lead creation.
The integration layer translates between the two.
```

Do **not** reimplement Omega's pricing-profile rules locally unless the discovered quote endpoint becomes unusable and there is no supported alternative.

---

# Confirmed Omega Behaviors

## Documented API authentication

Omega's documented API uses an API key sent in the request header:

```text
api_key: <OMEGA_API_KEY>
```

The API key must remain server-side. Do not call authenticated Omega endpoints directly from client components or otherwise expose the key to the browser.

The documented NAGS vehicle endpoints and Invoice endpoints require this authentication.

## The normal Invoice create/update endpoints do not generate quote pricing

Testing established that `POST /Invoices` and `PUT /Invoices/{invoice_id}` can create invoices and line items, but placing NAGS SKUs or even complete `NagsQuotes` item objects into `Items` does **not** invoke the Web Quoter pricing engine.

Those requests merely persist the supplied line items and supplied prices. They do not reliably:

- choose the correct/default NAGS part,
- filter alternate hardware,
- apply pricing profiles,
- resolve the Mygrant/vendor-based price,
- or reproduce Web Quoter totals.

Therefore, do not use `POST /Invoices` plus `Items` as the primary quote-generation mechanism.

## `NagsQuotes` is not the final pricing endpoint

`GET /NagsQuotes/{vehicle_id}/{nags_part_number}` returns rich NAGS data, including candidate/default child items and list-price information, but it does not return the final Omega Web Quote total.

It is not required for the initial quote flow because the discovered `Quotes` endpoint performs default part selection and final pricing itself.

Keep `NagsQuotes` available only for diagnostics or future features unless a concrete product requirement needs it.

## The discovered `Quotes` endpoint runs Omega's actual Web Quoter logic

Omega's own Web Quoter invokes an undocumented endpoint with this general shape:

```text
GET https://app.omegaedi.com/api/2.0/Quotes/{vehicle_id}/{position}?...
```

Observed windshield example:

```text
GET /api/2.0/Quotes/66687/W
```

This endpoint has been confirmed to:

- work without an authenticated employee session,
- create or resolve the Web Quote invoice,
- select the default/applicable glass part,
- select the default associated labor/adhesive items,
- apply Omega's pricing rules/profile,
- calculate tax when applicable,
- create the lead/invoice in Omega,
- and return the resulting quote as HTML.

This is the integration point the custom app should use for final quote generation unless Omega later provides a supported JSON equivalent.

The route is undocumented, so isolate all knowledge of it behind the application's server-side Omega integration layer.

---

# Recommended Application Boundary

Because the UI needs to make multiple sequential requests while customers select vehicle information, and because Omega's API key must not be exposed, provide a server-side application boundary for Omega interactions.

In this Next.js App Router project, Route Handlers are the preferred interface for browser-driven lookup and quote requests. Exact route/file names should match the current architecture rather than this document literally.

Conceptually, the client should have access to application-owned endpoints equivalent to:

```text
GET  /api/omega/vehicles/years
GET  /api/omega/vehicles/makes?year=...
GET  /api/omega/vehicles/models?year=...&makeId=...
GET  /api/omega/vehicles/variants?year=...&makeId=...&modelId=...&modifierId=...
POST /api/quotes
```

The application endpoints should call Omega server-side and return only the normalized data needed by the current UI.

Omega-specific request construction, HTML parsing, and invoice normalization should live in a reusable server-side integration/service module rather than being distributed throughout UI components.

---

# Phase 1 — Vehicle Identification

Regardless of whether the customer starts with manual vehicle selectors, VIN, or license plate, the goal is to normalize the result into a common internal vehicle selection that can be passed to the `Quotes` endpoint.

A normalized quote-ready vehicle should ultimately contain at least:

```text
year
make_id
model_id
vehicle_id
body/trim description when applicable
VIN when supplied
license plate/state when supplied
```

The current observed `Quotes` requests use numeric Omega/NAGS IDs for `make` and `model`, not merely display names.

---

# Manual Year / Make / Model Flow

This flow is confirmed and should be fully wired.

## 1. Populate Year

Call Omega server-side:

```text
GET https://app.omegaedi.com/api/2.0/NagsVehicles/search
api_key: <OMEGA_API_KEY>
```

Omega returns an array of supported model years.

Use these values to populate the existing Year selector.

When Year changes, invalidate/reset all dependent selections below it: Make, Model, modifier/trim/body style, and resolved `vehicle_id`.

## 2. Populate Make

After a year is selected, call:

```text
GET https://app.omegaedi.com/api/2.0/NagsVehicles/search/{year}
api_key: <OMEGA_API_KEY>
```

Although Omega's public documentation labels this endpoint somewhat inconsistently, observed responses contain makes in the form:

```json
{
  "make_id": "13",
  "make_name": "Ford"
}
```

Use `make_name` as the customer-facing label and retain `make_id` as the Omega value required by subsequent requests.

When Make changes, reset Model and all downstream vehicle resolution.

## 3. Populate Model

After Year and Make are selected, call:

```text
GET https://app.omegaedi.com/api/2.0/NagsVehicles/search/{year}/{make_id}
api_key: <OMEGA_API_KEY>
```

Observed model records look like:

```json
{
  "model_id": "4543",
  "model_name": "Fusion",
  "modifier_id": null,
  "modifier_dsc": null
}
```

Use `model_name` as the main customer-facing label.

Preserve `modifier_id` and `modifier_dsc` whenever supplied. Some vehicles may require modifier/trim distinctions. Do not discard those values simply because many models return them as `null`.

If Omega returns multiple records that share a model name but differ by modifier, the existing UI should expose enough distinction for the customer to select the correct option in a way consistent with the current design.

## 4. Resolve Body Style / Final Vehicle ID

After Year, Make, and Model are known, call:

```text
GET https://app.omegaedi.com/api/2.0/NagsVehicles/search/{year}/{make_id}/{model_id}
```

If the selected model record contains a meaningful `modifier_id`, include it as:

```text
?modifier_id={modifier_id}
```

Omega documents this as the **final step** of NAGS vehicle search because the response includes body styles and the final NAGS `vehicle_id`.

Observed result shape includes values such as:

```json
{
  "body_style_id": "190",
  "body_style_dsc": "4 Door Sedan",
  "vehicle_id": "66687"
}
```

Behavior:

- If exactly one valid vehicle/body-style result is returned, resolve it automatically and store its `vehicle_id`.
- If multiple valid results are returned, use the existing UI's body/trim/variant control to let the customer distinguish them.
- The selected result's `vehicle_id` is the critical identifier used by the final `Quotes` request.

Do not assume that year/make/model is always unique.

---

# `Retrieve a NAGS Vehicle` Endpoint

Omega also exposes:

```text
GET /api/2.0/NagsVehicles/{vehicle_id}
```

The path value can be either a NAGS car ID or a 17-character VIN.

Useful optional parameters documented by Omega include:

```text
load_options=true
load_glass=WINDSHIELD | SIDE | REAR | OTHER
vin=<VIN>
```

`load_options=true` can return corresponding year/make/model/trim options and is useful for normalization or verification.

For the normal manual Year/Make/Model workflow, this endpoint is **not required simply to generate the quote**, because the search chain already resolves `vehicle_id` and the `Quotes` endpoint performs part selection.

Use it where it provides concrete value, especially VIN resolution or future vehicle verification, rather than adding an unnecessary request to every manual quote.

---

# VIN-First Flow

The existing UI allows the customer to identify the vehicle by VIN instead of manually choosing Year/Make/Model.

Omega documents that a 17-character VIN can be supplied directly as the path value to:

```text
GET https://app.omegaedi.com/api/2.0/NagsVehicles/{VIN}
```

Omega will attempt to automatically match the correct NAGS vehicle.

The server-side VIN lookup should request enough option data to normalize the match where useful, for example using `load_options=true`.

The end result of VIN lookup must be normalized into the same quote-ready values used by the manual path, especially:

```text
vehicle_id
year
make_id
model_id
body/trim description
vehicle_vin
```

The exact response shape for VIN-first resolution still needs implementation-time validation. If the VIN response does not expose the numeric `make_id` and `model_id` required by the observed `Quotes` request, resolve those IDs using the returned year/make/model data and the normal NAGS search endpoints rather than guessing.

Do not require VIN for quoting. Omega's own Web Quoter can produce a quote without it.

When a VIN is available, include it in the final Quotes request as `vehicle_vin`.

---

# License-Plate Flow

The existing visual UI includes license-plate identification.

Omega's observed `Quotes` request includes parameters named:

```text
vehicle_plate_no
vehicle_plate_state
```

However, the public Omega API documentation reviewed so far does **not** expose a confirmed license-plate-to-NAGS-vehicle lookup endpoint.

Therefore:

- preserve the existing license-plate path in the UI,
- do not invent an Omega plate-lookup contract,
- validate the actual lookup mechanism before considering this path complete,
- and ensure that any successful plate lookup ultimately produces the same normalized `vehicle_id`, year, `make_id`, and `model_id` required by quote generation.

If no supported/working plate lookup is available during implementation, the UI should follow its existing fallback/error UX and allow the customer to continue through VIN or manual Year/Make/Model rather than submitting an unresolved quote.

License-plate lookup is a known follow-up integration task, not a reason to block the confirmed manual vehicle flow.

---

# Phase 2 — Damaged Glass / Position

The custom UI's glass-selection value must be mapped to Omega's position/opening codes.

Known values observed from Omega's own form include:

```text
W               Front windshield
D_FRONT_LEFT    Front driver door glass
D_FRONT_RIGHT   Front passenger door glass
D_REAR_LEFT     Rear driver door glass
D_REAR_RIGHT    Rear passenger door glass
Q               Quarter glass
V               Vent glass
B               Back/rear glass
```

For a windshield, Omega uses:

```text
/Quotes/{vehicle_id}/W
position=W
```

Cash quote requests have also been observed with:

```text
opening=W
```

For the initial implementation, preserve Omega's observed request shape:

- path segment = mapped glass-position code,
- `position` = same mapped code,
- `opening` = same code when matching the existing cash Web Quoter request.

The fact that both `position` and `opening` exist may be legacy/redundant behavior. Do not simplify or reinterpret them until testing across multiple glass types shows that doing so is safe.

The custom app does **not** need to select a NAGS glass SKU itself for the basic quote flow. That is one of the major reasons to use the `Quotes` endpoint: Omega chooses the default applicable part from `vehicle_id` + position and applies its own related-item logic.

---

# Phase 3 — Customer Data and SMS Consent

The quote request should use customer values already collected by the existing UI.

Confirmed/observed quote parameters include:

```text
customer_zip
customer_fname
customer_surname
customer_phone
customer_email
customer_sms
```

ZIP is important because Omega appears to use it as part of location routing, and the resulting invoice should be treated as authoritative for the selected location and tax result.

## SMS consent

If the existing UI already contains an SMS-consent checkbox, wire it directly to:

```text
customer_sms
```

If it does not exist, add an SMS-consent control consistent with the existing UI and form patterns.

Do not silently assume SMS consent.

---

# Phase 4 — Insurance vs Non-Insurance

The existing UI branches within one custom flow between insurance and non-insurance customers. Preserve that product behavior.

Both paths use the same Omega `Quotes` endpoint, but they send different query data and campaign attribution.

---

# Cash / Non-Insurance Quote Request

Construct the server-side Omega request using the values already resolved by the UI/integration.

General shape:

```text
GET https://app.omegaedi.com/api/2.0/Quotes/{vehicle_id}/{position}
```

Known relevant query parameters:

```text
year={year}
make={make_id}
model={model_id}
vehicle_id={vehicle_id}
position={position}
opening={position}                 # preserve where matching cash quoter behavior
vehicle_vin={vin}                  # optional
vehicle_plate_no={plate}           # optional when available
vehicle_plate_state={plate_state}  # optional when available

customer_zip={zip}
customer_fname={first_name}
customer_surname={last_name}
customer_phone={phone}
customer_email={email}
customer_sms={0|1}

folder=pag
medium=web_quote
campaign=WEB QUOTE
lead_type=web_lead
smart=true
```

Observed Omega requests also contain several blank or Web-Quoter-specific fields such as `source`, `referrer`, `campid`, `Tags`, `template_id`, and `disable_scheduling`.

Do not invent values for them. Preserve them only when the current application's attribution/business requirements provide a real value or testing proves a blank compatibility parameter is required.

`template_id` is not part of the initial custom integration unless later testing demonstrates a dependency.

---

# Insurance Company Selection

Insurance quotes require Omega's numeric:

```text
account_company_id
```

If the existing visual insurer selector already contains a fixed insurer list, wire each insurer to the corresponding Omega company ID rather than sending display names.

If insurer data needs to be sourced dynamically, Omega's documented Companies endpoint can be used server-side:

```text
GET https://app.omegaedi.com/api/2.0/Companies
```

The endpoint supports filters including `q`, `type`, `active_only`, `publicly_visible`, `location_id`, and `id`.

Before shipping a dynamic insurer list, inspect actual returned company data and establish the correct filtering criteria for insurance/account companies. Do not assume an undocumented `type` string.

The result stored in quote state must at minimum include the insurer's display name and Omega `account_company_id`.

---

# Insurance Quote Request

A confirmed Omega insurance request uses the same endpoint:

```text
GET /api/2.0/Quotes/{vehicle_id}/{position}
```

with vehicle/contact values plus insurance fields including:

```text
account_company_id
account_policy_no
account_deductible
account_auth_no
billing_account_id
```

Confirmed attribution difference:

```text
campaign=Ins Web Quote
```

Do **not** send `campaign=WEB QUOTE` for insurance quotes.

Known relevant insurance request shape:

```text
year={year}
make={make_id}
model={model_id}
vehicle_id={vehicle_id}
position={position}

customer_zip={zip}
customer_fname={first_name}
customer_surname={last_name}
customer_phone={phone}
customer_email={email}
customer_sms={0|1}                # include when available/appropriate

account_company_id={company_id}
account_policy_no={policy_number}
account_deductible={deductible}
account_auth_no={authorization_number}
billing_account_id={billing_account_id}

folder=pag
campaign=Ins Web Quote
smart=true
```

`account_auth_no` and `billing_account_id` may legitimately be empty when the current form/business workflow does not have them.

## Insurance pricing profiles

Observed Quotes URLs do not include `pricing_profile_id`.

The intended behavior is therefore to let Omega determine the applicable pricing profile from its own account/insurance configuration, including `account_company_id`, rather than calculating or choosing the pricing profile locally.

After generating test insurance quotes, verify the returned invoice's `pricing_profile_id` against expected Omega behavior.

If insurance requests always produce the cash/default profile despite correct insurance data, stop and investigate before shipping insurance quote pricing.

---

# Phase 5 — Generate the Quote

When the user submits the completed existing form, the browser should send normalized quote input to the application's server-side quote endpoint, conceptually:

```text
POST /api/quotes
```

The application request should contain domain data rather than an Omega URL, for example:

```text
customer
normalized vehicle
selected glass position
insurance details or cash flag
SMS consent
attribution fields if intentionally supported
```

The server should then:

1. validate that the quote-ready vehicle and required customer data exist,
2. choose the cash or insurance Omega request shape,
3. map application values to Omega IDs/codes,
4. construct the `Quotes/{vehicle_id}/{position}` URL,
5. call Omega server-side,
6. require a successful HTTP response,
7. treat the returned body as HTML,
8. extract the Omega invoice ID,
9. fetch the completed invoice through the documented Invoice API,
10. normalize that invoice into the application's quote-result model,
11. return the normalized result to the existing UI.

Do not navigate the customer to Omega's URL and do not render Omega's HTML.

---

# GUID Handling

Do not create a dependency on a caller-generated GUID.

Testing showed that supplying a foreign/custom `guid` in the Quotes URL does not cause that value to become the final invoice's own GUID. Omega manages its own invoice identity/deduplication behavior.

If testing shows that the undocumented route requires a `guid` parameter for compatibility, it may be sent as a non-authoritative compatibility value, but:

- do not use it to locate the invoice,
- do not use it as the application's quote ID,
- and do not build local deduplication semantics around Omega's GUID behavior.

The authoritative Omega identifier for the integration is the invoice ID extracted from the returned quote HTML.

---

# Phase 6 — Parse the Quotes HTML for Invoice ID

The `Quotes` endpoint returns HTML rather than JSON.

Known rendered output contains:

```html
<p>Precision Auto Glass Quote #120241</p>
```

The integration should parse the response only far enough to recover the Omega invoice ID.

A tolerant fallback pattern is conceptually:

```text
Precision Auto Glass Quote\s*#(\d+)
```

Prefer a more stable machine-readable marker if inspection of the returned HTML reveals one, such as:

```text
hidden input
link containing the invoice ID
data attribute
form field
```

Do not rely on the exact `<p>` nesting if a more stable identifier exists.

If no invoice ID can be recovered:

- treat the quote generation as failed,
- log sanitized diagnostic context,
- do not show raw Omega HTML to the customer,
- and use the application's normal error UX.

---

# Why We Should Fetch the Invoice Instead of Parsing the Price from HTML

**Parse only the invoice ID from HTML, then fetch the invoice JSON.**

Do not make the HTML quote page the application's source of truth for the displayed price.

Reasons:

1. **Structured contract:** the documented Invoice endpoint returns JSON fields instead of presentation markup.
2. **Tax correctness:** the finished invoice contains Omega's tax result as well as the quote total.
3. **Line-item visibility:** the invoice exposes the actual glass, labor, adhesive, ADAS/calibration, and other items Omega selected.
4. **Pricing-profile verification:** insurance testing requires seeing which `pricing_profile_id` Omega applied.
5. **Location verification:** the invoice reveals the Omega location selected by ZIP-based behavior.
6. **Future workflow:** the invoice ID is the durable Omega record needed for scheduling, follow-up, job management, and troubleshooting.
7. **Less brittle parsing:** if Omega changes wording, currency formatting, or HTML layout, only the invoice-ID extraction needs to survive rather than every quote field parser.
8. **Better validation:** the app can reject malformed results such as a zero-total or missing-item invoice even if the HTML looked superficially successful.

The additional authenticated GET request is a worthwhile tradeoff for correctness and maintainability.

The HTML price may be logged/compared during development as a diagnostic consistency check, but it should not be the authoritative production result.

---

# Phase 7 — Fetch the Finished Invoice

After recovering the invoice ID, call Omega's documented API server-side:

```text
GET https://app.omegaedi.com/api/2.0/Invoices/{invoice_id}
api_key: <OMEGA_API_KEY>
```

Use this structured invoice as the authoritative quote result.

Relevant data includes:

```text
invoice ID / quote number
invoice_total
invoice_tax
invoice amount/balance fields
Items
selected pricing_profile_id
location_id
vehicle information
VIN if present
insurance/account information
TaxDetails
ADAS/calibration items when Omega adds them
```

Do not send the entire raw Omega invoice object to the browser unless the existing application architecture has a compelling reason to do so.

Normalize it into an application-owned quote result containing only what the current UI and downstream workflow need.

Conceptually:

```json
{
  "invoiceId": "120241",
  "subtotal": 379.27,
  "tax": 27.5,
  "total": 406.77,
  "items": [
    {
      "sku": "DW01949GTYN",
      "description": "Windshield (Acoustic Interlayer, Solar)",
      "price": 264.27
    },
    {
      "sku": "SRI00600",
      "description": "Remove And Install",
      "price": 90.0
    },
    {
      "sku": "HAH000448",
      "description": "Adhesive",
      "price": 25.0
    }
  ]
}
```

The exact DTO and subtotal derivation should be based on the actual invoice fields already observed in the project's test data and should align with the existing app's domain model. Do not duplicate Omega's pricing calculations locally merely to recreate a subtotal.

---

# Phase 8 — Display the Result

Once `/api/quotes` returns the normalized quote result, use the existing result UI.

The customer should never need to see:

- Omega's iframe,
- Omega's HTML quote page,
- raw Omega API JSON,
- Omega API credentials,
- internal endpoint URLs.

The displayed monetary result should come from the fetched invoice, not a locally computed price.

Preserve the Omega invoice ID in application state/data so later steps can reference the same Omega record rather than creating another quote.

---

# Request/State Normalization

The UI's multiple branches should converge on one quote-ready internal model before final submission.

Conceptually, that normalized state should answer:

```text
Who is the customer?
What ZIP/location context did they provide?
Did they consent to SMS?
What exact NAGS/Omega vehicle did we resolve?
What glass position is damaged?
Was a VIN supplied?
Was a plate supplied?
Is this insurance or cash?
If insurance, what Omega account_company_id and policy/deductible data apply?
```

This normalization is important because the final quote service should not need to understand which visual path the user took through the form.

---

# Error and Loading Behavior

The visual handling should match the current app, but the integration must distinguish failures internally.

Vehicle-lookup failure classes include:

```text
Omega NAGS request unavailable/non-200
unsupported year
no makes/models returned
no final vehicle_id resolved
ambiguous body/trim not selected
VIN not matched
plate lookup unavailable/unresolved
```

Quote-generation failure classes include:

```text
missing normalized customer/vehicle data
Quotes endpoint unavailable/non-200
unexpected HTML
invoice ID not present in HTML
Invoice GET fails
invoice exists but contains invalid/missing monetary result
insurance company data rejected
Omega returned an unquotable vehicle/opening combination
```

Because the Quotes endpoint may create the Omega invoice before a later parsing or Invoice GET failure occurs, record the invoice ID immediately whenever it can be extracted.

Do not automatically repeat the state-changing Quotes request just because the follow-up Invoice GET failed. Retry the safe Invoice GET first.

---

# Server-Side Security and Logging

Keep all authenticated Omega calls server-side.

Do not expose or log unnecessarily:

```text
Omega API key
full VIN
full phone/email
insurance policy number
raw Quotes URL containing customer data
raw returned HTML
full invoice JSON
```

Use sanitized diagnostic metadata such as:

```text
internal correlation/request ID
vehicle_id
position/opening
cash vs insurance
Omega invoice ID when known
HTTP status
integration stage that failed
```

The undocumented Quotes endpoint accepts customer information in its query string because that is how Omega's existing Web Quoter operates. Keep this request server-to-server so those URLs do not enter the customer's browser history or normal client-side telemetry.

---

# What Not to Build

Do not build a local pricing engine for the initial implementation.

Previous investigation showed Omega pricing profiles can contain many rule families, including:

```text
Discount
Each
Flat
vendor-specific flat markup
vendor-specific percentage markup
tiered Mygrant markup
PGW/Pilkington/IGC variants
inventory/vendor-priority variants
```

The SKU-rule endpoint identifies which rule applies, but reproducing the full pricing engine would also require vendor cost data such as Mygrant pricing.

The discovered Quotes endpoint avoids that problem and keeps Omega responsible for final pricing.

Likewise, do not manually select a NAGS windshield part for the standard quote unless future product requirements explicitly need part-choice UX. The Quotes route has already demonstrated that Omega can select the standard/default part from the resolved vehicle and damaged-glass position.

---

# Implementation Validation Checklist

These tests should be performed as the integration is wired.

## Manual vehicle flow

Confirm at least:

1. Years populate from `/NagsVehicles/search`.
2. Selecting a year populates makes from `/search/{year}`.
3. Selecting a make populates models from `/search/{year}/{make_id}`.
4. Modifier data is retained where returned.
5. Selecting a model resolves one or more final body styles through `/search/{year}/{make_id}/{model_id}`.
6. A final `vehicle_id` is stored.
7. The known 2017 Ford Fusion test resolves to vehicle `66687` for the expected body style.

## VIN flow

Confirm:

1. a valid VIN resolves through `/NagsVehicles/{VIN}`,
2. the result can be normalized to `vehicle_id`, year, `make_id`, and `model_id`,
3. the final Quotes request succeeds with `vehicle_vin` included,
4. an invalid/unmatched VIN follows the existing error/fallback UX.

## License plate flow

Determine the actual Omega lookup path before marking it complete. Confirm that a successful lookup ultimately provides the same normalized vehicle identifiers.

## Cash quote

Confirm:

```text
campaign=WEB QUOTE
medium=web_quote
folder=pag
```

and verify that:

- Omega creates the expected LE/web-quote invoice,
- the HTML response contains its invoice ID,
- the follow-up Invoice GET succeeds,
- the returned total matches Omega's Web Quoter.

## Insurance quote

Confirm:

```text
account_company_id
account_policy_no
account_deductible
campaign=Ins Web Quote
```

and verify the fetched invoice's:

```text
account_company_id
pricing_profile_id
subtotal/total
```

against the normal Omega insurance Web Quoter.

## Glass positions

After windshield is working, test at minimum:

```text
front/rear door glass
back glass
quarter or vent glass where applicable
```

Confirm path position, `position`, and `opening` behavior before generalizing all glass types.

## Location / tax

For now, treat Omega as authoritative. Test multiple ZIP codes later and compare resulting:

```text
location_id
TaxDetails
invoice_tax
invoice_total
```

Do not duplicate Omega's location/tax calculation unless a real mismatch is found.

---

# Initial Definition of Done

The integration is complete for the supported initial paths when:

1. The existing visual form's Year selector is populated from Omega.
2. Make and Model selectors cascade correctly using Omega/NAGS IDs.
3. Body/trim ambiguity is resolved and a final Omega `vehicle_id` is stored.
4. VIN-first identification can resolve to the same normalized vehicle representation.
5. The damaged-glass selection maps to an Omega position code.
6. Customer/contact fields feed the quote request.
7. SMS consent is wired to `customer_sms`; if the control does not exist, it is added consistently with the current UI.
8. Cash/non-insurance submissions call Omega Quotes with `campaign=WEB QUOTE`.
9. Insurance submissions include Omega insurance account fields and `campaign=Ins Web Quote`.
10. The Quotes request runs only from the server.
11. The returned HTML is not displayed.
12. The server extracts the Omega invoice ID from the HTML.
13. The server fetches the resulting invoice through `GET /Invoices/{invoice_id}` using the API key.
14. The server returns a normalized quote object to the existing UI.
15. The existing result UI displays Omega's authoritative calculated price.
16. The Omega invoice ID is retained for later workflow steps.
17. No local pricing-profile engine or manual NAGS quote calculation is required.
18. Integration failures follow the existing application's error UX and are logged without unnecessary customer data.

---

# Known Open Questions That Should Not Be Hidden

The following are genuinely unresolved and should be tested rather than guessed:

1. **License plate lookup:** the public docs do not currently reveal the plate-to-vehicle lookup used by the existing visual plate path.
2. **VIN normalization details:** verify exactly which IDs are present in the VIN-based NAGS response and fill any missing IDs through the standard search endpoints.
3. **Insurance profile selection:** verify that `account_company_id` causes Omega to select the expected insurer pricing profile.
4. **Non-windshield `opening` semantics:** determine whether `opening` is required in addition to the path/`position` value.
5. **Most stable invoice-ID marker:** inspect several Quotes HTML responses and prefer a structured marker over visible text if one exists.
6. **Dynamic insurer filtering:** if insurers are loaded from `/Companies`, establish the real company-type/public-visibility filters from live Omega data before shipping.

These questions should be resolved incrementally while preserving the architecture above; none justify reimplementing Omega's pricing engine.
