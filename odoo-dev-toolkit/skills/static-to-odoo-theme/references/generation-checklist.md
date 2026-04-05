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

## SCSS — editor-safe sweep

- [ ] `grep -rn 'transition:.*,' static/src/scss/` returns NOTHING with commas outside `cubic-bezier()`
- [ ] `grep -rnE 'box-shadow:[^;]*\),[^;]*\(' static/src/scss/` returns nothing (multi-layer shadow)
- [ ] `grep -rnE 'filter:.*\).*\(' static/src/scss/` returns nothing (multi-layer filter)
- [ ] No `:has()` selector anywhere
- [ ] No `@import url(...)` for fonts
- [ ] No `@font-face` with `src: url(...)` pointing at theme-relative font files (fonts declared in layout.xml instead)

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
