# Omega Kiosk Quote Integration — Implementation Roadmap

## Purpose

Implement Omega-backed quote generation for the current kiosk application at `app/kiosk/[location]` and `components/kiosk`.

This roadmap turns the functional design in `docs/omega-quote-integration-design-spec.md` into independently reviewable build phases. Complete and review each phase before beginning the next phase.

## Scope Guardrails

### In scope

- The current kiosk UI under `app/kiosk/[location]` and `components/kiosk`.
- New Route Handlers used only by the kiosk quote flow.
- New server-only Omega modules dedicated to vehicle lookup, insurance-company lookup, quote generation, and quote HTML parsing.
- Existing shared kiosk types and components when changes are required by the quote flow.

### Explicitly out of scope

- `app/check-in` and the customer check-in page sent to customers' phones.
- Existing appointment lookup and appointment verification behavior.
- The existing appointment-focused `lib/omega/client.ts` contract unless a safe shared primitive can be extracted without changing its behavior. Prefer separate quote-specific modules.
- `scripts/mock-omega.mjs` and its appointment scenarios.
- All files under `app/kiosk-X`.
- Rock-chip quote functionality.
- License-plate lookup or license-plate UI.
- A local pricing engine.
- Omega `include_recal`, `template_id`, or unused/blank Web Quoter parameters.

Do not modify out-of-scope files merely to reuse code. New quote-specific files are preferable to coupling the quote integration to appointment check-in behavior.

## Confirmed Product and Integration Decisions

1. Use Next.js Route Handlers for browser-driven lookup and quote requests.
2. Customers remain anonymous. The existing registered-device cookie authenticates the kiosk terminal, not the individual customer.
3. Every quote-related Route Handler must verify that the request comes from a valid kiosk device. When a location slug is supplied, it must match the registered device's location. Development authentication bypass behavior may remain consistent with the existing kiosk page.
4. The quote flow order is:

   ```text
   Vehicle identification
   → damaged glass
   → service location
   → contact details, ZIP, SMS consent, and cash/insurance choice
   → quote submission
   → quote result
   ```

5. Do not ask whether the quote is cash or insurance before vehicle identification. Put that choice on the final contact step and reveal insurance fields dynamically.
6. A valid resolved vehicle is required for both cash and insurance quotes.
7. Contact data uses one required first-name field, one required phone field, an optional email field, and one required five-digit ZIP field. Do not collect or send a surname.
8. Policy-holder name and phone are the same as the customer's first name and phone. Do not collect duplicate policy-holder contact fields.
9. SMS consent must be an explicit checkbox, unchecked by default, and must map to `customer_sms=0|1`.
10. Insurance company, policy number, and deductible are required when insurance is selected.
11. Insurance companies come from:

    ```text
    GET https://app.omegaedi.com/api/2.0/Companies
      ?type=insurance
      &active_only=true
      &publicly_visible=1
      &folder=pag
    api_key: <OMEGA_API_KEY>
    ```

    Normalize records such as `{ "id": 42, "company": "Allstate" }` into application-owned dropdown options. Submit the selected `id` as `account_company_id`; never derive the ID from display text.

12. Cash quotes use `campaign=WEB QUOTE`.
13. Insurance quotes use `campaign=Ins Web Quote`.
14. Keep `folder=pag`, `smart=true`, and cash `medium=web_quote`. Omit legacy, blank, or unused parameters unless live validation establishes that one is required.
15. For cash quotes, the final Omega Quotes HTML is the source of truth for the quote number and displayed total.

## Post-implementation product adjustment — 2026-08-10

The following decisions supersede conflicting insurance-specific requirements
later in this roadmap:

- Insurance policy number remains required and is submitted as
  `account_policy_no`.
- Insurance deductible is optional. Submit `account_deductible` only when the
  customer provides a valid non-negative amount.
- A successful insurance Quotes response completes the kiosk submission. Do
  not require an invoice ID or fetch the invoice for the insurance path.
- Show a dedicated insurance acknowledgement explaining that the team will
  handle the claim and the customer is responsible for their deductible.
- Cash quotes require quote-number and total extraction from the final Quotes HTML.

## Cash two-stage Quotes adjustment — 2026-08-11

The following observed Omega behavior supersedes conflicting cash-specific
requirements later in this roadmap:

- Do not call `POST /Invoices` for kiosk cash quotes. Omega's Quotes workflow
  creates the invoice itself.
- The initial cash Quotes request is a bootstrap request. Send the validated
  vehicle/customer fields with `campaign=WEB QUOTE`, `lead_type=web_lead`, and
  `smart=true`; do not send VIN, opening, or medium on this first call.
- Accept either a final quote response or exactly one HTML meta-refresh to
  `/quoter/vin.php` on `https://app.omegaedi.com` containing one valid
  Omega-generated GUID. Reject external, malformed, or ambiguous refreshes.
- Do not request or render the intermediate VIN page. Rebuild a second Quotes
  request from validated application input and the extracted GUID.
- The completion request includes `opening`, `medium=web_quote`, the supplied
  VIN or an explicit blank VIN, blank plate fields, the GUID, and a trailing
  blank `smart` value while preserving the initial `smart=true` value. This
  mirrors Omega's observed form request.
- Parse the final Quotes HTML for both the invoice ID and the total displayed in
  Omega's `price` element. Reject the response when either value is absent or
  invalid.
- Preserve direct-final-response support in case Omega skips the bootstrap page.
- Keep the insurance acknowledgement behavior from the 2026-08-10 adjustment
  unchanged.

## Cash result simplification — 2026-08-11

The following product decision supersedes conflicting result, Invoice GET, and
recovery requirements later in this roadmap:

- Do not fetch the created invoice after a successful cash Quotes response.
- Return only `{ invoiceId, total }` to the browser. Do not return tax,
  subtotal, line items, location, pricing-profile, raw HTML, or raw invoice data.
- Display `QUOTE #{invoiceId}`, the total, a brief standard-parts estimate
  explanation, and concise fine print above Finish.
- Do not implement an Invoice GET recovery request. A final Quotes response
  without both a valid quote number and positive total fails closed.

## Target Server Boundary

Use application-owned endpoints equivalent to the following. Exact file names may follow App Router conventions, but keep these responsibilities separate and typed.

```text
GET  /api/kiosk/omega/vehicles/years
GET  /api/kiosk/omega/vehicles/makes?year=...
GET  /api/kiosk/omega/vehicles/models?year=...&makeId=...
GET  /api/kiosk/omega/vehicles/variants?year=...&makeId=...&modelId=...&modifierId=...
GET  /api/kiosk/omega/vehicles/vin?vin=...
GET  /api/kiosk/omega/insurance-companies
POST /api/kiosk/omega/quotes
```

Each request must also provide or otherwise resolve the current kiosk location so the handler can enforce that it matches the registered device.

Server modules should isolate these responsibilities:

- Authenticated Omega JSON requests for NAGS and Companies.
- The server-to-server Quotes HTML request.
- Zod validation of application input and relevant Omega responses.
- Omega position and query-parameter mapping.
- Quote-number and total extraction from Quotes HTML.
- Sanitized error classification and logging.

Never expose `OMEGA_API_KEY`, raw Omega URLs containing customer data, or raw Quotes HTML to the browser or logs.

---

# Phase 1 — Quote-Only Server Foundation and Lookup Endpoints

## Goal

Create the protected server boundary and prove that live Omega lookup data can be normalized without changing the kiosk screens.

## Work

1. Add a quote-route kiosk authorization helper that:

   - Reads the existing device cookie.
   - Requires a device registered as type `kiosk`.
   - Rejects a supplied location that does not match the device location.
   - Supports the existing development authentication bypass without weakening production behavior.
   - Returns only trusted device/location context needed by the handlers.

2. Add quote-specific server-only Omega request utilities. Do not change appointment-oriented return types or parsing behavior.

3. Implement and validate the vehicle lookup handlers:

   - Years from `/NagsVehicles/search`.
   - Makes from `/NagsVehicles/search/{year}`.
   - Models and modifiers from `/NagsVehicles/search/{year}/{make_id}`.
   - Final body/trim variants and `vehicle_id` from `/NagsVehicles/search/{year}/{make_id}/{model_id}`, including `modifier_id` when present.
   - VIN resolution from `/NagsVehicles/{VIN}` with `load_options=true` where useful.

4. Implement the insurance-company lookup handler using the confirmed Companies query exactly as listed above.

5. Return minimal application-owned DTOs. Suggested shapes:

   ```ts
   type VehicleYearOption = { year: string }

   type VehicleMakeOption = {
     id: string
     label: string
   }

   type VehicleModelOption = {
     id: string
     label: string
     modifierId: string | null
     modifierLabel: string | null
   }

   type VehicleVariantOption = {
     vehicleId: string
     bodyStyleId: string | null
     label: string
   }

   type InsuranceCompanyOption = {
     id: string
     label: string
   }
   ```

6. Validate all query parameters before calling Omega. Return consistent non-sensitive errors for invalid input, unauthorized devices, unavailable Omega services, empty results, and malformed Omega responses.

## Phase 1 review gate

Do not continue until the reviewer can confirm:

- Requests without a valid kiosk device are rejected in production mode.
- A valid kiosk can load years, makes, models, variants, and insurance companies.
- Model modifier information is preserved.
- The known 2017 Ford Fusion path can resolve the expected final vehicle record, including `vehicle_id=66687` for the correct variant.
- No appointment/check-in code, `kiosk-X`, or local Omega mock code changed.
- Lint and TypeScript checks pass for the new server code.

---

# Phase 2 — Vehicle Identification UI and Normalized Vehicle State

## Goal

Replace free-form/manual placeholder vehicle data with an Omega-backed VIN or cascading manual lookup that always ends in a quote-ready `vehicle_id`.

## Work

1. Introduce a normalized quote vehicle model containing at least:

   ```ts
   type QuoteVehicle = {
     year: string
     makeId: string
     makeLabel: string
     modelId: string
     modelLabel: string
     modifierId: string | null
     modifierLabel: string | null
     vehicleId: string
     variantLabel: string | null
     vin: string | null
   }
   ```

2. Preserve the current VIN-versus-manual choice, but require one path to resolve successfully before Continue is enabled.

3. VIN path:

   - Normalize to uppercase.
   - Require exactly 17 characters.
   - Permit only valid VIN characters: `A-H`, `J-N`, `P`, `R-Z`, and digits; reject `I`, `O`, and `Q`.
   - Resolve the VIN through the kiosk VIN Route Handler.
   - Do not enable Continue until Omega returns a final `vehicle_id` and the required numeric make/model IDs have been normalized.
   - Show the resolved vehicle description for confirmation.
   - Provide a clear error and allow switching to manual selection when the VIN cannot be matched.

4. Manual path:

   - Load Year options from Omega when the step becomes active.
   - After Year, load Make options and store the selected ID and label.
   - After Make, load Model options and retain modifier data.
   - After Model, load final body/trim variants.
   - Automatically choose the result only when exactly one valid variant is returned.
   - Render a final body/trim selector when multiple variants exist.
   - Enable Continue only after a final `vehicle_id` is selected.

5. Reset all dependent selections and outstanding request state whenever an upstream selection changes:

   ```text
   Year change    → reset make, model, modifier, variant, vehicle_id
   Make change    → reset model, modifier, variant, vehicle_id
   Model change   → reset variant and vehicle_id
   VIN/manual swap → clear the inactive path's resolved identifiers
   ```

6. Add loading, empty-result, and retry states consistent with the existing kiosk design. Prevent stale or out-of-order lookup responses from overwriting newer selections.

7. Change both existing quote entry points so they go directly to vehicle identification. Remove the early cash/insurance decision from active quote navigation.

## Phase 2 review gate

Do not continue until the reviewer can confirm:

- Both quote entry points lead first to the same vehicle step.
- A partial or malformed VIN cannot continue.
- A valid VIN produces a normalized quote-ready vehicle.
- Manual dropdowns populate incrementally from Omega.
- Upstream changes correctly reset downstream selections.
- Ambiguous body/trim results require an explicit selection.
- Cash/insurance has not yet been asked.
- No quote is generated in this phase.

---

# Phase 3 — Glass Selection and Simplified Kiosk Flow

## Goal

Align the glass selection with confirmed Omega positions while preserving the existing vehicle diagram and completing the revised step order.

## Work

1. Do not change the vehicle glass diagram's artwork or interactive regions.

2. Update the glass dropdown so its supported choices correspond to the confirmed Omega positions, plus the two explicitly unsupported choices:

   | Application selection      | Omega code      | Quote enabled |
   | -------------------------- | --------------- | ------------- |
   | Windshield                 | `W`             | Yes           |
   | Front driver door glass    | `D_FRONT_LEFT`  | Yes           |
   | Front passenger door glass | `D_FRONT_RIGHT` | Yes           |
   | Rear driver door glass     | `D_REAR_LEFT`   | Yes           |
   | Rear passenger door glass  | `D_REAR_RIGHT`  | Yes           |
   | Quarter glass              | `Q`             | Yes           |
   | Vent glass                 | `V`             | Yes           |
   | Back/rear glass            | `B`             | Yes           |
   | Sunroof/moonroof           | None yet        | No            |
   | Not sure / multiple pieces | None            | No            |

3. Existing driver/passenger quarter regions in the diagram may remain visually distinct, but both normalize to Omega position `Q` for this implementation.

4. Selecting sunroof or “not sure” must leave Continue disabled. Show brief explanatory text that online pricing is not currently available for that selection. Do not invent an Omega position code or fallback submission.

5. Keep the service-location step after glass selection. Continue collecting:

   - Mobile versus in-shop preference.
   - Mobile service address or selected shop.
   - Optional preferred date.

6. Treat these service-preference fields as application/UI data unless a tested Omega Quotes field is deliberately added later. Do not invent query parameters for them.

7. Make the selected shop/location context available to final quote submission. Treat it as application/UI data unless a tested Omega Quotes field is deliberately added later.

## Phase 3 review gate

Do not continue until the reviewer can confirm:

- The diagram is visually unchanged.
- The dropdown contains only the approved choices.
- All supported choices map to the intended Omega code.
- Sunroof and “not sure” cannot proceed.
- The flow is Vehicle → Glass → Service location.
- Existing service-location and preferred-date UI still works.

---

# Phase 4 — Contact, ZIP, SMS, and End-of-Flow Insurance Choice

## Goal

Create one final details step that collects the remaining required quote data and conditionally adds insurance fields.

## Work

1. Refactor the final contact step to collect:

   - First name — required.
   - Phone — required and validated.
   - Email — optional, but validated when present.
   - Five-digit ZIP — required for both cash and insurance.
   - SMS consent — explicit unchecked checkbox.

2. Add an accessible cash/insurance toggle on this same step. Defaulting to no selection is preferred so consent and attribution are explicit.

3. When Cash/self-pay is selected:

   - Hide and clear insurance-only fields.
   - Set application payment mode to cash.

4. When Insurance is selected, load and reveal:

   - Insurance company dropdown — required; store both Omega ID and display label.
   - Policy number — required.
   - Deductible — required, numeric, and non-negative.

5. Remove duplicate policy-holder name and policy-holder phone fields. The final first name and phone are the policy-holder/customer values.

6. Do not collect authorization number or billing account ID. The quote request may omit those fields or send them only if later requirements provide real values.

7. Enable “Get my quote” only when all common fields are valid and, for insurance, all required insurance fields are valid.

8. Build one normalized client submission object that does not depend on which visual path identified the vehicle.

## Phase 4 review gate

Do not continue until the reviewer can confirm:

- ZIP is required for every quote.
- Only first name is collected; surname is absent.
- SMS consent is visible, explicit, and unchecked by default.
- Insurance is chosen at the end of the flow.
- Insurance fields render dynamically and are required only for insurance.
- Insurance company options come from Omega and retain `account_company_id`.
- Switching back to cash clears stale insurance values.
- Duplicate policy-holder contact fields are gone.

---

# Phase 5 — Omega Quote Generation and HTML Result Parsing

## Goal

Submit the normalized kiosk data to Omega and return a minimal application-owned quote result parsed from the final Quotes HTML.

## Work

1. Implement the final `POST /api/kiosk/omega/quotes` Route Handler.

2. Authenticate the kiosk device and validate the entire request server-side. Never trust IDs, payment mode, position codes, or location data merely because the client previously selected them.

3. Map supported glass selections to Omega position codes on the server. Reject unsupported selections even if a client bypasses the disabled Continue button.

4. Construct the Quotes request with only confirmed values.

   Common values:

   ```text
   year
   make=<make_id>
   model=<model_id>
   vehicle_id
   position
   customer_zip
   customer_fname
   customer_phone
   customer_email            # when provided
   customer_sms=0|1
   folder=pag
   smart=true
   ```

   Do not send `customer_surname`.

   Add `opening=<position>` only in the request shapes required by the functional design and validated Omega behavior. Include optional VIN only when present.

5. Cash request additions:

   ```text
   medium=web_quote
   campaign=WEB QUOTE
   ```

6. Insurance request additions:

   ```text
   campaign=Ins Web Quote
   account_company_id
   account_policy_no
   account_deductible
   ```

7. Omit legacy campaigns, `include_recal`, `template_id`, license-plate fields, and unused blank parameters.

8. Require a successful Quotes response and treat it as HTML. Extract the invoice ID from the most stable available marker, with the documented quote-number text pattern as a fallback. Extract the displayed total only from an element whose class includes `price`, so unrelated values such as installment amounts are not mistaken for the quote total.

9. Require both a valid invoice ID and a positive finite total. Preserve the invoice ID in sanitized server logging context once it is known.

10. Return a minimal application DTO:

    ```ts
    type QuoteResult = {
      invoiceId: string
      total: number
    }
    ```

11. Accept a currency-formatted total with an optional thousands separator. Reject missing, non-finite, zero, negative, or otherwise unusable quote totals.

12. Return only the normalized DTO. Never return raw HTML, the Omega URL, or credentials.

13. Classify failures by stage and log only sanitized metadata: internal request ID, trusted kiosk location, vehicle ID, position, cash/insurance mode, Omega status, and invoice ID when known.

## Phase 5 review gate

Do not continue until the reviewer can confirm with controlled live tests:

- Cash uses `campaign=WEB QUOTE` and `medium=web_quote`.
- Insurance uses `campaign=Ins Web Quote` and the selected company ID.
- No surname, legacy campaign, `include_recal`, or `template_id` is sent.
- Quotes HTML is never returned to the browser.
- The invoice ID and total are extracted from the final Quotes HTML.
- The total comes from Omega's `price` element rather than local calculations.
- No Invoice API request or recovery request is made.
- Sensitive query data is absent from normal logs.

---

# Phase 6 — Result UI, Submission States, and Removal of Sample Pricing

## Goal

Connect quote generation to the existing result experience and remove every production dependency on sample pricing.

## Work

1. Change “Get my quote” from simple navigation into asynchronous submission.

2. Add explicit client states:

   ```text
   idle
   submitting
   succeeded
   failed
   ```

3. While submitting:

   - Disable repeat submission.
   - Show the existing kiosk loading style.
   - Prevent Back/Restart actions from accidentally issuing another request.

4. On success:

   - Store the normalized `QuoteResult`, including `invoiceId`, in kiosk quote state.
   - Navigate to the result step.
   - Display `QUOTE #{invoiceId}` and the authoritative Omega total.
   - Do not display tax, subtotal, line items, or the invoice ID in supporting copy.
   - Show a short customer-friendly standard-parts estimate message near the total and concise fine print immediately above Finish.
   - For insurance, show the dedicated acknowledgement instead of a price result.

5. On failure:

   - Stay in or return to a recoverable form state.
   - Show a customer-safe error consistent with the kiosk UI.
   - Permit a deliberate retry.

6. Remove `getQuotePreview`, sample ranges, “sample data” messaging, and all local price adjustments once no active kiosk code uses them.

7. Reset quote result, lookup selections, insurance data, SMS consent, and submission state when the kiosk flow resets or times out.

## Phase 6 review gate

Do not continue until the reviewer can confirm:

- The result screen never displays locally generated pricing.
- Cash results show only Omega's authoritative quote total and quote number.
- Insurance results show the dedicated acknowledgement and deductible responsibility message.
- Double-clicking or repeated rendering cannot submit duplicate Quotes requests.
- Failure and retry behavior is understandable at the kiosk.
- Restart and inactivity reset remove all prior customer and quote data.

---

# Phase 7 — End-to-End Validation and Kiosk-Only Cleanup

## Goal

Validate the supported production path, document remaining Omega uncertainties, and confirm that unrelated flows were untouched.

## Validation matrix

Test at minimum:

1. Manual 2017 Ford Fusion resolution, including the correct final body style and `vehicle_id=66687`.
2. Valid VIN resolution.
3. Invalid VIN with manual fallback.
4. Cash windshield quote.
5. Insurance windshield quote using a dynamically loaded company ID.
6. Front and rear door-glass quotes.
7. Back-glass quote.
8. Quarter-glass quote.
9. Vent-glass quote when a compatible vehicle is available.
10. Sunroof and “not sure” selections remain blocked.
11. Multiple ZIP codes, comparing the total displayed in final Quotes HTML.
12. Omega lookup outage.
13. Quotes non-200 response.
14. Successful Quotes response with no recoverable invoice ID.
15. Successful final Quotes response with a missing or malformed `price` total.
16. Unauthorized/non-kiosk request to every new Route Handler.
17. Inactivity reset during lookup and before submission.
18. Attempted double submission.

## Final checks

- Run formatting, lint, TypeScript, and production build checks.
- Confirm no raw customer data or Omega credentials appear in logs or browser responses.
- Confirm no local pricing code remains in the active kiosk quote path.
- Confirm `app/check-in`, appointment resolution, and the local Omega mock behave exactly as before.
- Confirm `app/kiosk-X` is unchanged.
- Record unresolved live-Omega behavior in the functional design or a follow-up document rather than guessing.

## Phase 7 review gate / definition of done

The kiosk quote integration is ready for acceptance when every supported path resolves an Omega vehicle, creates exactly one Omega quote, and displays the HTML-derived result without exposing Omega internals or affecting unrelated check-in functionality.
