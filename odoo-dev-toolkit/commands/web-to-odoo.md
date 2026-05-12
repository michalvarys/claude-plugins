---
name: web-to-odoo
description: |
  Orchestrate the full migration of a legacy website (Next.js, generic HTML, or similar) into a working Odoo 18 theme + content-admin modules running in Docker. Walks through all four stages — static extraction, theme generation, admin bridge, and docker-based install/debug — invoking the relevant skills in sequence, pausing for user input at decision points, and leaving the user with a running dockerized Odoo instance serving the migrated site.
---

# Web → Odoo Migration Pipeline

End-to-end migration of an existing web application (Next.js, plain HTML, or similar framework) into an Odoo 18 theme module plus content-admin module, running on Docker.

This command is a **thin orchestrator**. It does not contain the migration logic — that lives in four dedicated skills:

1. **`web-to-static`** — source app → static HTML/CSS/JS bundle with semantic classes
2. **`static-to-odoo-theme`** — static bundle → `theme_<brand>/` module
3. **`odoo-web-admin-bridge`** — admin UI → `<brand>_web_catalog/` module with simplified views + seed import
4. **`odoo-docker-dev`** — docker workflow to install, upgrade, and debug the generated modules

## When to use this command

Use when the user provides:

- A source website to migrate (framework app repo, live URL, or HTML folder), AND
- A target of "put this into Odoo 18 with a content-editable admin"

Do NOT use for:

- Partial migrations where only the theme or only the admin is needed — invoke the individual skill directly.
- Migrating between Odoo versions (that's a different workflow).
- Porting Odoo modules between databases (not a migration, it's a restore).

## High-level plan

```
┌─────────────────────────────────────────────────────────────────┐
│  Input: source app (Next.js / HTML / etc) + brand name           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 0: Discovery + brainstorming                               │
│   - Inspect source repo                                          │
│   - Detect framework, list pages, find admin, find seed data     │
│   - Confirm brand name, target DB, docker setup                  │
│   - Produce migration plan                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: web-to-static skill                                     │
│   - Framework export OR wget mirror                              │
│   - Tailwind rewrite → semantic classes                          │
│   - Asset extraction (images, fonts, videos)                     │
│   - Seed JSON dump                                               │
│   - Output: ./migration-output/static/                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: static-to-odoo-theme skill                              │
│   - Scaffold theme_<brand>/                                      │
│   - Split CSS → 6 SCSS files with dual-scope pattern             │
│   - Generate layout.xml, pages.xml, snippets.xml                 │
│   - Editor-safe CSS sweep                                        │
│   - Output: ./theme_<brand>/                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: odoo-web-admin-bridge skill                             │
│   - Map admin schema → product.template fields                   │
│   - Scaffold <brand>_web_catalog/ (NOT a theme module)           │
│   - Security group + simplified views + second menu              │
│   - Seed import script                                           │
│   - Output: ./<brand>_web_catalog/                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 4: odoo-docker-dev skill                                   │
│   - Adapt docker-compose.yml (or use existing)                   │
│   - Install modules in dependency order                          │
│   - Run seed import                                              │
│   - Verify in browser                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 5: theme-responsive-validation skill (GATE)                │
│   - Compare reference CSS to Odoo SCSS rule-by-rule              │
│   - Remove extra overrides not in reference                      │
│   - Fix asset load order (sequence fields)                       │
│   - Visual verification at every breakpoint                      │
│   - BLOCKS handoff until all checks pass                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Output: running Odoo 18 at http://localhost:<port>              │
│          + theme_<brand>/ + <brand>_web_catalog/ on disk         │
│          + responsive layout verified against reference          │
└─────────────────────────────────────────────────────────────────┘
```

## Stage 0: Discovery + brainstorming

Before invoking any skill, gather enough context to make the right calls downstream.

### Questions to answer

1. **Source location** — path to the source repo (or a URL if it's a live site to mirror).
2. **Framework detected** — Next.js? Plain HTML? Nuxt? Astro? Run `ls <source>/package.json` and inspect `dependencies`.
3. **Brand name / module prefix** — short lowercase identifier (e.g. `elite_trafika`, `acme`). Used for `theme_<brand>/`, `<brand>_web_catalog/`, SCSS class scoping, menu labels.
4. **Page inventory** — which pages does the source have? (home, about, product list, product detail, contact, etc.). Map each to an Odoo equivalent: static `website.page` vs. dynamic product template.
5. **Admin surface** — does the source have an admin UI? What does it manage? (Products only? Products + categories + pages?) Read any Prisma/SQL schema.
6. **Target DB / docker** — existing `docker-compose.yml` in the project? Which database name? Which port?
7. **Brand colors + fonts** — quick extraction from the source CSS/tokens, to populate `primary_variables.scss`.

### Discovery commands

```bash
# Framework detection
cat <source>/package.json | jq '.dependencies, .devDependencies'

# Page inventory (Next.js)
find <source>/src/app <source>/pages -name "page.tsx" -o -name "page.jsx" -o -name "*.tsx" 2>/dev/null

# Admin detection
find <source>/src/app/admin <source>/pages/admin 2>/dev/null

# Schema detection
find <source> -name "schema.prisma" -o -name "*.sql" -not -path "*/node_modules/*"

# Existing docker setup in project
ls -la docker-compose.yml .env 2>/dev/null
```

### Produce the plan

Before proceeding, present a written plan to the user covering:

- Detected framework and page count
- Brand name to use
- Schema mapping summary (e.g., "Prisma `Product` → Odoo `product.template` using existing fields only")
- Output paths for each stage
- Docker setup (reuse existing? create new?)
- Known risks (e.g., "Tailwind arbitrary values will need manual review")

Ask the user to confirm or adjust before kicking off Stage 1.

## Stage 1: Static extraction

**Invoke:** `web-to-static` skill.

**Hand off these values** from discovery:
- Source path / URL
- Detected framework
- Output directory (default: `./migration-output/static/`)
- Brand name

**Expect these outputs:**
- `./migration-output/static/index.html`, `./migration-output/static/<page>.html`
- `./migration-output/static/css/main.css` — flat, semantic-class CSS
- `./migration-output/static/js/main.js` — extracted client JS
- `./migration-output/static/assets/img/`, `fonts/`, etc.
- `./migration-output/static/data/products.json` (if admin schema was present)

**Gate before proceeding:** Open one of the static HTML files in a browser. Styles should render correctly WITHOUT any framework runtime. If broken, fix with the `web-to-static` skill's troubleshooting guide, don't proceed.

## Stage 2: Theme generation

**Invoke:** `static-to-odoo-theme` skill.

**Hand off:**
- Path to static bundle from Stage 1
- Brand name
- Page list (what's a snippet vs. what's a page)
- Output directory: `./theme_<brand>/`

**Critical requirements to enforce during generation:**
- All SCSS must use **fixed SCSS variables** for brand colors, NEVER `var(--o-color-X)` for component styling (see `odoo-theme/references/theme-scss-architecture.md` → "CRITICAL: var(--o-color-X) vs Fixed SCSS Variables")
- `data/ir_asset.xml` must have **explicit `<field name="sequence">`** on every asset record (theme=100, header=110, footer=120, responsive=200)
- If using offcanvas mobile menu: **`data-bs-dismiss="offcanvas"` on all links** + stacking context fix in header SCSS (see `odoo-theme/references/theme-scss-architecture.md` → "Offcanvas Drawer on Mobile")
- If using `s_website_form`: add `.s_website_form_dnone { display: none !important; }` to theme SCSS
- Inline styles in XML must use **fixed hex values**, never `var(--o-color-X)`

**Expect these outputs:**
- `./theme_<brand>/__manifest__.py`
- `./theme_<brand>/views/layout.xml` (with body class injection)
- `./theme_<brand>/views/pages.xml` (one `theme.website.page` per Stage 1 HTML)
- `./theme_<brand>/views/snippets.xml` (reusable blocks)
- `./theme_<brand>/data/ir_asset.xml` (with sequence fields on all assets)
- `./theme_<brand>/static/src/scss/` (6 files, dual-scoped, using fixed SCSS variables)
- `./theme_<brand>/static/src/img/`, `fonts/`
- `./theme_<brand>/models/theme_<brand>.py` with `_post_copy` hook

**Gate before proceeding:** Run the smoke install from `static-to-odoo-theme/references/generation-checklist.md`. Theme must install cleanly on a scratch DB before moving on.

### Stage 2.5: Theme Pattern Validation (GATE)

After the theme module is generated but BEFORE installing, run these mandatory checks. These catch the most common and damaging bugs from real migrations. See `odoo-theme/references/theme-scss-architecture.md` for full context.

#### Check 1: No `var(--o-color-X)` in component SCSS (CRITICAL)

Grep all generated SCSS files (theme.scss, header.scss, footer.scss) for `var(--o-color-`. If found in any rule that sets `color`, `background`, `border-color`, or `fill` on a component (cards, buttons, headings, badges, form inputs, icon circles), **replace with a fixed SCSS variable**.

```bash
grep -rn 'var(--o-color-' theme_<brand>/static/src/scss/theme.scss \
    theme_<brand>/static/src/scss/header.scss \
    theme_<brand>/static/src/scss/footer.scss
```

**Why:** `var(--o-color-1)` through `var(--o-color-5)` are CSS custom properties generated by Odoo's `o_cc` classes. The user can rearrange colors via the Theme panel (Website → Customize → Theme), which reassigns which hex maps to which `--o-color-N`. Components using these for contrast-critical styling (white card on dark section, dark text on light card) will silently break when the user changes colors.

**Fix pattern:** Define fixed SCSS variables at the top of each file:
```scss
$brand-white: #FFFFFF;
$brand-dark-text: #333333;
$brand-accent: #2E86DE;
$brand-primary: #0A1628;
```

Also grep XML snippet files for inline `var(--o-color-`:
```bash
grep -rn 'var(--o-color-' theme_<brand>/views/snippets/
```
Replace with fixed hex values in inline styles.

**Where `var(--o-color-X)` IS safe:** Only in `primary_variables.scss` palette definitions and `o-cc*` override mappings.

#### Check 2: Asset load order — sequence fields (CRITICAL)

Verify that `data/ir_asset.xml` has explicit `<field name="sequence">` on every `theme.ir.asset` record:

| Asset file | Required sequence |
|---|---|
| `theme.scss` | 100 |
| `header.scss` | 110 |
| `footer.scss` | 120 |
| `responsive.scss` | 200 |

```bash
grep -A5 'theme.ir.asset' theme_<brand>/data/ir_asset.xml | grep -c 'sequence'
```

**Why:** Without explicit sequence fields, Odoo compiles all SCSS in the same bundle with unpredictable order. `responsive.scss` can load BEFORE `theme.scss`, causing all `@media` overrides to be silently ignored (same specificity, but earlier in the cascade = loses).

#### Check 3: Offcanvas drawer pattern

If the header uses Bootstrap offcanvas for mobile menu, verify:

1. **All `<a>` elements inside offcanvas body have `data-bs-dismiss="offcanvas"`** — without this, clicking a link to an anchor on the same page won't close the drawer.

2. **Header stacking context is neutralized in SCSS** — Odoo's header may get `transform` applied (for sticky animation), which breaks `position: fixed` on the offcanvas:

```scss
#wrapwrap header#top,
#wrapwrap header .o_header_standard,
#wrapwrap header .o_header_affixed {
    transform: none !important;
    will-change: auto !important;
}
```

3. **`overflow: visible` on header** — prevents clipping of the offcanvas:

```scss
#wrapwrap header,
#wrapwrap header .o_header_standard,
#wrapwrap header .o_header_affixed,
#wrapwrap header nav {
    overflow: visible !important;
}
```

#### Check 4: Hidden form fields

If any snippet uses `s_website_form` with hidden fields (`s_website_form_dnone` class), verify that theme SCSS includes:

```scss
.s_website_form_dnone {
    display: none !important;
}
```

**Why:** Custom theme SCSS can inadvertently override this by applying `display: block/flex` to form elements with higher specificity, making hidden fields (like `email_to`) visible to the user.

#### Check 5: No `var(--o-color-X)` in inline XML styles

Final sweep of ALL XML files for inline style references to Odoo color variables:

```bash
grep -rn 'var(--o-color-' theme_<brand>/views/
```

Every match must be replaced with a fixed hex value.

**All 5 checks must pass before proceeding to Stage 3 or Stage 4.**

## Stage 3: Admin bridge

**Invoke:** `odoo-web-admin-bridge` skill.

**Skip this stage** if the source has no admin / no dynamic data (purely static marketing site). The theme alone is sufficient.

**Hand off:**
- Schema file path (Prisma / SQL / inferred)
- Seed JSON path from Stage 1
- Brand name
- Output directory: `./<brand>_web_catalog/`

**Expect these outputs:**
- `./<brand>_web_catalog/__manifest__.py` (depends on `website_sale`, `theme_<brand>`)
- `./<brand>_web_catalog/security/security_groups.xml`
- `./<brand>_web_catalog/security/ir.model.access.csv`
- `./<brand>_web_catalog/views/menu.xml` (second top-level menu restricted to `group_content_editor`)
- `./<brand>_web_catalog/views/product_views.xml` (simplified form/list/kanban at priority 99)
- `./<brand>_web_catalog/data/seed_products.xml` OR `./<brand>_web_catalog/scripts/import_seed.py`

**Gate before proceeding:** Verify via `odoo shell` that `group_content_editor` exists, `product.template` fields mentioned in views are all real, and any custom fields are minimal.

## Stage 4: Docker install + verify

**Invoke:** `odoo-docker-dev` skill.

**Commands to run** (substitute brand and db names):

```bash
# Inspect the existing compose setup
cat docker-compose.yml

# Install all modules in dependency order
docker compose stop web
docker compose run --rm -T web odoo \
    -i base,web,website,website_sale,theme_<brand>,<brand>_web_catalog \
    --stop-after-init \
    -d <db> \
    --without-demo=all
docker compose start web

# Run seed import (if Python script approach)
docker compose exec web odoo shell -d <db> < <brand>_web_catalog/scripts/import_seed.py

# Tail logs
docker compose logs -f --tail=200 web
```

### Verification checklist

- [ ] `http://localhost:<port>/` loads the migrated homepage.
- [ ] Styles match the source site (side-by-side comparison).
- [ ] No JavaScript errors in browser console.
- [ ] `/shop` (or the equivalent product listing) shows imported products.
- [ ] Individual product pages render with image, price, description.
- [ ] Log in as admin — `<Brand>` menu appears in the top bar next to Sales.
- [ ] Click `<Brand>` → Products → simplified kanban loads with imported data.
- [ ] Edit a product from the simplified form → save → verify the website reflects the change.
- [ ] Website editor opens on a page without crashing (no `Cannot convert 'px,' units` errors).
- [ ] Create a test content-editor user in `group_content_editor` → verify they see ONLY the `<Brand>` menu.
- [ ] **If multi-language:** Switch to each non-default language and verify that ALL text in header, footer, and snippets is translated — especially link texts inside `<a>` elements with `<i/>` icons. Per-website view copies have a known bug where text nodes after self-closing children (`<i class="fa fa-xxx"/>Text`) are not translated. Fix with direct SQL `replace()` on `arch_db`. See `odoo-i18n/references/i18n-patterns.md` → "Per-website theme view copies have untranslated text in links".

If any checkbox fails, diagnose with `odoo-docker-dev/references/debug-workflows.md` before marking the migration complete.

## Stage 5: Responsive validation (GATE)

**Invoke:** `theme-responsive-validation` skill.

This is a **blocking gate** — the migration is NOT complete until every check passes. Do not hand off to the user until this stage succeeds.

**What it does:**

1. **CSS comparison** — reads the reference site's responsive CSS (both inline `<style>` and external files) and compares rule-by-rule against Odoo's `responsive.scss`. Identifies extra overrides, missing overrides, and value mismatches.

2. **Asset load order verification** — checks that `responsive.scss` loads AFTER `theme.scss` in the compiled CSS output. Without explicit `sequence` fields on `theme.ir.asset` records, responsive overrides can be silently ignored.

3. **Computed style verification** — programmatically checks that critical layout properties (grid columns, padding, font sizes) match the reference at each breakpoint width.

4. **Visual verification** — scrolls through every section at mobile width and compares screenshots against the reference.

**Common fixes this stage catches:**

- Extra mobile overrides that make sections look cramped (the #1 issue)
- `responsive.scss` loading before `theme.scss` due to missing `sequence` fields
- Font sizes, padding, or grid columns that don't match the reference
- Missing `backdrop-filter` on buttons
- Decorative elements hidden when the reference keeps them visible

**Gate criteria:** ALL items in `theme-responsive-validation/references/responsive-validation-checklist.md` must pass.

## Handoff to user

When all checks pass, present:

1. **URLs** — homepage, admin login, simplified catalog menu path
2. **File tree** — `theme_<brand>/`, `<brand>_web_catalog/`, any `scripts/`
3. **Dev cheatsheet** — the key commands from `odoo-docker-dev/SKILL.md`:
   ```bash
   # After editing SCSS or JS:
   docker compose exec -T db psql -U varyshop -d <db> -c \
       "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
   docker compose stop web && \
       docker compose run --rm -T web odoo -u theme_<brand> --stop-after-init -d <db> && \
       docker compose start web

   # After editing Python/XML:
   docker compose stop web && \
       docker compose run --rm -T web odoo -u <brand>_web_catalog --stop-after-init -d <db> && \
       docker compose start web

   # Logs
   docker compose logs -f --tail=200 web
   ```
4. **Known gaps** — anything the migration didn't cover (variants, advanced interactions, server components) and how the user can address them.

## Error recovery

If a stage fails partway:

- **Stage 1 fails** — fix the input, re-run. Stage 1 is purely local, no side effects.
- **Stage 2 fails** — check the static bundle is complete. Theme scaffolding is idempotent; you can delete `theme_<brand>/` and re-run.
- **Stage 3 fails** — no side effects until the module is installed. Delete `<brand>_web_catalog/` and re-run the skill.
- **Stage 4 fails** — the DB may be in a partial state. Use `odoo-docker-dev/references/debug-workflows.md` → "Fresh database" procedure to reset and retry.
- **Stage 5 fails** — fix the SCSS, add missing `sequence` fields, remove extra overrides, then upgrade the module (`-u theme_<brand>`) and clear asset cache. Re-run the validation checklist. This stage is iterative — expect 2-3 rounds.

Never blindly re-run Stage 4 in a loop without reading logs between attempts. Each failure has a specific cause documented in `debug-workflows.md`.

## What this command does NOT do

- **It does not migrate product variants automatically.** If the source has a variant system, flag it to the user and recommend using Odoo's native Sales → Products variant configuration for those.
- **It does not migrate user accounts or passwords.** Passwords are hashed differently; users must reset.
- **It does not rewrite business logic.** Next.js API routes with complex workflows need manual porting to Odoo Python models — the skills scaffold the data layer, not the logic.
- **It does not deploy to production.** Output is a running local dev instance. Production deployment is a separate workflow.
- **It does not guarantee pixel-perfect fidelity.** Odoo's editor imposes constraints (editor-safe CSS, semantic classes) that may require small visual compromises vs. the source.
