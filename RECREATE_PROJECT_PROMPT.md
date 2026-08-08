# One-Prompt Project Recreation Brief — Slora Homepage

> Copy the prompt below into a capable coding agent along with the current `public/images/` directory. It is intentionally implementation-oriented: recreate the product behavior and visual system rather than copying existing source code.

---

## Prompt

Build a production-quality **React 19 + TypeScript + Vite 8** single-page marketing/product interface named **`slorahome`**. Use CSS (a single global stylesheet is acceptable) with optional Tailwind utilities. Do not require a backend. Implement all interactions client-side and use the supplied assets from `public/images` exactly; do not replace product imagery, model imagery, phone frames, or icons with placeholders.

### Technical contract

- Stack: React 19, TypeScript, Vite, `@vitejs/plugin-react`, Tailwind v4 plugin available, Lucide React for the profile icon.
- Entry point: `src/main.tsx` renders `App` in `StrictMode`; global styles live in `src/index.css`.
- Dev server: host `0.0.0.0`, port `5173`.
- Scripts:
  - `dev`: `vite`
  - `build`: `tsc -b && vite build`
  - `lint`: `oxlint`
- TypeScript should target ES2023, use `moduleResolution: "bundler"`, `jsx: "react-jsx"`, and enable `noUnusedLocals` / `noUnusedParameters`.
- Use semantic HTML, keyboard-accessible buttons, labels for inputs, tab ARIA semantics, meaningful `aria-label`s, and decorative assets with `alt=""` plus `aria-hidden="true"`.
- Respect `prefers-reduced-motion`: disable non-essential motion rather than removing content.
- Do not add a backend, authentication integration, database, API request, analytics, or mock “AI generation” result. Buttons trigger local UI states only.

### Metadata

Create `index.html` with:

- title: `slorahome`
- favicon: `/favicon.png`
- description: `From imagination to stunning visuals in seconds. Create, edit, and restyle with effortless AI.`
- viewport/device metadata
- preconnects for Google Fonts.

Load Poppins (300, 400, 500, 600, 700) and Playfair Display SC (400, 700). Other loaded display fonts can remain only if actually used.

---

## Asset contract

Assume the following assets exist and must be referenced by these paths:

```text
public/
├── favicon.png
└── images/
    ├── full-logo.svg
    ├── lgpsm-hero-logo.svg
    ├── lgpsm-feature-icon.svg
    ├── hero-button-arrow.svg
    ├── arrow-design.svg
    ├── iphone-17-pro-silver.png
    ├── lgpsm-background-base.png
    ├── lgpsm-hero-hover.png
    ├── try-your-idea-default.png
    ├── outdoor-video.mp4
    ├── beach-video.mp4
    ├── party-video.mp4
    ├── join-beta-logo.svg
    ├── join-beta-image.svg
    ├── join-beta-step.svg
    ├── join-beta-step-muted.svg
    ├── join-beta-check.svg
    ├── join-beta-role.svg
    ├── login/
    │   ├── background.svg
    │   ├── close.svg
    │   └── google.svg
    └── tryon/
        ├── background.png
        ├── upload-grid.svg
        ├── image-icon.svg
        ├── try-now-icon.svg
        ├── phone-frame.svg
        ├── genimg-loading.svg
        ├── model.png
        ├── person-1.png ... person-4.png
        └── clothes-1.png ... clothes-4.png
```

The exact asset directory may contain additional legacy files. Ignore them unless needed. Keep all image/video URLs rooted at `/images/...` so Vite serves them from `public`.

---

## Visual language and reusable tokens

The interface is editorial/minimal, white or warm off-white, black typography, fine gray borders, and small neon-green feedback only in focus/loading states. It should feel like a fashion-tech product: high whitespace, clear typography, restrained borders, sharp 2px controls, 8px inner radius, 16px outer radius.

Create these root CSS variables and build components from them:

```css
:root {
  --color-ink: #080d14;
  --color-muted: #475569;
  --color-border: #cbd5e1;
  --color-surface: #f1f5f9;
  --color-page: #f8fafc;
  --color-upload: rgba(217, 234, 255, .3);
  --color-upload-hover: rgba(217, 234, 255, .46);
  --color-focus: #22c55e;

  --radius-control: 2px;
  --radius-inner: 8px;
  --radius-outer: 16px;

  --font-body: 'Poppins', sans-serif;
  --font-display: 'Playfair Display SC', serif;

  --pad-x: clamp(1.25rem, 4.5vw, 5rem);
  --pad-y: clamp(1rem, 3vh, 4rem);
  --header-pt: clamp(1.25rem, 2.5vh, 2.5rem);
  --header-pb: clamp(1rem, 2vh, 1.75rem);
  --gap-nav: clamp(1rem, 2.2vw, 2.25rem);
  --nav: clamp(.65rem, .35vw + .5rem, .875rem);
  --body: clamp(.7rem, .35vw + .55rem, .9rem);
  --btn-px: clamp(1.15rem, 1.4vw, 1.75rem);
  --btn-py: clamp(.6rem, .9vh, .85rem);
  --btn-gap: clamp(.75rem, 1vw, 1.1rem);
  --corner: clamp(.65rem, .4vw + .4rem, .95rem);
  --icon: clamp(1rem, .6vw + .7rem, 1.35rem);
}
```

### Shared primitives

1. **Corner ornament**: make a reusable `Corner` component that draws one L-shaped SVG line. It supports `tl`, `tr`, `bl`, and `br`. Use it on the hero CTA cluster, core-function menu rows, and Try-On tool tabs.
2. **Primary button**: dark ink background, white uppercase text, 1px ink border, 2px radius, 44px minimum height, Poppins semibold, `.18em` tracking. Hover changes background to dark gray; supports an inverted white arrow asset.
3. **Secondary button**: white surface with gray border; hover becomes dark ink with white text.
4. **Focus style**: form controls use `--color-focus`; do not rely on color alone for focus.
5. **Motion style**: short controls transition at `.2–.3s`; product preview transitions are `.56–.9s` with `cubic-bezier(.22, .61, .36, 1)`.

---

## Application structure

Use a single `App` that conditionally renders either:

- Homepage (`/`); or
- Join Beta form page (`/join-beta`).

Use `window.history.pushState` and `popstate` rather than adding React Router. On the home page, maintain state for:

- active core-function tab (0–3), default 0;
- whether Login dialog is open;
- whether the Core Functions section is intersecting;
- refs to Core Functions and Try-On sections for smooth scrolling.

Use an `IntersectionObserver` around threshold `0.6` to enable the Core interactive grid only when Core Functions is visible. When Login is open, close with Escape and lock body scroll. Main hero navigation has `JOIN BETA`, `TRY FREE`, and a circular profile icon button.

Use full-viewport / scroll-snap-like sections. On desktop, the app uses a custom wheel behavior that scrolls between hero and Core Functions. Preserve a smooth, intentional section-based experience, but do not make keyboard navigation inaccessible.

---

## 1. Global image-reveal background

Behind the hero, render a fixed full-viewport decorative background:

1. Base layer: `/images/lgpsm-background-base.png` at cover/center.
2. Reveal layer: `/images/lgpsm-hero-hover.png` at cover/center.
3. A `requestAnimationFrame` canvas computes a soft radial gradient mask that follows the mouse with smoothing. Apply the generated data URL as both `mask-image` and `-webkit-mask-image` to the reveal layer.
4. Add a subtle SVG grid overlay (roughly 48px cells, low-opacity slate lines). Let the grid position drift slightly according to smoothed pointer position.
5. This entire visual layer is `pointer-events: none` and hidden or simplified naturally on smaller screens.

Ensure cleanup of animation frames and event listeners.

---

## 2. Fixed header and hero

### Header

Fixed, top, full width, high z-index. Transparent; no frosted treatment.

- Left: `/images/full-logo.svg`, about 169px wide, links to `#hero-section`.
- Right navigation: `JOIN BETA`, `TRY FREE`, circular profile button with `UserRound` from Lucide.
- Text uppercase with `.2em` tracking.
- Mobile: reduce logo to at most 42vw, smaller nav font and gap, keep all controls usable.

### Hero section

A full viewport section with responsive two-column layout on desktop and vertical layout on mobile.

- Left content:
  - top-left Corner ornament
  - `/images/lgpsm-hero-logo.svg` (alt: `Future Forward Fashion`)
  - exact copy: `From imagination to stunning visuals in seconds. Create, edit, and restyle with effortless AI.`
  - bottom-left Corner ornament
  - Buttons: `JOIN BETA` and `TRY FREE`, each containing `/images/hero-button-arrow.svg`.
- Right/bottom exploration button:
  - four Corner ornaments
  - `/images/lgpsm-feature-icon.svg`
  - uppercase `EXPLORE CORE FUNCTION`
  - clicking scrolls smoothly to Core Functions.

---

## 3. Core Functions section

Create a full-height section titled:

```text
Everything
You Need to Create
```

Desktop layout: two columns, left roughly 588px and right media area, with a large responsive gap. Mobile stacks.

### Left column

- Four vertical tab buttons in this exact order:
  1. `OUT DOOR`
  2. `GO TO BEACH`
  3. `PARTY`
  4. `TRY YOUR IDEA`
- Each tab is a full-width, minimum 79px button with four Corner ornaments, label, and `/images/arrow-design.svg` at the end.
- Active tab: ink background, white text and inverted arrow.
- Hover/focus tab: pale slate background; icon slides 3px right.
- Tabs use `role="tablist"`, `role="tab"`, and `aria-selected`.
- Below, show these benefits:
  - Keep your real face and identity.
  - Edit only what you choose.
  - Natural, realistic results every time.
  - No prompts. No complex settings. Just tap and create.
  - Professional-quality images in seconds.

### Right media

- Intro copy: `Create, edit and transform stunning images with powerful AI Slora—all in one click.`
- Phone stage: 330×684px on regular desktop.
- Place `/images/iphone-17-pro-silver.png` as the visual phone frame and a clipped 301.86×651.43px inner screen with 37px radius.
- For tabs 0–2, play/mute/loop appropriate videos:
  - outdoor-video.mp4
  - beach-video.mp4
  - party-video.mp4
- For tab 3, show `/images/try-your-idea-default.png` instead of video; clicking the tab also smooth-scrolls to the Try-On section.
- When active video changes, call `load()` then attempt `play()` safely.

### Core interactive grid

When Core Functions section is visibly active, display a fixed background grid underneath content:

- 24 columns and 76px grid rows on desktop; 14 columns and 62px rows below 1024px.
- About 480 tiles; off-white background; small radius; subtle border and inset light.
- Pointer movement uses `requestAnimationFrame` to calculate distance to every tile. Nearby tiles lift up to approximately 42px, scale up to 1.095, tilt around X/Y, and brighten their surface/border.
- Add a blurred pale lavender spotlight centered on pointer.
- Use `will-change` only on animated properties, clean event listeners, and disable all movement in `prefers-reduced-motion`.

---

## 4. Try-On product section

Use a full-height off-white section with `/images/tryon/background.png` as a full-bleed decorative background. Name the main region `Try-on tools`.

### Tool tab strip

Top centered (desktop padding top around 110px), max width 668px. Three equal 48px-height tabs:

- `TRY-ON` (default active)
- `MAGIC EDITOR`
- `AI STUDIO`

Use the same Core Function tab visual language but horizontal: Poppins semibold uppercase, `.18em` tracking, four Corner ornaments. Active = ink/white. Hover = pale slate. Keep all three labels on one line; mobile gap 8px and smaller type/tracking.

Description directly underneath:

- Try-On: `See yourself wearing dresses, streetwear, bikinis, formal wear and more.`
- Magic Editor: `Remove objects, replace backgrounds, change outfits or enhance every detail`
- AI Studio: use the Try-On description unless product requirements supply a distinct copy.

Switching tools must reset preview generation/loading to default.

### Geometry tokens

Define local variables on `.tryon-layout`:

```css
--tryon-control-width: 370px;
--tryon-card-height: 308px;
--tryon-stack-gap: 16px;
--tryon-action-height: 48px;
--tryon-content-height:
  calc((var(--tryon-card-height) * 2) +
       (var(--tryon-stack-gap) * 2) +
       var(--tryon-action-height));
```

Desktop: controls begin about 16.25vw from left; preview overlaps/positions to the right. Keep controls, preview, and model illustration aligned to the same content-height system. Under 1024px, stack/collapse the section; under 480px change card height to 280px and scale preview to avoid overflow.

### Try-On default controls

Render a vertical 370px-wide stack:

1. Upload person card, 370×308px.
2. Upload cloths card, 370×308px.
3. 229px-wide `TRY NOW` primary button, exactly 48px high, with `/images/tryon/try-now-icon.svg`.

Each upload card:

- is a clickable `<label>` with hidden PNG/JPEG input;
- uses `/images/tryon/upload-grid.svg` at 20% opacity;
- has 16px outer radius, pale blue upload surface, hover raise 2px;
- uses a 91×91px faded `/images/tryon/image-icon.svg` surface;
- labels are `Upload person` and `Upload Cloths`;
- helper is `jpeg, png formats up to 5Mb`;
- sample thumbnail row is 281×70px, four thumbnails with 8px gaps;
- person samples use `person-1.png` through `person-4.png`, contained;
- clothing samples use `clothes-1.png` through `clothes-4.png`, covered.

When an image is selected, display it in its card. Move the title to a dark translucent bottom label `Change image`. Store image preview URL state at the parent Try-On section, revoke the old object URL when replaced, and revoke remaining URLs on unmount.

### Magic Editor controls

When Magic Editor is active:

- Keep the Upload person card as card 1.
- Replace Upload Cloths card with a `MagicPromptCard` sized 370×308px.
- Prompt card: pale upload surface, 8px padding/radius; inner textarea has 16px horizontal padding, 16px / 24px light Poppins, placeholder `prompt here`, no resize, focus inset green ring.
- Bottom control row:
  - label `Size` with select options `1:1` default, `4:5`, `16:9`;
  - label `Quality` with select options `1` / `2` default / `3`.
- Retain TRY NOW button.

### AI Studio controls

When AI Studio is active:

- show only a prompt card plus TRY NOW;
- hide both upload cards;
- prompt card fills available controls height minus 48px action and 16px gap;
- controls stack remains the same overall content height;
- retain the exact 48px TRY NOW button.

### Try-On model

Render `/images/tryon/model.png` as an independent illustration layer (not as a child of preview). It is decorative/aria-hidden.

- Regular visual size max 274×411px.
- Desktop aligns around the preview’s right/lower region and ends at `bottom: -80px` relative to its illustration container.
- Mobile use an overlapping relative model illustration; ensure it does not create a large unexpected gap.
- Do not render a Try-On model shadow asset in this section.

### Preview and loading behavior

Default preview contains `/images/tryon/phone-frame.svg`, positioned with a natural 3D perspective:

```css
perspective(1200px) rotateY(-18deg) rotateZ(-4deg)
translate3d(0, 0, 0) scale(.985)
```

It has a soft drop shadow. On loading, remount the preview based on active tool/state so animations reliably restart.

When TRY NOW triggers loading:

1. Preview moves from angled position to head-on card over about `.9s`:
   - rotateY -18° → 0°
   - rotateZ -4° → 0°
   - moves modestly forward (`translateZ(28px)`) and upward about 4px
   - scale .985 → 1.015
   - use cubic-bezier `(.22, .61, .36, 1)` and include an intermediate rotation (about -7° Y / -1.5° Z) for depth.
2. The loading frame fills preview content height and has 24px border radius.
3. Its inside is white with a 28px square grid pattern (fine ink lines at about 6% opacity).
4. If user uploaded a person image, show it inside the loading frame; otherwise use uploaded clothing image; otherwise use `/images/tryon/genimg-loading.svg`.
5. Uploaded loading image uses `object-fit: cover`, approximately `blur(12px) saturate(.85) brightness(.82)`, and `scale(1.06)`.
6. Apply glass depth with a light border/shadow/backdrop blur without obscuring the image completely.
7. Disable button while loading. Changing any tool tab resets loading to false.

### Premium green border particle

In loading state, create a green light particle that visibly travels clockwise around the rounded edge rather than making the full border glow.

Required implementation details:

- frame variables:

```css
--loading-border-radius: 24px;
--loading-border-color: rgba(148, 163, 184, .26);
--loading-light: #00ff6a;
--loading-light-soft: rgba(0, 255, 106, .42);
--loading-speed: 2.5s;
--tryon-light-angle: 0deg;
```

- Register `@property --tryon-light-angle` as `<angle>`.
- Build the main particle with a masked conic-gradient inside a 2px border ring: bright near-white-green head, green head, soft green tail, transparent remainder.
- Build a larger masked conic-gradient underneath with 8px padding and `filter: blur(9px)` for local glow.
- Animate `--tryon-light-angle` 0deg to 1turn linearly/infinite to prevent visible jump.
- Add modest opacity pulse to both layers.
- Use `translateZ(0)` and narrowly scoped `will-change`; do not animate large box shadows.
- Stop particle, glow, shimmer, and 3D animations under `prefers-reduced-motion`.

---

## 5. Login overlay

Clicking `TRY FREE` opens a centered modal dialog:

- dim/blur backdrop;
- panel width up to 592px, min height about 520px, page background, drop shadow;
- background decoration `/images/login/background.svg`;
- close button 48×48px with `/images/login/close.svg`;
- `/images/full-logo.svg` and copy: `Sign in now for free generate`;
- Google sign-in button with `/images/login/google.svg`;
- `or`; heading `Continue with email`;
- email and verification-code fields;
- `SIGN IN` primary button;
- legal paragraph linking to User Service Agreement and Privacy Policy;
- close through button, backdrop click, or Escape.

---

## 6. Join Beta page

`/join-beta` replaces the homepage without page reload. It has a page background, large centered `/images/join-beta-logo.svg`, fixed home logo button, and decorative fixed model at desktop right (using `/images/tryon/model.png`; model shadow may remain only on this page if asset exists).

Build a centered form (max width around 684px) with four visual question blocks:

1. **What best describes you?**
   - single-select chip list:
   - Fashion Brand Owner, Online Seller, Marketing Agency, Content Creator, Photographer, Designer, E-commerce Team, Retail Store Manager.
2. **What are you hoping to achieve with AI-generated fashion images?**
   - multi-select rows:
   - Create model photos without hiring models
   - Change clothing on existing photos
   - Generate product marketing content
   - Create social media posts faster
   - Build lookbooks and catalogs
   - write what you want
3. **If you could magically automate one task, what would it be?**
   - textarea with this placeholder: `"Upload a clothing photo and instantly generate 20 realistic model images for different body types and poses."`
4. **Upload an example (Optional but highly valuable)**
   - PNG/JPEG file input, preview and filename.

Use small numbered state badges: muted is pale surface/gray border; complete is ink with white text/icon. Selected chips/rows have clear ink border/background treatment. Add thank-you text, `TAKE FREE NOW` primary button, and reward copy:

```text
You'll receive:
5 time Generate now
Early Access Invitation at Launch
```

Form submit prevents navigation. On screens at or below 1024px hide the fixed side model; at <=640px collapse offsets so controls become full width.

---

## Responsive and quality requirements

- Desktop breakpoint: `min-width: 1024px` for overlapping Try-On preview/model and two-column Core layout.
- Tablet/mobile breakpoint: `max-width: 1023px`; Core stacks, Try-On adapts to one column.
- Small mobile: `max-width: 480px`; reduce card heights to 280px, preserve tab labels in one line, and visually scale expensive preview stage if necessary.
- Header adjustments around <=640px.
- For short desktop screens (`max-height: 760px`), scale phone stage and reduce Core vertical padding while preserving hierarchy.
- Ensure no horizontal overflow at 320px.
- All files must be UTF-8.
- Do not broad-format unrelated source or introduce generated/minified files.

---

## Acceptance checklist

Before finishing, run:

```bash
npm run build
npm run lint
```

Both must pass.

Manually verify:

1. Hero CTA opens login / Join Beta correctly.
2. Core tabs change the displayed video/image; TRY YOUR IDEA scrolls to Try-On.
3. Try-On tabs correctly switch between two uploads, person+prompt, and prompt-only layouts.
4. AI Studio shows prompt + TRY NOW and prompt consumes the available control height.
5. Image upload preview works; old object URLs are revoked.
6. TRY NOW starts a loading preview. Uploaded person image takes precedence over clothing image and appears blurred in loading state.
7. Changing tool while loading returns preview to default angled phone frame.
8. Green border particle visibly runs clockwise around the loading frame on a white grid background.
9. Layout remains usable at 1440px desktop, 1024px tablet, 768px tablet, and 375px mobile.
10. Reduced motion removes continuous/interpolated motion without damaging layout.

Output clean, production-ready source files and briefly report build/lint results.
