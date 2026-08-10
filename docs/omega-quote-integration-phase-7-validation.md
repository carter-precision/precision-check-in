# Omega Quote Integration — Phase 7 Validation Record

Date: 2026-08-07

## Scope and safety constraint

This record covers Phase 7 of the implementation roadmap for the active kiosk
quote flow. The validation did not send a quote-generation request to Omega or
create an Omega invoice. The local quote handler was called only with an
unauthorized recovery-shaped request; it returned `401` before quote logic.
Live quote-generation rows in the roadmap were intentionally not run because
the project owner prohibited test quotes from reaching Omega's invoice list.

The configured Omega lookup service was unavailable during this pass. Lookup
contracts were therefore exercised with deterministic offline fixtures, while
the real kiosk UI was used only for safe pre-submission behavior.

## Validation matrix

|   # | Scenario                                                   | Result                                | Evidence or limitation                                                                                                                                                                                                                                   |
| --: | ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | Manual 2017 Ford Fusion, final `vehicle_id=66687`          | Offline pass; live lookup unavailable | The automated contract suite verifies Year `2017` → Ford `138` → Fusion `4543` → `4 Door Sedan` / vehicle `66687`, including modifier preservation. The kiosk displayed its lookup-outage retry state when the live Year request failed.                 |
|   2 | Valid VIN resolution                                       | Offline pass; live lookup unavailable | The suite verifies normalization of a documented VIN-shaped response into the complete quote vehicle DTO. The live Omega VIN response contract remains unverified.                                                                                       |
|   3 | Invalid VIN with manual fallback                           | Pass                                  | In-browser validation rejected a 17-character VIN containing `I`, kept Continue disabled, displayed the VIN guidance, and switched to the manual selectors.                                                                                              |
|   4 | Cash windshield quote                                      | Not executed by instruction           | The suite verifies the exact server-built path and parameters, including `campaign=WEB QUOTE`, `medium=web_quote`, and `opening=W`, without sending the request.                                                                                         |
|   5 | Insurance windshield quote with dynamic company ID         | Not executed by instruction           | The suite verifies company DTO normalization and `campaign=Ins Web Quote`, `account_company_id`, policy number, and deductible mapping. Live company loading and invoice pricing-profile selection remain unverified.                                    |
|   6 | Front and rear door-glass quotes                           | Not executed by instruction           | Client and server mappings are verified offline for `D_FRONT_LEFT`, `D_FRONT_RIGHT`, `D_REAR_LEFT`, and `D_REAR_RIGHT`.                                                                                                                                  |
|   7 | Back-glass quote                                           | Not executed by instruction           | Client and server mapping to `B` is verified offline.                                                                                                                                                                                                    |
|   8 | Quarter-glass quote                                        | Not executed by instruction           | The generic and diagram-specific quarter selections are verified offline to normalize to `Q`.                                                                                                                                                            |
|   9 | Vent-glass quote                                           | Not executed by instruction           | Client and server mapping to `V` is verified offline. Vehicle compatibility remains a live Omega question.                                                                                                                                               |
|  10 | Sunroof and “not sure” blocked                             | Pass                                  | Offline UI-domain checks confirm both selections have no position and are unsupported; server validation rejects either as a quote submission. Source review confirms the kiosk leaves Continue disabled and displays the unsupported-selection message. |
|  11 | Multiple ZIPs: invoice location, tax, and total            | Not executed by instruction           | Requires created invoices and was intentionally skipped.                                                                                                                                                                                                 |
|  12 | Omega lookup outage                                        | Pass                                  | The active kiosk displayed “We couldn't load vehicle years,” exposed Retry, kept downstream selectors and Continue disabled, and later reset to Welcome after inactivity.                                                                                |
|  13 | Quotes non-200                                             | Not executed by instruction           | The safe error-classification path is present, but exercising the Quotes endpoint was prohibited.                                                                                                                                                        |
|  14 | Quotes success with no invoice ID                          | Parser pass only                      | The extraction suite verifies that unrelated/script-only quote-number text returns no ID. No Quotes request was made.                                                                                                                                    |
|  15 | Invoice creation followed by temporary Invoice GET failure | Offline pass only                     | The retry suite verifies three attempts are confined to the supplied Invoice GET operation. No invoice was created.                                                                                                                                      |
|  16 | Unauthorized request to every new Route Handler            | Pass for location authorization       | All six lookup handlers and the quote handler returned `401` for an unauthorized location. Production non-kiosk cookie enforcement was also source-reviewed; it was not exercised against a deployed production device registry.                         |
|  17 | Inactivity reset during lookup and before submission       | Pass                                  | The manual lookup/outage screen returned to Welcome after the warning/reset interval. Reset defaults are also asserted for customer, vehicle, insurance, consent, invoice, recovery, result, and submission state.                                       |
|  18 | Attempted double submission                                | Code/offline review only              | The immediate ref-based single-flight lock is set before the request begins, and navigation/restart controls are guarded while it is set. An actual submission attempt was intentionally skipped because it would call Quotes.                           |

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
- exact cash and insurance request construction and forbidden legacy fields;
- client position-tampering rejection;
- stable and fallback invoice-ID extraction;
- numeric-string invoice normalization and invalid-invoice rejection;
- Invoice GET-only retry behavior;
- recovery-request and browser-result DTO strictness;
- normalized client submission and complete reset defaults.

The test suite contains no network calls.

## Final tool checks

- `npm run test:omega-quote`: passed, 12/12 tests.
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

- Quote authentication, Omega credentials, customer query construction, raw
  Quotes HTML, and raw invoice JSON remain server-only.
- Browser responses are restricted to application DTOs and customer-safe error
  objects. The recovery token is returned only when an already-created invoice
  needs a safe Invoice GET retry.
- Quote failure logs contain only request ID, trusted location, vehicle ID,
  position, payment mode, Omega status, invoice ID, stage, and error kind.
- No local/sample pricing code remains in the active kiosk quote path.
- `app/check-in`, appointment-oriented Omega behavior,
  `scripts/mock-omega.mjs`, and `app/kiosk-X` are unchanged by the integration.

## Unresolved live Omega contracts

These items must be verified with controlled real traffic before the roadmap's
acceptance gate can be signed off. They are intentionally documented rather
than guessed.

1. The most stable machine-readable invoice-ID marker across several real
   Quotes HTML responses. The implementation supports known structured markers
   and the documented visible-text fallback.
2. The exact live Invoice response names and nesting for `invoice_subtotal`,
   `invoice_tax`, `invoice_total`, `location_id`, `pricing_profile_id`, and
   `Items[{sku, description, price}]`.
3. Whether a selected `account_company_id` causes Omega to choose the expected
   insurance pricing profile.
4. Whether non-windshield requests require `opening` in addition to the path
   position and `position` parameter. The current roadmap-approved request only
   adds `opening` to cash requests.
5. The live VIN response's availability of year, numeric make/model IDs,
   modifiers, and final vehicle ID across representative vehicles.
6. The live Companies response under the roadmap's confirmed filters and the
   resulting insurer set.
7. ZIP-driven `location_id`, tax, and total behavior across locations.
8. Actual Quotes non-200 bodies/statuses, successful HTML without a recoverable
   ID, and Invoice GET timing immediately after invoice creation.

License-plate resolution remains explicitly out of scope for this roadmap.

## Acceptance status

Phase 7's offline, security, reset, authorization, build, and protected-scope
checks can be completed without creating an invoice. The final live acceptance
condition—each supported path creating exactly one Omega quote and displaying
its fetched invoice—remains pending because those tests were explicitly not
authorized.
