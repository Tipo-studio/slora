# Role-Based QA Test Cases — Function / Magic Editor

**Scope:** Function page (`Try-on`, `Magic editor`, `AI studio`), package entitlements, generation balance, Quick Ideas carousel, and **Show all ideas** modal.

**Roles under test**

- **Free:** anonymous or signed-in user with no current package and no purchased generations.
- **Creator:** signed-in user whose current package is `Creator`, with purchased credits.
- **Studio:** signed-in user whose current package is `Studio`, with purchased credits.

## Test environment and data

| Item | Value |
|---|---|
| Build | `npm run build` |
| Static checks | `npm run lint` |
| Local storage keys | `slora-free-generation-used`, `slora-purchased-generations`, `slora-current-package` |
| Role setup (temporary QA data) | Set `slora-current-package` to `Creator` or `Studio`, and set `slora-purchased-generations` to a positive integer. Reload the page. |
| Reset (development only) | Use **RESET GENERATION FOR TESTING** or clear the keys above. |
| Required API prerequisites | Tool schema endpoint, source-image upload endpoint, generation job endpoint, generation polling endpoint, and Supabase guest/sign-in session. |

> Do not use browser local storage to emulate a production entitlement test. It is suitable only for this client-side QA build. Production roles must come from a server-validated subscription/credit ledger.

## Common functional checks

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| COM-01 | Tool selection | Open Function page; choose each tool tab. | Selected tab is visually active; its tool schema loads; the relevant input cards render. |
| COM-02 | Image validation | Try a non-PNG/JPEG file; then a PNG/JPEG larger than 5 MB. | Generation is blocked and an actionable validation message appears. |
| COM-03 | Required input validation | Press **TRY NOW** without required image/prompt inputs. | No job is submitted; UI identifies the missing required field. |
| COM-04 | Upload in progress | Start an image upload and immediately press **TRY NOW**. | CTA is disabled; a message prevents generation until upload completes. |
| COM-05 | Suggestion selection | Select an idea chip. | Prompt value is populated with the identity lock plus the selected idea; the chip is selected. |
| COM-06 | Show all modal | Select **Show all ideas**. | Modal opens with all 20 ideas; close button, backdrop, and Escape close it. |
| COM-07 | Carousel end tab | Horizontally scroll Quick ideas to its end. | **Show all ideas** appears as the final carousel tab and opens the same modal. |
| COM-08 | Generation lifecycle | Submit valid inputs; poll until terminal state. | CTA shows generating state; completed results render, failed jobs expose retry. |
| COM-09 | Result actions | For an unlocked completed result, use full preview, download, Magic edit, and Try-on again. | Preview can close; download is triggered; downstream tool receives the image after upload. |

## Free role flow

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| FREE-01 | Default entitlement | Clear all package/credit keys. Open Magic editor. | No custom-prompt textarea. Suggestion-only editor shows the Studio upsell hint. |
| FREE-02 | Quick ideas browsing | Swipe/scroll the idea row and select **Show all ideas**. | Idea list and modal remain available without Studio. Selecting a preset populates the implicit prompt. |
| FREE-03 | Registered-free capacity | Sign in and complete one valid generation from a clean device state. | Remaining counter decreases from 1 to 0 only after the real job is accepted. |
| FREE-04 | Guest preview capacity | As an anonymous user, create a preview then sign in. | Preview does not consume the free generation; the credit is consumed only when the authenticated real job is accepted. |
| FREE-05 | Guest result reveal | Run the flow as an anonymous session. | Completed result is covered by sign-in gate; signing in is required to reveal it. |
| FREE-06 | Exhaustion follow-up | With 0 remaining, submit a valid job. | Product behavior to confirm: job is allowed but its result is upgrade-gated. This should be explicitly accepted by product; it is not a hard pre-submit quota block. |

## Creator role flow

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| CRE-01 | Creator purchase/setup | Sign in, choose Creator, confirm test purchase, return to Function page. | Current package is Creator; 300 purchased generations are added. |
| CRE-02 | Creator capacity | Generate once with valid inputs. | Purchased balance decreases by 1; result is unlocked while credits remain. |
| CRE-03 | Custom prompt restriction | Open Magic editor. | Custom-prompt textarea is not rendered. Preset Quick ideas and Show all are available; Studio upsell hint is visible. |
| CRE-04 | Creator package capabilities | Inspect pricing and attempt plan-only operations. | UI lists 2–4 results, HD unlock, and 1-month history. Batch, bulk try-on, and priority are marked unavailable. Back-end enforcement must be separately verified. |
| CRE-05 | Credit exhaustion | Set/consume credits to zero; submit a valid job. | Flow falls back to free quota if unused; otherwise result is gated. Confirm package-specific expiry/renewal behavior with product. |

## Studio role flow

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| STU-01 | Studio purchase/setup | Sign in, choose Studio, confirm test purchase, return to Function page. | Current package is Studio; 700 purchased generations are added. |
| STU-02 | Custom prompt input | Open Magic editor. Enter, edit, and clear custom text. | Custom textarea is visible, editable, and retains the typed value in the current session. |
| STU-03 | Quick ideas carousel | Scroll the Quick ideas row horizontally. | Chips stay on one line, support horizontal scroll/swipe, and do not wrap into the custom prompt area. |
| STU-04 | Show all is last item | Reach the end of the Quick ideas row. | **Show all ideas** is the final carousel item. |
| STU-05 | Modal selection | Open Show all, choose an idea. | Modal closes and replaces the current custom prompt with the selected protected prompt. |
| STU-06 | Studio capacity | Generate once with valid inputs. | Purchased balance decreases by 1; result is unlocked while credits remain. |
| STU-07 | Studio advertised capabilities | Inspect pricing/features. | UI lists up to 8 results, HD unlock, unlimited history, batch generation, bulk try-on, queue priority, and custom prompt. Back-end enforcement must be separately verified. |

## Regression and accessibility checks

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| REG-01 | Keyboard modal close | Open Show all; press Escape. | Modal closes without changing the selected idea. |
| REG-02 | Modal backdrop close | Open Show all; click the backdrop. | Modal closes. |
| REG-03 | Focus visibility | Tab through Quick ideas, Show all, and modal actions. | Visible focus treatment is present. |
| REG-04 | Responsive viewport | Test 320 px, 768 px, 1024 px, and desktop widths. | Carousel remains horizontally scrollable; modal uses one column on narrow screens; no clipped controls. |
| REG-05 | Route/session continuity | Reload after choosing a role and after editing prompt text. | Package and prompt/session behavior match intended local persistence rules. |
