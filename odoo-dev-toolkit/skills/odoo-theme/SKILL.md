---
name: odoo-theme
description: |
  Create complete Odoo 18 website themes with snippets, pages, SCSS architecture, header/footer customization, color palettes, and optional data modules (pricing, schedule, etc.). Use this skill when the user wants to build a new theme, create a theme module, customize website appearance, design header/footer, set up color palettes, create snippet-based homepage, or build a complete branded website in Odoo 18. Covers the full theme development lifecycle — from directory structure and manifest to SCSS variables, snippet registration, page creation, layout inheritance, responsive design, and companion data modules.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "vytvoř téma", "nové téma", "Odoo téma", "theme modul", "šablona webu", "vzhled webu", "header", "footer", "záhlaví", "zápatí", "barevná paleta", "snippety", "homepage", "úvodní stránka", "responzivní design", "SCSS", "styly", "ceník modul", "rozvrh modul", "datový modul pro web", "vytvořit web pro Odoo", "branded web", "firemní web v Odoo".
version: 0.1.0
---

# Odoo 18 Theme Creator

Creates complete, production-ready Odoo 18 themes with proper architecture, SCSS system, snippets, pages, and optional companion data modules.

## Before you start

Read the reference files in `references/` directory:
- **theme-structure.md** — Module structure, manifest, asset registration, theme copy mechanism
- **theme-scss-architecture.md** — SCSS variables, palettes, Bootstrap overrides, component styles, responsive design
- **theme-layout-snippets.md** — Header/footer inheritance, snippet patterns, page patterns, snippet registration
- **theme-data-modules.md** — Companion module patterns (pricing, schedule, etc.) with models, controllers, templates
- **theme-countdown-newsletter-particles.md** — Countdown page, newsletter (mailing integration), snippet editor options (datetimepicker), canvas particles with bokeh effect
- **theme-hero-animations-ios.md** — Layered hero animations, iOS crash prevention, editor DOM persistence resilience, WebGL safety, memory leak patterns

## Core Principles

1. **Theme auto-conversion** — `<template>` in `theme_*` modules auto-creates `theme.ir.ui.view`, NEVER use `ir.ui.view` or `ir.asset` directly
2. **SCSS-first styling** — All styles through SCSS variables, palettes, and component files; never inline CSS for repeating patterns
3. **Odoo color system** — Use `o_cc` color classes and palette definitions in `primary_variables.scss`
4. **Snippet-driven content** — Homepage built from draggable snippets, NOT hardcoded page templates
5. **Responsive by default** — Mobile-first breakpoints at 991px (tablet), 767px (mobile)
6. **Data modules separate** — Dynamic content (pricing, schedules) lives in standalone modules with models + controllers + templates
7. **Convention over configuration** — Follow Odoo 18 naming, file placement, and inheritance patterns exactly

## Workflow

### Step 1: Understand the project

Ask or determine:
- **Brand name** and technical module name (e.g., "My Fit" → `theme_myfit`)
- **Brand colors** — primary, secondary, accent, dark, light
- **Typography** — heading and body fonts (Google Fonts available in Odoo)
- **Pages needed** — homepage, about, contact, pricing, schedule, etc.
- **Snippets needed** — hero, about, studios/services, pricing preview, schedule preview, CTA, contact, events
- **Dynamic data modules** — does the client need editable pricing tables, class schedules, etc.?
- **Language** — primary language, translations needed?

### Step 2: Create theme module structure

Use the pattern from `references/theme-structure.md`:

```
theme_brandname/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── theme_brandname.py          # Post-copy hooks
├── views/
│   ├── layout.xml                   # Header + footer inheritance
│   ├── pages.xml                    # Website pages (theme.website.page)
│   ├── images_library.xml           # Theme image library (theme.ir.attachment)
│   └── snippets/
│       ├── snippets_registry.xml    # Centralized snippet registration
│       ├── s_hero_banner.xml
│       ├── s_about_studio.xml
│       ├── s_pricing_preview.xml
│       └── s_*.xml                  # One file per snippet
├── data/
│   ├── generate_primary_template.xml
│   ├── ir_asset.xml                 # SCSS asset bundles (theme.ir.asset)
│   └── website_menu_data.xml        # Navigation (theme.website.menu)
└── static/src/
    ├── img/
    │   └── icons/                   # Snippet thumbnails (PNG)
    ├── scss/
    │   ├── primary_variables.scss   # Font + palette definitions
    │   ├── bootstrap_overridden.scss # Bootstrap variable overrides
    │   ├── theme.scss               # Main component styles
    │   ├── header.scss              # Header-specific styles
    │   ├── footer.scss              # Footer-specific styles
    │   └── responsive.scss          # Media queries
    └── js/
        ├── mobile_menu.js           # Mobile offcanvas handler
        └── tour.js                  # Theme welcome tour
```

### Step 3: Configure SCSS architecture

Use the pattern from `references/theme-scss-architecture.md`:

1. **primary_variables.scss** — Font registration + color palette via `o-website-values-palettes`
2. **bootstrap_overridden.scss** — Shadows, borders, button padding, font weight
3. **theme.scss** — Brand variables, section titles, buttons, cards, badges
4. **header.scss** — Sticky header, nav links, mobile menu, offcanvas backdrop
5. **footer.scss** — Footer grid, contact list, social icons
6. **responsive.scss** — Breakpoints for hero, cards, sections, typography

### Step 4: Create header and footer

Use the pattern from `references/theme-layout-snippets.md`:

- Inherit `website.layout` via `<template inherit_id="website.layout">`
- Header: Replace `header#top` content with custom navbar
- Footer: Replace `footer` div with custom footer grid
- Use `t-foreach` for menu iteration, `website.social_media_links` for socials
- Mobile: Bootstrap offcanvas moved to body via JS (avoids z-index/transform conflicts)

### Step 5: Create snippets

Use the pattern from `references/theme-layout-snippets.md`:

For each snippet:
1. Create `views/snippets/s_name.xml` with `<template>` tag
2. Add to `snippets_registry.xml` with thumbnail
3. Add to `__manifest__.py` data list
4. Create thumbnail PNG in `static/src/img/icons/`

### Step 6: Create pages

Use the page pattern from `references/theme-layout-snippets.md`:

- Each page: `<template>` + `<record model="theme.website.page">`
- Wrap in `<data>` when mixing `<template>` and `<record>` in same file
- Set `url`, `view_id`, `is_published`
- Use `t-call="website.layout"` with optional `no_header`/`no_footer`

### Step 7: Create companion data modules (if needed)

Use the pattern from `references/theme-data-modules.md`:

For each data module (e.g., `brandname_pricing`, `brandname_schedule`):
1. Create module with models, views, security, controllers, templates
2. Models define the data structure (categories, items, classes, studios)
3. Controllers expose routes (`/pricing`, `/schedule`)
4. Templates render the frontend pages with QWeb
5. Data XML provides initial records
6. Theme module depends on data modules and creates preview snippets

### Step 8: Register assets and configure theme

1. SCSS → `theme.ir.asset` records in `data/ir_asset.xml`
2. JS → manifest `assets` dict
3. Menu → `theme.website.menu` records in `data/website_menu_data.xml`
4. Images → `theme.ir.attachment` records in `views/images_library.xml`
5. Post-copy hook → `models/theme_brandname.py` to enable/disable header/footer views

## Key Gotchas

- `<template>` in `theme_*` modules auto-creates `theme.ir.ui.view` — NEVER use `ir.ui.view`/`ir.asset`
- **NEVER** wrap `<template>` in `<data>` inside `<odoo>` when the file ONLY has templates — `<template>` goes directly under `<odoo>`. Only use `<data>` wrapper when mixing `<template>` with `<record>` elements.
- `theme.website.page` has NO `key` field
- `t-snippet-call` is NOT valid QWeb — use `t-call`
- Odoo JS strips custom classes from `header#top` at runtime — style via SCSS, not inline classes
- `'menu': 5` in palette = header uses `.o_cc5` via SCSS `@extend`
- `:has()` CSS selector NOT supported by Odoo's libsass compiler
- Image library must use `theme.ir.attachment` with `key` field
- For module reinstall: stop web first, use `docker compose run --rm -T web` to avoid serialization errors
- Snippet preview cards with static data are fine — dynamic content belongs in data modules with controllers

### Editor-safe CSS & scoping (hard-earned)

- **`Cannot convert 'px,' units into 'px' units` editor crash** — Odoo 18 editor's `ShadowOption` / `TransitionOption` / filter widgets split CSS values on commas and crash on any multi-value property the block is styled with. Triggers when the user clicks a styled block in the editor. **Rule: NEVER use comma-separated multi-value `box-shadow`, `transition`, or `filter` on any element that will appear inside a snippet drop zone.** Use `transition: all 0.3s ease`, a single `box-shadow` + a `::before`/`::after` pseudo for additional glow, and single-layer `filter`. See `references/theme-scss-architecture.md` → "Editor-safe CSS properties".
- **SCSS scope trap for editor pages** — If you scope theme styles under a page-level class (e.g. `.my-theme { ... }`), editor-created pages built from `website.new_page` won't have that class on their `#wrap` and will render unstyled. **Fix: always scope under both the hand-crafted class AND `body.my-theme-body #wrap`** so the same rules apply to editor pages. Add the body class via `<xpath expr="//body" position="attributes">` on `website.layout` — `#wrap` is NOT in `website.layout` and cannot be targeted via XPath there, it's only in individual page templates like `website.homepage`.
- **Snippet registration wrapper** — The correct element is `<t t-snippet="..." t-thumbnail="..."/>` inside `<snippets id="..." string="...">`. Do NOT use a `<snippet t-snippet="...">` wrapper and do NOT add custom `data-selector`/`data-drop-in`/`data-drop-near` rules for plain `<section>` snippets — Odoo's built-in `so_snippet_addition_selector` already covers `section, .parallax, .s_hr`. Custom rules conflict with the built-in rule and the editor shows "This block cannot be dropped anywhere on the page."
- **Editor detection** — Detect editor mode via URL path (`/website/preview`, `/odoo/`, `enable_editor=1`), NOT via iframe checks. Use it in inline `<script>` guards to skip heavy animations/preloaders in the editor.
- **Inline `<script>` for pre-bundle work** — Anything that must run before the lazy `web.assets_frontend` bundle loads (preloaders, audio primers, early click handlers) belongs in an inline `<script>` injected via `website.layout` XPath. Register global listeners BEFORE any `sessionStorage`-driven early-return or they won't attach on reloads within the same session.
- **GSAP `className` shorthand bug** — `className: '+=foo'` replaces the whole className instead of appending. Use `onComplete: () => el.classList.add('foo')` instead.
- **Asset bundle cache** — After editing SCSS/JS in an installed theme, old bundles linger in `ir.attachment`. Invalidate with `DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%'` + web restart, or append `?debug=assets` to a page URL.
- **Per-website view copies don't update on module upgrade** — When a theme is loaded onto a website, Odoo copies every `theme.ir.ui.view` into `ir.ui.view` with a `website_id` set (one copy per website). A subsequent `-u theme_x` updates the MASTER template but does NOT regenerate the existing per-website copies, so changes to snippet XMLs silently fail to appear on the live site. **Fix workflow:** `DELETE FROM ir_ui_view WHERE key LIKE 'theme_x.%' AND website_id IS NOT NULL;` then re-run `docker compose run --rm -T web python3 odoo-bin ... -u theme_x --stop-after-init` (this triggers `_load_theme` which recreates views from the updated templates). Follow with the asset bundle cache bust above. Symptom: old arch_db content still served for a specific website even though the module file and master view are correct.
- **`/shop?category=<slug>` breaks `website_sale`** — Odoo's shop controller (`addons/website_sale/controllers/main.py`, `Category.search([('id', '=', int(category))])`) calls `int()` on the `category` query arg and raises `ValueError: invalid literal for int() with base 10: 'cannabis'` for any slug-style link. For **real** category links use the actual `product.public.category` record ID (or better, the Odoo-generated `/shop/category/<slug>-<id>` URL). For **static preview cards** that should open a local modal, use `<button type="button" data-trafika-cat="cannabis">` instead of `<a href>`, and drive the modal from JS. Never ship `/shop?category=slug` links from a theme.
- **Client-side modal pattern for static category/product cards** — When a theme has "preview" cards for categories that should pop a list of products without navigating, the cleanest pattern is: (1) cards are `<button data-xxx-cat="key">`; (2) a reusable modal template is injected at body level via `inherit_id="website.layout"` with `<xpath expr="//body" position="inside">`; (3) JS reads `data-*` on click and populates the modal. For real product data + images, do NOT hardcode data in JS — emit a `<script type="application/json" id="theme-catalog-data">` from a QWeb template that iterates `env['product.template']` server-side, include the `id` in each product entry, and render `<img src="/web/image/product.template/{{id}}/image_512"/>` in JS. Avoids extra HTTP calls, avoids flicker, and lets content editors update images from the backend with no JS changes.
- **Simplified product admin without replacing Sales UI** — Clients often want a "Products" menu for content editors that shows only web-relevant fields (name, image, price label, badge, stock display, category) without exposing procurement/accounting/variants. Pattern: create a small companion module (e.g. `theme_x_web_catalog`) that (a) adds a few additive `Char`/`Integer` fields on `product.template` — never override existing fields; (b) defines `ir.ui.view` records with `priority=99` AND `mode="primary"` so they never hijack the native Sales list/form; (c) creates a dedicated `ir.actions.act_window` bound explicitly to those views via `ir.actions.act_window.view` records (priority shuffling in other modules can't steal them); (d) adds its OWN top-level `menuitem` (e.g. "Elite Trafika") restricted to a custom security group, SEPARATE from the Sales menu — admins still see both because `group_system` implies the custom group; (e) uses a `post_init_hook` reading a bundled `data/seed_products.json` to seed categories (`product.public.category`) and products idempotently (check-by-name). This keeps `website_sale` and all native e-commerce flows fully functional while giving non-admin staff a clean, minimal editing UI.

### Controller & API patterns (hard-earned)

- **`request.env.sudo()` does NOT exist in Odoo 18** — `Environment` has no `.sudo()` method. Always call `.sudo()` on the model recordset: `request.env['mailing.contact'].sudo()`. Writing `request.env.sudo()['model']` raises `AttributeError` at runtime but Odoo swallows it inside a JSON-RPC response — the only symptom is a generic error on the frontend. Check `docker compose logs web --tail=20` to see the real traceback.
- **JSON-RPC wrapper mandatory for `type='json'` controllers** — Frontend `fetch()` calls to `type='json'` Odoo controllers MUST send the JSON-RPC 2.0 envelope: `{ jsonrpc: "2.0", method: "call", params: { email } }`. Plain `{ email }` body silently fails — the controller receives all kwargs as `None`. Response is wrapped in `{ result: {...} }`, not bare JSON.
- **Newsletter: use `mailing.contact` + `mailing.subscription`, NOT custom models** — Creating a custom `newsletter_subscriber` model means subscribers won't appear in Odoo's Email Marketing app. Always write to `mailing.contact` + `mailing.subscription` (requires `mass_mailing` dependency). The controller should auto-create the `mailing.list` on first subscribe if it doesn't exist.
- **Asset bundle cache hides JS/SCSS changes** — After editing frontend JS or SCSS, the old compiled bundles stay in `ir.attachment`. Clear with: `docker compose exec -T db psql -U <user> -d <db> -c "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"` then `docker compose restart web`. Without this, the browser loads stale JS even after hard refresh (Cmd+Shift+R), because Odoo serves the cached bundle URL which hasn't changed.

### Frontend JS patterns (hard-earned)

- **`rpc` not `jsonrpc` in Odoo 18** — `@web/core/network/rpc` exports `rpc`, NOT `jsonrpc`. Writing `import { jsonrpc } from "@web/core/network/rpc"` silently fails because `jsonrpc` is `undefined`. If wrapped in try/catch (common in widgets), the `TypeError` is swallowed and the widget appears to do nothing. Always use: `import { rpc } from "@web/core/network/rpc"` + `await rpc('/route', {})`.
- **`publicWidget` RPC pattern for Odoo 18** — Frontend widgets that fetch data via RPC use: `import publicWidget from "@web/legacy/js/public/public_widget"` + `import { rpc } from "@web/core/network/rpc"`. Call `rpc('/route', {})` directly (no `this._rpc()` — that's Odoo 16 legacy). The function returns a Promise. Use `async/await` in widget methods.
- **Website editor saves JS-generated DOM — `destroy()` must clean up** — When a `publicWidget` dynamically creates elements (slides, dots, tabs), the website editor saves that DOM state on page save. `contenteditable="false"` on containers prevents text editing but does NOT prevent the editor from saving their innerHTML. The only reliable fix is a two-part cleanup:
  1. **`destroy()` must empty all JS-generated containers** — `disabledInEditableMode: true` calls `destroy()` when entering edit mode. This is the moment to wipe the DOM so the editor saves clean HTML.
  2. **`start()` must call `_cleanSavedState()`** — in case stale content was saved before the fix was deployed.
```js
start() {
    this._super(...arguments);
    this._cleanSavedState();
    return this._loadData();
},
destroy() {
    clearInterval(this.timer);
    if (this._observer) this._observer.disconnect();
    // Clean JS-generated DOM before editor saves
    const bg = this.el.querySelector('.container-bg');
    const content = this.el.querySelector('.container-content');
    const nav = this.el.querySelector('.container-nav');
    if (bg) bg.innerHTML = '';
    if (content) content.innerHTML = '';
    if (nav) nav.innerHTML = '';
    this.el.classList.remove('loaded-class');
    this._super(...arguments);
},
_cleanSavedState() {
    // Same cleanup as destroy — handles stale saved HTML
    this.el.classList.add('no-transition');
    this.el.classList.remove('loaded-class');
    const bg = this.el.querySelector('.container-bg');
    const content = this.el.querySelector('.container-content');
    const nav = this.el.querySelector('.container-nav');
    if (bg) bg.innerHTML = '';
    if (content) content.innerHTML = '';
    if (nav) nav.innerHTML = '';
},
```
- **Prevent double animation on page load** — If `start()` cleans saved state and then re-renders from RPC, the load animation plays twice (once from stale HTML, once from fresh). Fix: add a `no-transition` class in `_cleanSavedState()` that disables all animations via CSS `animation: none !important; transition: none !important;`. Remove it in a `requestAnimationFrame` after rendering, then add the `loaded` class to trigger the entrance animation once.
- **Editor-visible elements need `body.editor_enable` overrides** — Odoo 18 adds `editor_enable` to `<body>` inside the editor iframe. Elements with `opacity: 0` waiting for JS animation are invisible in edit mode. Fix with CSS:
```scss
body.editor_enable .my-logos,
body.editor_enable .my-fade-up {
    opacity: 1 !important;
    animation: none !important;
    transform: none !important;
}
```
  Use `!important` because theme styles are typically scoped under high-specificity selectors like `.theme_page, body.theme_body #wrap { ... }` which outrank `body.editor_enable .class`.
- **Entrance animation for RPC-loaded content** — When JS renders content from RPC (slides, cards), the first visible item should animate in. Use a one-shot CSS class (e.g. `gl-initial`) added by JS, with `animationend` listener to remove it:
```js
const firstSlide = this.contentSlides[0];
if (firstSlide) {
    firstSlide.classList.add('gl-initial');
    firstSlide.addEventListener('animationend', () => {
        firstSlide.classList.remove('gl-initial');
    }, { once: true });
}
```
  This prevents the entrance animation from replaying on every slide transition.

### Snippet options patterns

- **`we-datetimepicker`** stores epoch **seconds** (not ms) in `data-end-time` on the snippet element. Frontend JS must multiply by 1000: `parseInt(el.dataset.endTime) * 1000`.
- **Options JS goes in `website.assets_wysiwyg` bundle** (editor-only), NOT `web.assets_frontend`. Register via `theme.ir.asset` with `bundle=website.assets_wysiwyg`.
- **Options JS `updateUI` must sync derived attributes** — When the editor sets `data-end-time` (epoch) on a section, the options JS `updateUI` method must propagate it to child elements (e.g. `.ea-countdown[data-target]` as ISO string) so the frontend timer reads the updated value.

### Hero animations & iOS stability (hard-earned)

- **Editor DOM persistence** — Odoo editor saves inline `style` and `src` attributes on save. Any JS animation that sets `opacity`, `transform`, or `src` must be RESET on every `start()` via a `_resetLayers()` method. See `references/theme-hero-animations-ios.md`.
- **Stage scaling flash** — A fixed-size stage (1920x1080) scaled by JS flashes at full size on the first frame. Fix: CSS `opacity: 0` on stage, JS reveals AFTER `_scaleStage()`.
- **iOS GPU memory crash** — `will-change`, `mix-blend-mode`, `filter: drop-shadow`, WebGL, and infinite `setTimeout` loops each consume GPU RAM. On iOS they stack and crash the page. Detect mobile via `isLowEnd()`, disable GPU-heavy features via CSS `@media`, keep CSS transitions (they're cheap).
- **WebGL on mobile** — NEVER run WebGL on mobile/tablet. Threshold: `window.innerWidth <= 1024` OR touch device detection. Always handle `webglcontextlost`/`webglcontextrestored`.
- **`visibilitychange` is mandatory** — Pause all `requestAnimationFrame` loops and clear all `setTimeout` chains when `document.hidden`. iOS kills pages that consume GPU while backgrounded.
- **`fallbackTimer` temporal dead zone** — In `_preloadImages`, `img.complete` triggers callbacks synchronously during `forEach`. Declare `let fallbackTimer = null` BEFORE the loop, not `const` after it.
- **No `will-change` on animation layers** — 6 layers × 1920×1080 × `will-change: transform, opacity` = ~50 MB GPU RAM. One-shot CSS transitions don't need it.

### Performance patterns for canvas/animation

- **`prefers-reduced-motion: reduce`** → skip ALL canvas animations entirely. Never ignore this.
- **IntersectionObserver** to pause `requestAnimationFrame` loops when the animated section scrolls off-screen — prevents burning CPU/battery on invisible content.
- **30fps cap** via timestamp delta is sufficient for ambient effects (particles, bokeh). Full 60fps is wasted on slow-drifting elements.
- **Bokeh blur via `createRadialGradient`** (center opaque → edge transparent) is far cheaper than `ctx.filter = 'blur()'` which forces per-frame GPU compositing.
- **Mobile particle counts**: halve the count (e.g. 15 embers + 4 bokeh vs 30+7 desktop). Check `window.innerWidth < 768` at init time.
- **Canvas at 1x DPR** (no `devicePixelRatio` scaling) — particles are blurry blobs, retina resolution is wasted overhead.
