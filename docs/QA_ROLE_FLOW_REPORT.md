# QA Report — Function Page Role Flows

**Date:** 2026-08-17  
**Scope:** Function page (`Try-on`, `Magic editor`, `AI studio`), Free / Creator / Studio behavior, Quick Ideas carousel, and Show all ideas modal.  
**Evidence:** Source inspection, static build, lint, review of implemented UI logic, and browser E2E UI checks against `http://127.0.0.1:4173` after remote-debugging approval. Authenticated purchase confirmation and live generation API completion were not executed because dedicated test accounts/API fixtures were not supplied.

## Executive summary

| Area | Status | Notes |
|---|---|---|
| TypeScript production build | PASS | `npm run build` completed successfully. |
| Lint | PASS | `npm run lint` completed successfully. |
| Free role UI access | PASS (static) | Preset-only Magic Editor is implemented; custom prompt is absent. |
| Creator role UI access | PASS (static) | Same preset-only limitation as Free; Creator is not allowed custom prompt. |
| Studio role UI access | PASS (static) | Custom prompt is available only when current package equals `Studio`. |
| Quick Ideas carousel | PASS (static) | Studio row is one-line horizontal scroll with every idea plus Show all as the last item. |
| Show all modal | PASS (static) | Contains all 20 ideas; backdrop and Escape close it. |
| Actual authenticated purchase and generation API | NOT EXECUTED | Requires dedicated test accounts and a working test API fixture. |
| Server-side entitlement enforcement | AT RISK | Current package and credits are client-side local storage in this build. |
| Browser UI role checks | PASS | Free, Creator, and Studio UI gates, modal behavior, and Studio carousel were exercised in the local app. |

## Capacity and feature matrix

| Capability | Free | Creator | Studio | Implementation evidence / QA result |
|---|---:|---:|---:|---|
| Initial free generations | 1 | 1 before purchased balance is used | 1 before purchased balance is used | `FREE_GENERATION_LIMIT = 1`; remaining count adds purchased balance. |
| Purchased generations granted | — | 300 | 700 | Plan definitions provide 300 / 700 credits. |
| One-time package capacity | 5 | — | — | One-time plan grants 5 credits. Included here for comparison. |
| Magic Editor preset ideas | Yes | Yes | Yes | Presets use `MAGIC_EDITOR_PROMPTS`. |
| Quick Ideas carousel | Yes | Yes | Yes | Horizontal carousel layout is specifically enabled for custom-prompt/Studio card; non-Studio ideas remain a list-style layout. |
| Show all ideas | Yes | Yes | Yes | Final item in the idea row; opens all-ideas modal. |
| Custom prompt input | No | No | Yes | Gated by `currentPackage === 'Studio'`. |
| Results per generation (plan claim) | Unspecified | 2–4 | Up to 8 | Displayed on pricing page; not passed from client to job API or separately enforced in this client. |
| HD unlock (plan claim) | One-time / Creator / Studio | Yes | Yes | Displayed as plan feature; no client entitlement control found. |
| History (plan claim) | Not advertised | 1 month | Unlimited | Displayed as plan feature; no client retention logic found. |
| Batch generation / bulk try-on / queue priority (plan claim) | No | No | Yes | Displayed as plan feature; no client controls or API entitlement fields found. |

## Browser E2E execution evidence

The following UI checks were run successfully against the local development app using browser automation. Creator and Studio were simulated with the documented local-storage QA setup; this validates client-side gating only, not a production authorization boundary.

| Role | Check | Result | Evidence |
|---|---|---|---|
| Free | Magic Editor custom prompt access | PASS | No textarea was rendered; the UI showed “Studio unlocks custom prompts.” |
| Free | Preset ideas / Show all | PASS | Six visible preset chips plus Show all; modal opened with 20 ideas. |
| Free | Modal keyboard dismissal | PASS | Escape closed the all-ideas modal. |
| Not logged in | Clean anonymous state | PASS | Package and purchased-credit keys were cleared; app showed Sign in control and 1 free generation remaining. |
| Not logged in | Magic Editor entitlement | PASS | Custom textarea was hidden; Studio upsell was visible; six preset chips plus final Show all tab rendered. |
| Not logged in | All ideas modal | PASS | Show all opened a 20-idea modal. |
| Not logged in | Required source-image guard | PASS | Try Now without an image displayed “Please upload Source image.” and did not submit a job. |
| Not logged in | Studio purchase gate | PASS | Choosing Studio → Continue showed “Sign in to purchase Studio”; confirm action opened the login panel. |
| Not logged in | Login panel controls | PASS | Email, password, Google sign-in, sign-up switch, and close control were present; close dismissed the panel. |
| Creator | Package state / capacity display | PASS | With `Creator` and 300 purchased credits, UI displayed 301 remaining (one unused free + 300 credits). |
| Creator | Custom prompt access | PASS | No textarea rendered; Studio upsell hint remained visible. |
| Creator | Show all | PASS | Modal opened with 20 ideas. |
| Studio | Package state / custom prompt | PASS | Custom prompt textarea rendered and accepted typed input. |
| Studio | Carousel mechanics | PASS | Quick Ideas had `flex-wrap: nowrap`, horizontal overflow, 2,545 px scroll width within a 336 px viewport. |
| Studio | Final Show all tab | PASS | Carousel contained 21 buttons: 20 ideas followed by **Show all ideas** as the last item. |
| Studio | Modal and preset application | PASS | Modal opened with 20 ideas; selecting one closed the modal, selected the chip, and wrote the protected prompt into the textarea. |
| Studio | Required-field guard | PASS | Try Now without source image returned “Please upload Source image.” and did not submit a job. |

## Role-flow results

### 1. Not logged in / anonymous user

**Executed browser flow**

1. Cleared package, purchased-credit, free-generation, and session storage state; reloaded the app.
2. Confirmed the signed-out header and one available free generation.
3. Opened Magic Editor and confirmed the preset-only experience: no custom textarea, Studio upsell, six visible presets, and **Show all ideas** as the final item.
4. Opened Show all and confirmed 20 ideas were available.
5. Confirmed missing source image prevents job submission with a clear validation message.
6. Opened Studio purchase, selected **Continue**, then **Sign in**; login panel opened with all expected authentication controls. Closing it returned to the paywall.

**QA verdict:** **PASS (browser UI flow)**. The anonymous preview now waits four seconds, does not consume the free credit, and keeps a pending real-generation request for sign-in. Actual sign-in and real generation completion still require a working test authentication/API environment.

### 2. Free user

**Intended flow**

1. User opens Function page with no `slora-current-package` and no purchased credits.
2. User can select tools, images, preset ideas, and **Show all ideas**.
3. In Magic Editor, the card uses preset ideas only; the custom textarea does not render.
4. User begins with one free generation.
5. After generation is consumed, the count reaches zero and an exhausted result is upgrade-gated.
6. Anonymous results additionally show a sign-in gate.

**Verified implementation**

- Custom prompt is false unless the package is exactly Studio.
- Non-Studio Magic Editor exposes a preset-choice card and the Studio upsell copy.
- Generation remaining combines one free credit with purchased credits.
- When no free or purchased balance remains, `isLimitedGeneration` enables the upgrade / buy-one-time gate.
- Guest results display a sign-in gate.

**QA verdict:** **PASS (browser UI flow)**; **live generation E2E pending**.

### 3. Creator user

**Intended flow**

1. Signed-in user confirms Creator test purchase.
2. Client grants 300 purchased generations and marks package `Creator`.
3. User creates images while balance is positive; balance decrements per request.
4. Magic Editor continues to allow presets and Show all, but does not expose custom prompt.
5. Pricing page states 2–4 results, HD unlock, one-month history; batch/bulk/priority are unavailable.

**Verified implementation**

- Creator plan grants 300 local credits.
- Creator is deliberately excluded from custom-prompt condition.
- Creator plan capability text is displayed in the pricing UI.

**QA verdict:** **PASS for browser UI/package-state gating**; **live generation and API capacity pending**.

### 4. Studio user

**Intended flow**

1. Signed-in user confirms Studio test purchase.
2. Client grants 700 purchased generations and marks package `Studio`.
3. Magic Editor shows a dedicated editable **Custom prompt** input.
4. **Quick ideas** renders as a one-line horizontal carousel. It contains all 20 ideas and ends with **Show all ideas**.
5. Selecting Show all opens a modal with all idea options.
6. Selecting an idea applies that idea's identity-protected prompt and closes the modal.
7. Studio credits decrement on generation; result remains unlocked while credits remain.

**Verified implementation**

- `currentPackage === 'Studio'` controls visibility of the custom textarea.
- All `MAGIC_EDITOR_PROMPTS` are included in the Studio carousel.
- **Show all ideas** is rendered after mapped idea buttons, therefore is the final carousel item.
- CSS uses `flex-wrap: nowrap` and `overflow-x: auto` for the Studio carousel.
- Modal supports close button, backdrop, and Escape.
- Studio plan grants 700 local credits and displays its feature list.

**QA verdict:** **PASS (browser UI flow)**; **live generation E2E pending**.

## Detailed flow controls

| Control | Expected behavior | Status |
|---|---|---|
| Unsupported image input | Reject types other than PNG/JPEG. | Implemented |
| Oversized image input | Reject greater than 5 MB. | Implemented |
| Required fields | Prevent job creation if any required image/prompt is absent. | Implemented |
| Concurrent upload/generate | Disable CTA while uploading and protect against stale upload responses. | Implemented |
| Generation state | Queue/process state is polled every 2.5 s; failure offers retry. | Implemented |
| Credit consumption | Decrements purchased balance first; otherwise consumes the free allocation. | Implemented |
| Result privacy | Guest result uses sign-in gate; exhausted capacity uses upgrade gate. | Implemented |
| Modal behavior | Close via close control, backdrop, or Escape. | Implemented |
| Session persistence | Active tool, prompt, generation, guest images, and gated-state persist in session storage. | Implemented |

## Findings and risks

### High priority

1. **Entitlements are client-controlled in this implementation.**
   - Package and credit state are read/written through browser local storage (`slora-current-package` and `slora-purchased-generations`).
   - A user can alter these values through browser developer tools.
   - **Recommendation:** Move package, credit balance, result count, custom-prompt access, priority, history, batch, and bulk authorization to the API/database. The API should derive all entitlements from the authenticated user and reject unauthorized job parameters/actions.

2. **Advertised plan capabilities are not visibly passed to or enforced by the generation request.**
   - Current job creation sends `inputs`, device ID, and `freeGeneration`; it does not send or validate plan-level result count, HD, batch, bulk, or priority.
   - **Recommendation:** Define a server-side entitlement contract and add integration tests that assert each plan can only request its permitted capacity/features.

### Medium priority

3. **Exhausted users can submit a job before the result gate appears.**
   - With zero capacity, the client still starts a generation and applies an upgrade gate afterward.
   - This may be intentional as a conversion preview, but it incurs generation cost.
   - **Recommendation:** Confirm product intent. If not a preview model, block submission at zero balance and direct the user to purchase before job creation.

4. **Subscription lifecycle is not represented.**
   - Monthly/annual selection changes display price only; it does not change generation grants, renewal dates, expiry, downgrade rules, or credit carry-over.
   - **Recommendation:** Add subscription records, renewal webhook handling, expiration tests, and server-side credit/period accounting.

5. **Role vocabulary should be explicit.**
   - “Free user” can mean anonymous guest or signed-in user without a package; their result reveal behavior differs.
   - **Recommendation:** Use `guest`, `registered-free`, `one-time`, `creator`, and `studio` as separate QA personas.

## Outstanding E2E test execution

The browser UI portion of the role suite completed successfully after remote-debugging approval. The following flows still require dedicated test accounts and controllable API fixtures:

- authenticated sign-in and purchase confirmation for Creator and Studio;
- live source-image upload and completed/failed generation jobs;
- result download and downstream Magic edit / Try-on-again handoff;
- server-enforced credit decrement, renewal, expiration, and entitlement rejection;
- advertised result-count, HD, history, batch, bulk try-on, and queue-priority behavior.

## Release recommendation

**Conditional approval for UI/layout changes.** Build and lint pass, and the inspected client logic supports the requested Studio custom prompt, carousel, and Show all flow. Do **not** treat the current package/credit mechanism as production-ready authorization until server-side entitlement checks and the listed E2E cases pass.
