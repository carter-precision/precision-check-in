# Omega EDI Quote Integration — Design Specification

## Purpose

Integrate the existing custom quote UI with Omega EDI so that the application can collect customer, vehicle, glass, and insurance information using the app's own interface, ask Omega to generate the actual quote, and then display the resulting price in the app's existing result UI.

This specification describes **what the integration must do and why**, not how the existing UI should be rebuilt. Codex should first review the current codebase and adapt this behavior to the existing architecture, components, data flow, validation patterns, and styling.

The primary goal is to let **Omega remain the source of truth for part selection, pricing-profile logic, taxes, and invoice creation** rather than reimplementing Omega's quote engine locally.

---

## Key Findings About Omega

### 1. The documented Invoice API is not sufficient to calculate quotes by itself

Testing confirmed that `POST /Invoices` and `PUT /Invoices/{invoice_id}` can create invoices and line items, but sending NAGS parts through `Items` does **not** cause Omega to:

- select default parts,
- apply pricing profiles,
- resolve NAGS list/extended pricing,
- calculate the final windshield sell price,
- or run the same pricing process as Omega's Web Quoter.

Even sending the full `Items` array returned by `NagsQuotes` caused Omega to treat those objects as already-finalized invoice items. It added every candidate item and calculated the invoice total directly from the supplied prices.

Therefore, the application should **not attempt to generate quotes by POSTing NAGS data into the Invoice endpoint**.

### 2. The undocumented Quotes endpoint runs the actual Web Quoter logic

Omega's own Web Quoter calls an endpoint with this general form:

```text
GET https://app.omegaedi.com/api/2.0/Quotes/{vehicle_id}/{position}?...
```

Example:

```text
https://app.omegaedi.com/api/2.0/Quotes/66687/W?year=2017&make=13&model=4543&vehicle_id=66687&position=W&customer_zip=84404&customer_fname=TEST&customer_phone=999-999-9999&customer_email=test%40example.com&folder=pag&medium=web_quote&campaign=WEB+QUOTE&smart=true&customer_sms=0
```

Testing confirmed that this endpoint:

- works without an authenticated Omega employee session,
- creates or resolves the Web Quote invoice,
- selects the applicable/default NAGS glass part,
- selects the related default labor/adhesive items,
- applies Omega's pricing logic,
- applies the appropriate pricing profile,
- calculates tax,
- creates the resulting invoice/lead in Omega,
- and returns an HTML quote page.

This is the endpoint the custom app should use to ask Omega to generate the quote.

### 3. The Quotes endpoint returns HTML, not structured JSON

The response is HTML and visibly includes the Omega invoice/quote number in markup such as:

```html
<p>Precision Auto Glass Quote #120241</p>
```

The custom application should **not display or embed this HTML**.

Instead, the backend integration should:

1. call the Quotes endpoint,
2. extract the invoice ID from the returned HTML,
3. call the documented Omega Invoice GET endpoint for that invoice,
4. use the returned structured invoice JSON as the application's authoritative quote result.

This keeps the brittle HTML dependency limited to extracting one identifier.

### 4. The Quotes endpoint should be called from the server

The Omega quote request should not be performed directly from the browser.

Use the application's server-side integration boundary. In a Next.js App Router project, a dedicated Route Handler such as:

```text
POST /api/quotes
```

is preferred over coupling the Omega workflow directly to a React Server Action.

The route should delegate Omega-specific work to a separate service/module so that:

- the UI does not know about Omega's undocumented endpoint,
- the HTML parsing logic is isolated,
- the integration can be tested independently,
- logging and failure handling are centralized,
- and the integration can be replaced later if Omega changes the endpoint.

Codex may choose file/module names that fit the existing architecture.

---

# Desired End-to-End Behavior

## High-level flow

```text
Existing custom quote UI
        ↓
Collect customer + vehicle + glass + optional insurance data
        ↓
User submits quote request
        ↓
Application server calls Omega Quotes endpoint
        ↓
Omega creates/prices invoice
        ↓
Server parses invoice ID from returned HTML
        ↓
Server GETs that invoice through Omega's documented API
        ↓
Server normalizes the invoice into application quote data
        ↓
Existing UI displays the quote
```

The Omega invoice should be created **when the user submits the request to receive their quote**. There is no need for a separate preliminary Invoice API call unless future testing discovers a concrete reason to do so.

---

# Vehicle Data Acquisition

The existing UI already supports multiple paths for identifying a vehicle:

- VIN
- year / make / model / body or trim where applicable
- license plate

This specification does not redefine that UI flow. Codex should preserve the existing user experience and connect each completed vehicle-identification path to the Omega quote integration.

## Year / Make / Model flow

Omega's NAGS vehicle endpoints can populate the sequential vehicle selectors.

Observed flow:

```text
Year
→ make_id
→ model_id
→ vehicle/body-style result
→ vehicle_id
```

Example data previously confirmed:

```text
2017
Ford → make_id 13
Fusion → model_id 4543
4 Door Sedan → vehicle_id 66687
```

The important final value for quote generation is Omega's/NAGS's `vehicle_id`.

## Body style / trim

Some vehicles may require an additional body-style or trim choice after model selection. The integration should preserve enough Omega/NAGS data to resolve the final `vehicle_id` rather than assuming year/make/model uniquely identify a vehicle.

## VIN

VIN is optional for Omega's standard Web Quoter flow. The app should send it when the customer provides it, but quote generation must not require VIN when year/make/model/body information is sufficient.

The existing application may collect VIN before vehicle selectors or use it as an alternate identification path; that UI behavior does not need to mirror Omega's own intermediate VIN screen.

## License plate

The existing UI also supports license-plate lookup. Its final behavior against Omega still needs validation. The integration should be structured so that license-plate lookup ultimately produces the same normalized vehicle information required by the quote request, especially `vehicle_id` when available.

Do not redesign this workflow as part of the Omega quote integration unless necessary.

---

# Glass / Opening Selection

Omega's Web Quoter passes the damaged glass selection into the Quotes endpoint.

For a windshield:

```text
/Quotes/66687/W
position=W
```

Known Web Quoter position values include:

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

The application's existing glass-selection UI should map its internal values to Omega's codes.

### `position` vs `opening`

Cash Web Quoter requests have been observed with both:

```text
position=W
opening=W
```

An insurance Web Quoter request was observed with `position=W` but without an `opening` parameter.

Therefore:

- the path segment (`/W`) and `position=W` should currently be treated as the important values;
- preserve/send `opening` when appropriate if it matches Omega's existing cash-quoter behavior;
- do not build business logic around `opening` until further testing establishes whether it is required or merely legacy/redundant.

---

# Cash / Non-Insurance Quote Request

For non-insurance quotes, the server should construct a request equivalent to Omega's normal Web Quoter request.

Known relevant values include:

```text
GET /api/2.0/Quotes/{vehicle_id}/{position}
```

with query data equivalent to:

```text
year
make
model
vehicle_id
position
opening             when applicable
customer_zip
customer_fname
customer_surname    if available
customer_phone
customer_email
vehicle_vin         if available
folder=pag
medium=web_quote
campaign=WEB QUOTE
smart=true
customer_sms
```

Other existing Omega Web Quoter fields may be forwarded when they already exist in application state, but the implementation should avoid inventing unnecessary parameters.

### Campaign must be retained

Cash/non-insurance quote requests should retain:

```text
campaign=WEB QUOTE
```

because Omega's existing automation/reporting may depend on it.

---

# Insurance Quote Request

The existing UI branches between insurance and non-insurance within the same custom form. Preserve that behavior.

Omega's insurance Web Quoter uses the same Quotes endpoint but includes insurance-specific data.

A confirmed insurance request includes fields equivalent to:

```text
GET /api/2.0/Quotes/{vehicle_id}/{position}
```

with:

```text
year
make
model
vehicle_id
position
customer_zip
customer_fname
customer_surname
customer_phone
customer_email

account_company_id
account_policy_no
account_deductible
account_auth_no
billing_account_id

folder=pag
campaign=Ins Web Quote
smart=true
```

`template_id` was present in Omega's own URL but is not required for this integration unless testing later proves otherwise.

### Insurance company mapping

The custom UI's selected insurer must ultimately resolve to Omega's `account_company_id`.

Do not hard-code insurer names directly into quote-generation logic if the existing application already has or can use a normalized insurer/account mapping.

### Insurance pricing profiles

The Quotes endpoint does **not** expose a `pricing_profile_id` query parameter in the observed Web Quoter requests.

The working assumption is that Omega determines the correct pricing profile internally from the insurance/account context, especially `account_company_id`, while non-insurance quotes fall back to the account's default cash pricing profile.

This is desirable because it keeps Omega responsible for insurer-specific pricing rules.

The implementation should **not locally calculate or apply pricing-profile rules**.

After an insurance quote is generated, the retrieved Invoice JSON should be inspected to confirm the resulting `pricing_profile_id` is appropriate. This should be part of integration validation/testing rather than UI logic.

### Insurance campaign must be retained

Insurance quote requests should use Omega's existing campaign value:

```text
campaign=Ins Web Quote
```

Do not reuse `WEB QUOTE` for insurance requests.

---

# SMS Consent

The Omega request supports:

```text
customer_sms
```

If the existing UI already includes an SMS-consent checkbox, wire its value into `customer_sms`.

If no SMS-consent control exists, add one in a way that matches the current application's UI and form conventions, then wire it to this field.

Do not silently assume consent.

---

# GUID Handling

Do **not** generate or depend on a caller-controlled GUID for the initial implementation.

Testing showed that supplying a foreign/custom `guid` does not result in that GUID becoming the created invoice's GUID. Omega creates/manages its own invoice GUID.

The Quotes endpoint also performs some duplicate handling itself. The custom application does not need to reproduce Omega's internal deduplication logic at this stage.

If the existing Web Quoter-compatible request shape requires a `guid` field, treat it only as a compatibility parameter and do not use it as the application's authoritative invoice identifier.

The authoritative identifier for the integration is the **invoice ID parsed from the Quotes HTML response**.

---

# Parsing the Quotes Response

The Quotes endpoint returns HTML.

The integration must extract the Omega invoice ID from the response before continuing.

Known rendered format:

```html
<p>Precision Auto Glass Quote #120241</p>
```

The parsing implementation should be tolerant of minor markup/spacing changes.

A regex equivalent to the following is acceptable as a fallback:

```text
Precision Auto Glass Quote\s*#(\d+)
```

However, if the HTML contains a more stable structured identifier such as a hidden input, data attribute, or link containing the invoice ID, prefer that over matching visible copy.

If no invoice ID can be located:

- treat the quote request as failed,
- log enough sanitized diagnostic information for troubleshooting,
- do not show Omega's raw HTML to the customer.

---

# Retrieving the Final Structured Quote

Once the invoice ID is known, fetch the invoice through Omega's documented Invoice API.

Conceptually:

```text
GET /api/2.0/Invoices/{invoice_id}
```

The returned invoice should be considered the authoritative result for the custom UI.

Relevant output includes:

- invoice ID / quote number,
- selected NAGS part(s),
- descriptions,
- line-item extended prices,
- subtotal,
- tax,
- final invoice total,
- selected pricing profile,
- vehicle information,
- account/insurance information,
- ADAS-related items when Omega adds them,
- location information.

The server should transform this large Omega response into a small application-specific quote result rather than sending the raw Omega invoice object directly to the client unless the current architecture has a clear reason to retain it.

Example conceptual shape:

```json
{
  "invoiceId": "120241",
  "subtotal": 379.27,
  "tax": 27.50,
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
      "price": 90.00
    },
    {
      "sku": "HAH000448",
      "description": "Adhesive",
      "price": 25.00
    }
  ]
}
```

The exact application DTO should align with the existing codebase rather than this illustrative example.

---

# What Not to Implement

Do **not** implement a local replacement for Omega's pricing engine.

Previous investigation confirmed that Omega pricing profiles can contain rule types such as:

- Discount
- Each
- Flat
- vendor-specific flat markup
- vendor-specific percentage markup
- tiered Mygrant markup
- PGW/Pilkington/IGC variants
- inventory/vendor-priority variants

The API can return the matching rule for a SKU, but reproducing the pricing engine would require implementing and maintaining all of this logic plus vendor-cost dependencies such as Mygrant pricing.

The Quotes endpoint exists specifically to avoid this problem by letting Omega produce the actual invoice pricing.

Likewise, `NagsQuotes` should not currently be used as the primary pricing mechanism. It remains useful for diagnostics or future features, but sending its returned `Items` to `POST /Invoices` does not invoke Omega's pricing engine.

---

# Server/API Boundary

The existing UI should communicate with a clean internal quote API rather than knowing about Omega URLs.

Conceptually:

```text
POST /api/quotes
```

Input should represent the information the application already collected, for example:

```text
customer
vehicle
opening/position
insurance (optional)
SMS consent
marketing/source metadata if relevant
```

The route/service should be responsible for:

1. validating that enough normalized information exists to request a quote,
2. mapping application values to Omega IDs/codes,
3. constructing the appropriate cash or insurance Quotes request,
4. calling Omega server-side,
5. validating the HTTP response,
6. extracting the invoice ID from HTML,
7. fetching the resulting invoice through the documented API,
8. validating that a usable nonzero quote was returned,
9. normalizing the Omega invoice into the application's quote-result model,
10. returning that result to the existing UI.

Keep Omega-specific implementation details out of UI components.

---

# Failure Handling

The integration must fail cleanly because it depends on an undocumented Omega endpoint and HTML response format.

Distinguish at least these failure classes internally:

- insufficient vehicle/customer information before requesting a quote,
- Omega Quotes endpoint unavailable/non-200,
- unexpected HTML response,
- invoice ID not found in response,
- invoice GET fails after quote creation,
- resulting invoice exists but total/items are missing or invalid,
- vehicle/opening combination cannot be quoted,
- insurance/account data rejected by Omega.

The customer-facing UI should follow the application's existing error patterns and should not expose raw Omega errors, HTML, API credentials, stack traces, or internal URLs.

Because the Quotes endpoint may have already created an invoice before a later parsing/fetch step fails, log the invoice ID whenever it can be recovered.

---

# Logging and Security

All Omega requests should originate server-side.

Do not expose:

- Omega API credentials,
- internal authorization headers,
- full raw Omega Invoice objects unless needed,
- raw quote HTML,
- unnecessary personal information in application logs.

The Quotes endpoint itself necessarily accepts customer information in query parameters because that is how Omega's existing Web Quoter works. Keep that interaction between the application server and Omega rather than navigating the customer's browser to the Omega URL.

Log enough sanitized metadata to correlate failures, especially:

- internal request/correlation ID,
- Omega invoice ID when known,
- vehicle ID,
- opening/position,
- cash vs insurance flow,
- HTTP status,
- parsing/fetch stage that failed.

Avoid logging full VIN, phone, email, policy number, or the complete query URL in normal production logs.

---

# Known Omega/NAGS Behavior

## NAGS vehicle data

Omega's NAGS vehicle endpoints provide the vehicle-selection data needed to resolve `vehicle_id`.

The application should continue using those APIs rather than maintaining a separate local vehicle database unless the existing architecture already introduces caching for performance.

## NAGS Quote endpoint

`NagsQuotes/{vehicle_id}/{nags_part_number}` returns rich NAGS information including candidate/default child parts and list-price-related data.

However, it does not itself return the final Omega Web Quote price and does not replace the Quotes endpoint.

## Pricing profiles

Omega exposes pricing profiles and SKU-specific pricing rules, but those are informational for this integration. The application should not apply the rules locally if the Quotes endpoint remains available.

The generated Invoice response should be used to confirm which pricing profile Omega ultimately chose.

---

# Assumptions for Initial Integration

For the first working implementation, assume:

- Omega's `Quotes/{vehicle_id}/{position}` endpoint remains accessible from the application's server.
- `folder=pag` remains the correct Omega Web Quoter folder for this business.
- ZIP-based Omega behavior is responsible for selecting the correct location; location routing does not need to be recreated locally unless testing proves otherwise.
- Omega handles quote deduplication sufficiently for the initial integration.
- Omega's own automation side effects are acceptable for now and should not be recreated locally.
- The Quotes HTML continues to contain a recoverable invoice ID.
- Insurance quotes should pass Omega's insurance account fields and `Ins Web Quote` campaign rather than attempting local pricing-profile selection.
- Cash/non-insurance quotes should use the `WEB QUOTE` campaign.

---

# Open Questions / Validation Tasks

These should be tested during implementation, but they should not block establishing the core integration architecture.

## 1. VIN path

Confirm that Quotes requests generated from the application's VIN-first flow resolve the same vehicle and price correctly.

## 2. License-plate path

Confirm what Omega inputs are needed after a successful license-plate lookup and ensure the result can be normalized to the same quote request shape.

## 3. Insurance pricing profile

Generate test quotes for one or more insurers and inspect the resulting Invoice JSON to confirm that Omega selects the expected `pricing_profile_id` from `account_company_id`/insurance context.

If Omega always falls back to profile 1 despite insurance data, stop and investigate before shipping insurance quote pricing.

## 4. Non-windshield openings

Test at least:

- one front/rear door glass,
- one quarter/vent glass if supported,
- back glass.

Confirm which Omega position codes are required and whether `opening` needs to be sent.

## 5. HTML invoice-ID parsing

Inspect several successful responses to find the most stable invoice-ID marker available in the HTML.

## 6. SMS consent

Confirm whether the existing UI already has an SMS checkbox. If present, wire it to `customer_sms`; otherwise add it consistent with the existing form.

## 7. Tax/location

For now rely on Omega. Later validate several ZIP codes against resulting `location_id`, `TaxDetails`, and totals. Only add local routing/tax logic if Omega's output proves incorrect.

---

# Definition of Done

The integration is complete for the initial supported flows when:

1. A user can complete the existing custom quote UI without seeing Omega's iframe or HTML.
2. The app resolves sufficient vehicle information to obtain an Omega `vehicle_id`.
3. Submission calls the application's server-side quote integration.
4. The server calls Omega's Quotes endpoint with the correct cash or insurance parameters.
5. Omega creates a priced invoice.
6. The server extracts the invoice ID from the HTML response.
7. The server retrieves the structured invoice from Omega.
8. The app displays the Omega-calculated quote using its existing result UI.
9. Cash quotes retain `campaign=WEB QUOTE`.
10. Insurance quotes retain `campaign=Ins Web Quote` and send the applicable insurance fields.
11. SMS consent is passed through `customer_sms`.
12. Omega-specific HTML, endpoint quirks, and credentials remain isolated from the client UI.
13. No local reimplementation of Omega's pricing-profile engine is required.
14. Failures are logged safely and presented through the application's existing error UX.

---

# Implementation Principle

Treat Omega as an external quote engine:

```text
The app owns the customer experience.
Omega owns vehicle/NAGS data, part selection, pricing, tax, and invoice creation.
The integration layer translates between the two.
```

The purpose of this work is not to reproduce Omega's Web Quoter internally. It is to use the minimum necessary Omega behavior behind the application's existing UI so the customer receives the same authoritative quote without interacting with Omega's iframe or rendered quote pages.
