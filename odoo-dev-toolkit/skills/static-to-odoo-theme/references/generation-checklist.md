# Generation Checklist

Walk this list before declaring the generated theme module ready. Every item is a real bug caught in practice — none of these are hypothetical.

## Manifest

- [ ] `name` is human-readable, starts with "…Theme" or similar
- [ ] `version` is `18.0.X.Y.Z`
- [ ] `category` is `Website/Theme`
- [ ] `depends` includes `website` (and `website_sale` if there's a product catalog)
- [ ] `data` list contains ALL XML and CSV files used by the module
- [ ] `data` list order: data files → layout → individual snippets → snippet registry → pages
- [ ] `assets: {}` is empty — all SCSS/JS is registered via `theme.ir.asset` records, NOT via the manifest
- [ ] `installable: True`
- [ ] `license` is set

## File structure

- [ ] Module directory name starts with `theme_`
- [ ] `__init__.py` at root imports `models`
- [ ] `models/__init__.py` imports the post-copy hook module
- [ ] `views/layout.xml` exists
- [ ] `views/pages.xml` exists
- [ ] `views/snippets/snippets_registry.xml` exists
- [ ] `views/snippets/s_*.xml` exist — one per snippet in the static bundle
- [ ] `data/ir_asset.xml` exists
- [ ] `static/src/scss/` contains all six SCSS files (even if bootstrap_overridden is nearly empty)

## Templates — no `<data>` wrapper mistake

- [ ] `views/layout.xml` — `<template>` tags directly under `<odoo>`, NO `<data>` wrapper (only templates in this file)
- [ ] `views/snippets/snippets_registry.xml` — `<template>` directly under `<odoo>`, NO `<data>` wrapper
- [ ] `views/snippets/s_*.xml` — `<template>` directly under `<odoo>`, NO `<data>` wrapper
- [ ] `views/pages.xml` — MUST have `<data>` wrapper (mixes `<template>` and `<record>`)
- [ ] `data/ir_asset.xml` — MUST have `<data>` wrapper (only `<record>` elements)
- [ ] `data/website_menu_data.xml` — MUST have `<data noupdate="1">` wrapper

## Snippet registration

- [ ] Every snippet file uses `<t t-snippet="theme_<brand>.s_x" t-thumbnail="..."/>` — NOT `<snippet t-snippet>`
- [ ] The registration template inherits `website.snippets` with xpath `//snippets[@id='snippet_structure']` position=`after`
- [ ] Snippets are wrapped in `<snippets id="<brand>_snippet_structure" string="<Brand>">`
- [ ] NO custom `data-selector`, `data-drop-in`, `data-drop-near` attributes — Odoo's built-in section rule handles them

## Snippet content

- [ ] Each snippet outer element is a `<section>` (NOT a `<div>`) — ensures built-in drop-zone rule picks it up
- [ ] Each outer `<section>` has classes `s_<snippet_id> o_cc o_cc<N> theme_<brand>_page`
- [ ] Image `src` attributes start with `/theme_<brand>/static/src/img/...`
- [ ] CSS `background-image: url(...)` references inside snippet style attributes also start with `/theme_<brand>/static/src/img/...`
- [ ] No `<script>` tags embedded in snippet templates (scripts go in `static/src/js/main.js` via `theme.ir.asset`)

## Layout inheritance

- [ ] `views/layout.xml` adds the body class via `<xpath expr="//body" position="attributes">` with `add="theme_<brand>_body"`
- [ ] Header XPath uses `//header//nav` with position=`replace` (NOT `inside`, NOT `after`)
- [ ] Footer XPath uses `//div[@id='footer']` with position=`replace`
- [ ] Hardcoded menu links replaced with `t-foreach="website.menu_id.child_id"`
- [ ] Copyright year uses `<t t-esc="datetime.date.today().year"/>`

## Pages

- [ ] Every page template uses `<t t-call="website.layout">`
- [ ] Every page has `<div id="wrap" class="oe_structure oe_empty theme_<brand>_page">` — the `theme_<brand>_page` class is REQUIRED
- [ ] Each page `t-call`s the snippets that compose it
- [ ] `theme.website.page` record has `url`, `view_id`, `is_published=True`
- [ ] Homepage record has `url="/"`
- [ ] No `key` field on `theme.website.page` records (field doesn't exist)

## Post-copy hook

- [ ] `models/theme_<brand>.py` defines an `AbstractModel` inheriting `theme.utils`
- [ ] Method name matches `_theme_<brand>_post_copy` — Odoo looks up by convention
- [ ] Hook deletes default `website.homepage` records at `url="/"`
- [ ] Hook enables custom header/footer/body-class layout templates if they have `active="False"` by default

## Assets

- [ ] `data/ir_asset.xml` uses `theme.ir.asset` model (NOT `ir.asset`)
- [ ] `primary_variables.scss` → bundle `web._assets_primary_variables`
- [ ] `bootstrap_overridden.scss` → bundle `web._assets_frontend_helpers`
- [ ] `theme.scss`, `header.scss`, `footer.scss`, `responsive.scss` → bundle `web.assets_frontend`
- [ ] `main.js` → bundle `web.assets_frontend`
- [ ] SCSS asset records declared in the correct order (responsive LAST in frontend bundle)
- [ ] **Every `theme.ir.asset` record has explicit `<field name="sequence">`**: theme=100, header=110, footer=120, responsive=200. Without this, responsive overrides can load before desktop rules and be silently ignored.

## SCSS — editor-safe sweep

- [ ] `grep -rn 'transition:.*,' static/src/scss/` returns NOTHING with commas outside `cubic-bezier()`
- [ ] `grep -rnE 'box-shadow:[^;]*\),[^;]*\(' static/src/scss/` returns nothing (multi-layer shadow)
- [ ] `grep -rnE 'filter:.*\).*\(' static/src/scss/` returns nothing (multi-layer filter)
- [ ] No `:has()` selector anywhere
- [ ] No `@import url(...)` for fonts
- [ ] No `@font-face` with `src: url(...)` pointing at theme-relative font files (fonts declared in layout.xml instead)

## SCSS — color variable safety (CRITICAL)

- [ ] `grep -rn 'var(--o-color-' static/src/scss/theme.scss static/src/scss/header.scss static/src/scss/footer.scss` returns NOTHING — no `var(--o-color-X)` in component SCSS
- [ ] `grep -rn 'var(--o-color-' views/` returns NOTHING — no `var(--o-color-X)` in inline XML styles
- [ ] All brand colors defined as fixed SCSS variables (`$brand-white`, `$brand-accent`, etc.) at the top of each SCSS file
- [ ] Cards, buttons, headings, badges, form inputs, icon circles all use fixed SCSS variables for foreground/background — never `var(--o-color-X)`

**Why this matters:** `var(--o-color-1)` through `var(--o-color-5)` get reassigned when users change colors in Theme panel. Using them for component styling causes silent contrast breakage (e.g., white card becomes dark → dark text on dark background). See `odoo-theme/references/theme-scss-architecture.md` → "CRITICAL: var(--o-color-X) vs Fixed SCSS Variables".

## Offcanvas mobile menu

- [ ] If using Bootstrap offcanvas for mobile menu: all `<a>` inside offcanvas body have `data-bs-dismiss="offcanvas"` attribute
- [ ] Header SCSS includes stacking context fix: `transform: none !important; will-change: auto !important;` on `#wrapwrap header#top`, `.o_header_standard`, `.o_header_affixed`
- [ ] Header SCSS includes `overflow: visible !important` on header elements and nav

## Hidden form fields

- [ ] If any snippet uses `s_website_form`: theme.scss includes `.s_website_form_dnone { display: none !important; }`

## SCSS — CSS Grid + clearfix guard

- [ ] Every element with `display: grid` in SCSS that also has `.container` class in HTML (or sits inside `.container` inside `#wrap`) includes `&::before, &::after { display: none; }` — Odoo's `#wrap .container::before/::after` clearfix pseudo-elements break grid layouts by becoming invisible grid items

## One-page navigation — scroll spy

- [ ] If the site is a one-page layout (menu links use `/#section-id` anchors), the SCSS neutralizes Odoo's `.active` class on nav links (renders same as non-active) to prevent all links lighting up simultaneously
- [ ] A custom scroll spy class (e.g. `.gl-scrollspy-active`) is defined in `header.scss` with the accent color
- [ ] `main.js` includes a `publicWidget` scroll spy widget using IntersectionObserver that applies the custom class based on which section is in the viewport
- [ ] The scroll spy widget stores arrays of links per section (not single links) to handle desktop + mobile nav duplicates
- [ ] A smooth-scroll companion widget is included for anchor click handling

## SCSS — logo image filter

- [ ] `header.scss` does NOT apply `filter: brightness(0) invert(1)` to `.navbar-brand img` — this destroys multi-colored logos. If a light logo variant is needed, use a separate image file instead.

## SCSS — dual-scope

- [ ] `theme.scss` rules are wrapped in `.theme_<brand>_page, body.theme_<brand>_body #wrap { ... }`
- [ ] `responsive.scss` media queries are wrapped in the same dual-scope
- [ ] `header.scss` is NOT dual-scoped (targets `#wrapwrap > header` directly)
- [ ] `footer.scss` is NOT dual-scoped (targets `#wrapwrap > footer` or `#wrapwrap #footer` directly)
- [ ] `primary_variables.scss` contains ONLY `$variable` definitions — no selectors
- [ ] `bootstrap_overridden.scss` contains ONLY `$variable` definitions — no selectors

## Images

- [ ] Every image referenced in snippets exists in `static/src/img/`
- [ ] No references to `_next/static/media/<hash>.jpg` (should have been rewritten to human-readable names)
- [ ] Snippet thumbnails exist at `static/src/img/snippets/s_*.png` (or wherever `t-thumbnail` points)
- [ ] `static/description/icon.png` exists

## Menu data

- [ ] `data/website_menu_data.xml` uses `theme.website.menu` (NOT `website.menu`)
- [ ] Menu records have `name`, `url`, `sequence`
- [ ] Sequences are spaced (10, 20, 30) so the user can insert items later

## CSS class prefix consistency

- [ ] All custom CSS classes use a consistent prefix (e.g., `gl-` for Gelato, `et-` for Elite Trafika)
- [ ] No bare class names like `.accent` that conflict with Odoo built-ins or are referenced as `.gl-accent` in JS/HTML — grep for orphaned unprefixed classes:
  ```bash
  # Find unprefixed classes in SCSS that might be referenced with prefix in HTML/JS
  grep -n '\.\(accent\|badge\|card\|icon\|btn\|nav\|hero\)' theme_<brand>/static/src/scss/theme.scss
  ```
- [ ] Cross-check: every class used in JS `createElement`/`className` assignments exists in SCSS with the same name

## Asset cache rebuild

- [ ] **Never** use `DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%'` to clear asset cache
- [ ] Use `?debug=assets` URL parameter in the browser to trigger asset rebuild after SCSS/JS changes
- [ ] After module upgrade (`-u theme_<brand>`), assets are rebuilt automatically on next page load

## Admin menu placement

- [ ] Admin menu items use `parent="website.menu_website_global_configuration"` (NOT `website.menu_website_configuration`)
- [ ] Verify menus appear under Website > Configuration in the backend

## Dynamic content (if applicable)

- [ ] RPC controller returns `image_url` using `/web/image/<model>/<id>/<field>` pattern
- [ ] JS widget has `disabledInEditableMode: true`
- [ ] Security CSV has public read-only + designer full access rows
- [ ] Seed data uses `noupdate="1"` so admin edits survive upgrades
- [ ] Seed images use `type="base64" file="theme_<brand>/static/src/img/..."` syntax

## Smoke install test

Before handing off:

1. [ ] `docker compose stop web`
2. [ ] `docker compose run --rm -T web odoo -i theme_<brand> --stop-after-init -d <db>`
3. [ ] No errors in the install log
4. [ ] `docker compose start web`
5. [ ] Open Website → verify homepage renders
6. [ ] Open every page in the menu
7. [ ] Open the editor (Edit button), drag each snippet from the sidebar
8. [ ] Click each dropped snippet — no `Cannot convert 'px,' units` crash
9. [ ] Create a new page from the website menu → verify it gets theme styles (dual-scope working)
10. [ ] Translate a snippet text in the editor — save, reload, verify persistence

If any step fails, fix and re-run. The `odoo-docker-dev` skill has the full debug loop documented.
