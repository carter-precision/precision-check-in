# Omega Quote Integration — Phase 7 Validation Record

Date: 2026-08-07

## Post-validation product adjustment — 2026-08-10

Live testing established that Omega creates both cash and insurance invoices
even though the returned HTML did not match the original invoice-ID parser.
The product owner subsequently changed the insurance completion contract:

- policy number is required and sent as `account_policy_no`;
- deductible is optional and omitted from Omega when unknown;
- insurance submissions stop after a successful Quotes response and show a
  dedicated insurance acknowledgement;
- insurance submissions do not parse an invoice ID or fetch the invoice;
- cash submissions continue to require a final quote number and total, with the
  parser expanded to recognize additional bounded quote/invoice markers.

## Cash two-stage Quotes adjustment — 2026-08-11

Controlled product-owner traffic established that the initial cash Quotes
response is an HTML meta-refresh rather than the final quote page. The refresh
targets `/quoter/vin.php` and carries an Omega-generated invoice GUID. Omega's
form then calls Quotes a second time with that GUID, VIN/opening/medium fields,
and a trailing blank `smart` value; the second response contains the invoice ID
and quote price.

The server now classifies the first response as either direct-final,
validated-bootstrap, or invalid. It extracts only a UUID-shaped GUID from
exactly one same-origin `/quoter/vin.php` refresh, rebuilds the completion query
from validated application input, and parses the final invoice ID and displayed
price. It does not request or render the intermediate page.

Offline tests cover the captured bootstrap/final responses, request transition,
duplicate `smart` values, invalid GUIDs, external/wrong-path refreshes, refreshes
hidden in scripts, ambiguous refreshes, and final HTML price extraction.
No automated Create Invoice or Quotes request was made.

## Cash result simplification — 2026-08-11

The product owner chose the final Quotes HTML as the cash result source after a
controlled live quote confirmed that it contains both the quote number and the
displayed total. The server now requires both values, returns only
`{ invoiceId, total }`, and does not call the Invoice API. The kiosk result shows
only the quote number, total, customer-friendly estimate copy, and concise fine
print. Tax, subtotal, line items, location, pricing profile, and Invoice GET
recovery state were removed.

## Scope and safety constraint

This record covers Phase 7 of the implementation roadmap for the active kiosk
quote flow. The validation did not send a quote-generation request to Omega or
create an Omega invoice. The local quote handler authorization was exercised
without allowing the request to reach quote-generation logic.
Live quote-generation rows in the roadmap were intentionally not run because
the project owner prohibited test quotes from reaching Omega's invoice list.

The configured Omega lookup service was unavailable during this pass. Lookup
contracts were therefore exercised with deterministic offline fixtures, while
the real kiosk UI was used only for safe pre-submission behavior.

## Validation matrix

|   # | Scenario                                             | Result                                | Evidence or limitation                                                                                                                                                                                                                                   |
| --: | ---------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Manual 2017 Ford Fusion, final `vehicle_id=66687`    | Offline pass; live lookup unavailable | The automated contract suite verifies Year `2017` → Ford `138` → Fusion `4543` → `4 Door Sedan` / vehicle `66687`, including modifier preservation. The kiosk displayed its lookup-outage retry state when the live Year request failed.                 |
|   2 | Valid VIN resolution                                 | Offline pass; live lookup unavailable | The suite verifies normalization of a documented VIN-shaped response into the complete quote vehicle DTO. The live Omega VIN response contract remains unverified.                                                                                       |
|   3 | Invalid VIN with manual fallback                     | Pass                                  | In-browser validation rejected a 17-character VIN containing `I`, kept Continue disabled, displayed the VIN guidance, and switched to the manual selectors.                                                                                              |
|   4 | Cash windshield quote                                | Not executed by instruction           | The suite verifies the initial bootstrap request and GUID-backed completion request, including `campaign=WEB QUOTE`, `lead_type=web_lead`, `medium=web_quote`, `opening=W`, VIN, and duplicate `smart` values, without sending either request.           |
|   5 | Insurance windshield quote with dynamic company ID   | Not executed by instruction           | The suite verifies company DTO normalization and `campaign=Ins Web Quote`, `account_company_id`, policy number, and deductible mapping. Live company loading and invoice pricing-profile selection remain unverified.                                    |
|   6 | Front and rear door-glass quotes                     | Not executed by instruction           | Client and server mappings are verified offline for `D_FRONT_LEFT`, `D_FRONT_RIGHT`, `D_REAR_LEFT`, and `D_REAR_RIGHT`.                                                                                                                                  |
|   7 | Back-glass quote                                     | Not executed by instruction           | Client and server mapping to `B` is verified offline.                                                                                                                                                                                                    |
|   8 | Quarter-glass quote                                  | Not executed by instruction           | The generic and diagram-specific quarter selections are verified offline to normalize to `Q`.                                                                                                                                                            |
|   9 | Vent-glass quote                                     | Not executed by instruction           | Client and server mapping to `V` is verified offline. Vehicle compatibility remains a live Omega question.                                                                                                                                               |
|  10 | Sunroof and “not sure” blocked                       | Pass                                  | Offline UI-domain checks confirm both selections have no position and are unsupported; server validation rejects either as a quote submission. Source review confirms the kiosk leaves Continue disabled and displays the unsupported-selection message. |
|  11 | Multiple ZIPs: final HTML total                      | Not executed by instruction           | Requires created quotes and was intentionally skipped.                                                                                                                                                                                                   |
|  12 | Omega lookup outage                                  | Pass                                  | The active kiosk displayed “We couldn't load vehicle years,” exposed Retry, kept downstream selectors and Continue disabled, and later reset to Welcome after inactivity.                                                                                |
|  13 | Quotes non-200                                       | Not executed by instruction           | The safe error-classification path is present, but exercising the Quotes endpoint was prohibited.                                                                                                                                                        |
|  14 | Quotes bootstrap response without invoice ID         | Offline pass only                     | Captured meta-refresh HTML is classified as bootstrap, its GUID is validated, and unsafe/ambiguous refreshes are rejected. Final HTML must contain both a recoverable invoice ID and total.                                                              |
|  15 | Final HTML with missing or malformed price           | Offline pass only                     | The parser rejects absent, unclassed, or script-contained prices and accepts positive currency values only from Omega's `price` element.                                                                                                                 |
|  16 | Unauthorized request to every new Route Handler      | Pass for location authorization       | All six lookup handlers and the quote handler returned `401` for an unauthorized location. Production non-kiosk cookie enforcement was also source-reviewed; it was not exercised against a deployed production device registry.                         |
|  17 | Inactivity reset during lookup and before submission | Pass                                  | The manual lookup/outage screen returned to Welcome after the warning/reset interval. Reset defaults are also asserted for customer, vehicle, insurance, consent, result, and submission state.                                                          |
|  18 | Attempted double submission                          | Code/offline review only              | The immediate ref-based single-flight lock is set before the request begins, and navigation/restart controls are guarded while it is set. An actual submission attempt was intentionally skipped because it would call Quotes.                           |

## Automated offline coverage

Run:

```text
npm run test:omega-quote
```

The suite covers:

- lookup DTO normalization and duplicate/modifier handling;
- the documented Fusion `66687` chain;
- VIN validation and normalization;
- insurance-company DTO normalization;
- every supported and unsupported glass mapping on both client and server;
- exact initial/completion cash and insurance request construction;
- safe bootstrap meta-refresh classification and GUID extraction;
- client position-tampering rejection;
- stable and fallback invoice-ID extraction;
- strict extraction of the final total from Omega's `price` element;
- rejection of absent, unclassed, script-contained, zero, or invalid totals;
- total-only browser-result DTO strictness;
- normalized client submission and complete reset defaults.

The test suite contains no network calls.

## Final tool checks

- `npm run test:omega-quote`: passed, 16/16 tests after the HTML-total
  adjustment.
- `npx eslint app components hooks lib tests`: passed.
- `npx tsc --noEmit`: passed.
- Scoped Prettier check for the Phase 7 files: passed.
- `npm run build`: passed with all seven kiosk Omega Route Handlers present in
  the production route manifest.
- `git diff --check`: passed.
- Repository-wide `npm run format:check`: reported 66 pre-existing formatting
  violations in unrelated files. They were not rewritten because doing so
  would modify protected and out-of-scope code.

## Security and scope review

- Quote authentication, Omega credentials, customer query construction, and raw
  Quotes HTML remain server-only.
- Browser responses are restricted to the `{ invoiceId, total }` application
  DTO and customer-safe error objects.
- Quote failure logs contain only request ID, trusted location, vehicle ID,
  position, payment mode, Omega status, invoice ID, stage, and error kind.
- No local/sample pricing code remains in the active kiosk quote path.
- `app/check-in`, appointment-oriented Omega behavior,
  `scripts/mock-omega.mjs`, and `app/kiosk-X` are unchanged by the integration.

## Unresolved live Omega contracts

These items must be verified with controlled real traffic before the roadmap's
acceptance gate can be signed off. They are intentionally documented rather
than guessed.

1. Whether Omega consistently renders the visible quote-number marker and a
   positive currency value inside an element whose class contains `price`
   across cash quote variants. The parser fails closed if either is missing.
2. Whether a selected `account_company_id` causes Omega to choose the expected
   insurance pricing profile.
3. Whether non-windshield requests require `opening` in addition to the path
   position and `position` parameter. The current roadmap-approved request only
   adds `opening` to cash requests.
4. The live VIN response's availability of year, numeric make/model IDs,
   modifiers, and final vehicle ID across representative vehicles.
5. The live Companies response under the roadmap's confirmed filters and the
   resulting insurer set.
6. ZIP-driven quote routing and final HTML total behavior across locations.
7. Actual initial/completion Quotes non-200 bodies/statuses and response
   variants beyond the captured bootstrap/final pair.

License-plate resolution remains explicitly out of scope for this roadmap.

## Acceptance status

Phase 7's offline, security, reset, authorization, build, and protected-scope
checks can be completed without creating an invoice. Product-owner testing has
confirmed the cash two-stage flow and final HTML result for one quote. The
remaining live acceptance condition—each supported path creating exactly one
Omega quote and displaying its HTML-derived result—remains pending because
additional test quotes were explicitly not authorized.
