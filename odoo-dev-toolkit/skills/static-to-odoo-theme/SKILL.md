---
name: static-to-odoo-theme
description: |
  Convert a debugged static HTML + CSS + JS bundle (produced by the web-to-static skill) into a complete, installable Odoo 18 theme module. Use this skill when the user has a static website ready and wants to turn it into a theme_* module with snippets, pages, header/footer inheritance, SCSS architecture, and asset registration. This is stage 2 of the web-to-odoo migration pipeline. Applies all editor-safe rules from the odoo-theme skill and splits the static HTML into drag-and-drop snippets using data-snippet markers.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "HTML do Odoo", "statické HTML na modul", "převést na theme modul", "vygenerovat Odoo téma", "udělat Odoo modul ze statiky", "statická verze do Odoo", "HTML šablona do Odoo", "migrace do theme".
version: 0.1.0
---

# Static HTML → Odoo 18 Theme Module

Takes a hand-debugged static bundle (output of the `web-to-static` skill) and emits a complete `theme_*` module that installs cleanly into Odoo 18, renders the original pages, and exposes every section as a draggable snippet in the website editor.

## Prerequisites

The input **must** be a static bundle produced by (or structurally equivalent to) the `web-to-static` skill:

- Flat per-page HTML files (`index.html`, `about.html`, `products.html`, ...)
- Semantic CSS classes (NO Tailwind utility chains, NO multi-value `box-shadow`/`transition`/`filter`)
- `<section data-snippet="s_name">` wrappers around every logical content block
- Assets in `img/`, `css/`, `js/`, `fonts/`, optional `data/`

If the input doesn't meet these criteria, **stop and run `web-to-static` first**. Generating a theme from a raw bundled Next.js output will produce a broken module that crashes the Odoo editor.

## Before you start

Read these files in order:

1. **This skill's references:**
   - `references/mapping-rules.md` — How each static construct maps to Odoo (pages, snippets, header, footer, assets).
   - `references/scss-split.md` — How to split one flat `theme.css` into `primary_variables.scss`, `bootstrap_overridden.scss`, `theme.scss`, `header.scss`, `footer.scss`, `responsive.scss`.
   - `references/generation-checklist.md` — Step-by-step validation before declaring the module ready.

2. **The existing `odoo-theme` skill** (sibling in this toolkit) — this skill consumes its reference files:
   - `odoo-theme/references/theme-structure.md`
   - `odoo-theme/references/theme-scss-architecture.md` — especially **"Editor-safe CSS properties (CRITICAL)"** and **"Scoping theme styles for editor-created pages (CRITICAL)"**
   - `odoo-theme/references/theme-layout-snippets.md` — especially the `<t t-snippet/>` registration rule and the warning against custom drop-zone rules
   - `odoo-theme/references/theme-data-modules.md`

## Core Principles

1. **Respect editor-safe rules from `odoo-theme`** — every SCSS rule this skill emits must satisfy the `px,` crash prevention (single-layer box-shadow, `transition: all`, single filter layer).
2. **Dual-scope SCSS by default** — emit styles under `.theme_<brand>_page, body.theme_<brand>_body #wrap { ... }` so editor-created pages inherit the theme.
3. **One snippet per `data-snippet` marker** — no merging, no splitting, no interpretation. The markers placed in `web-to-static` are the source of truth.
4. **Header/footer are NOT snippets** — they go to `views/layout.xml` as `website.layout` inherits.
5. **Pages are `theme.website.page`** — one record per HTML file, `url` derived from the filename.
6. **Assets via `theme.ir.asset`** — not `ir.asset`. Theme prefix auto-converts.
7. **No hardcoded dynamic content** — if the source had admin-managed content (products, posts), leave placeholder data in snippets and mark them with a comment pointing to the `odoo-web-admin-bridge` skill for backend wiring.

## Workflow

### Step 1: Gather inputs from the user

- **Brand / module technical name** — e.g. `theme_trafika`, `theme_elite_arena`. Must start with `theme_`.
- **Human-readable name** — appears in the website configurator ("Trafika", "Elite Arena").
- **Primary language** — determines `__manifest__.py` `'default_language'` if applicable.
- **Path to the static bundle** — e.g. `/path/to/elite-trafika-static/`.
- **Output path** — where to write the module (usually next to other theme modules, e.g. `/path/to/odoo/addons/theme_trafika/`).

### Step 2: Scaffold the module skeleton

Use the structure from `odoo-theme/references/theme-structure.md`:

```
theme_<brand>/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── theme_<brand>.py                  # Post-copy hook
├── views/
│   ├── layout.xml                         # Header + footer inherit + body class
│   ├── pages.xml                          # theme.website.page records
│   └── snippets/
│       ├── snippets_registry.xml
│       └── s_*.xml                        # One file per data-snippet from the static bundle
├── data/
│   ├── generate_primary_template.xml
│   ├── ir_asset.xml
│   └── website_menu_data.xml
└── static/
    ├── description/
    │   ├── icon.png
    │   └── index.html                     # Optional theme preview
    └── src/
        ├── img/                            # Copied from static bundle
        ├── fonts/                          # Copied from static bundle (if self-hosted)
        ├── audio/                          # Optional
        ├── scss/
        │   ├── primary_variables.scss
        │   ├── bootstrap_overridden.scss
        │   ├── theme.scss
        │   ├── header.scss
        │   ├── footer.scss
        │   └── responsive.scss
        └── js/
            └── main.js
```

### Step 3: Analyze the static bundle

Walk the bundle and build a catalog:

```
{
  "pages": [
    { "file": "index.html", "url": "/", "title": "Trafika" },
    { "file": "products.html", "url": "/products", "title": "Produkty" },
    ...
  ],
  "snippets": [
    { "id": "s_brand_hero", "sourcePage": "index.html", "html": "..." },
    { "id": "s_brand_categories", "sourcePage": "index.html", "html": "..." },
    ...
  ],
  "header": "<header>...</header>",
  "footer": "<footer>...</footer>",
  "css_files": ["css/theme.css", "css/responsive.css"],
  "js_files": ["js/main.js"],
  "assets": { "images": [...], "fonts": [...] },
  "palette": { "primary": "#ff6a00", "secondary": "#cc2200", "dark": "#0a0a0a", "light": "#f4f4f5" }
}
```

**Deduplication:** the same header/footer appears in every HTML file. Take them from `index.html` and verify (diff) that other pages are identical. If they differ, flag it to the user — navigation per page is unusual and may be a mistake in the static bundle.

### Step 4: Split the CSS

See `references/scss-split.md` for the full procedure. Summary:

1. **Extract variables** — find every color, font family, and font size used repeatedly. Move to `primary_variables.scss` under `$o-website-values-palettes` and `$o-theme-font-configs`.
2. **Extract header-specific rules** — anything targeting `.brand-header`, `.brand-nav`, `.brand-logo`, mobile menu → `header.scss`.
3. **Extract footer-specific rules** → `footer.scss`.
4. **Extract media queries** → `responsive.scss` (all `@media (max-width: ...)` blocks go here).
5. **Remaining body/sections/buttons/cards** → `theme.scss`.
6. **Wrap everything except `primary_variables.scss` and `bootstrap_overridden.scss`** in the dual-scope selector:

   ```scss
   .theme_<brand>_page,
   body.theme_<brand>_body #wrap {
       // All theme.scss / header.scss / footer.scss / responsive.scss content here
   }
   ```

   This guarantees both hand-crafted pages and editor-created pages get styled.

7. **Apply the editor-safe sweep** — one last pass to catch any multi-value `box-shadow`/`transition`/`filter` that slipped through. These MUST be gone before shipping.

### Step 5: Generate `views/layout.xml`

Inherit `website.layout` with three xpath operations:

1. **Body class** — add `theme_<brand>_body` to `<body>` so the dual-scope SCSS selector works on editor-created pages.

   ```xml
   <xpath expr="//body" position="attributes">
       <attribute name="class" add="theme_<brand>_body" separator=" "/>
   </xpath>
   ```

2. **Header replacement** — replace `<header>//nav` content with the static bundle's header markup.

3. **Footer replacement** — replace `<div id="footer">` with the static bundle's footer markup.

Preserve dynamic references:

- Logo image → `t-att-src="'/theme_<brand>/static/src/img/logo.svg'"`
- Menu items → iterate `t-foreach="website.menu_id.child_id"` instead of hardcoded links.
- Copyright year → `<t t-esc="datetime.date.today().year"/>`
- Social links → `website.social_media_links` template if the static bundle has standard social icons.

### Step 6: Generate snippet files

For each `s_*` marker in the catalog:

```xml
<!-- views/snippets/s_brand_hero.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="s_brand_hero" name="Brand Hero">
    <section class="s_brand_hero brand-hero o_cc o_cc5 theme_<brand>_page">
        <!-- exact HTML from the static bundle, with these substitutions:
             - class attribute: prepend "s_brand_hero o_cc o_cc<N> theme_<brand>_page"
             - <img src="img/..."> → <img t-att-src="'/theme_<brand>/static/src/img/...'"/>
             - Background images: style="background-image: url('/theme_<brand>/static/src/img/...')"
             - Any <a href="/about"> stays as-is (Odoo resolves relative URLs)
        -->
    </section>
</template>

</odoo>
```

**Required class additions on the outer `<section>`:**

- `s_<snippet_id>` — snippet's canonical class, used by Odoo's drop-zone detection.
- `o_cc o_cc<N>` — color combination class matching the snippet's intended background (1 = white, 3 = light, 4 = brand, 5 = dark).
- `theme_<brand>_page` — redundant with the body class but makes the snippet work even when previewed in isolation.

### Step 7: Generate `snippets_registry.xml`

Use **exactly** the pattern from `odoo-theme/references/theme-layout-snippets.md` — `<t t-snippet/>` inside `<snippets id=".." string="..">`, inherited from `website.snippets` with xpath `//snippets[@id='snippet_structure']` position=after.

**DO NOT** use `<snippet>` wrapper element. **DO NOT** add custom `data-selector`/`data-drop-in`/`data-drop-near` rules — Odoo's built-in section rule handles them automatically.

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="<brand>_snippets" inherit_id="website.snippets" name="<Brand> Snippets">
    <xpath expr="//snippets[@id='snippet_structure']" position="after">
        <snippets id="<brand>_snippet_structure" string="<Brand>">
            <t t-snippet="theme_<brand>.s_brand_hero"
               t-thumbnail="/theme_<brand>/static/src/img/snippets/s_brand_hero.png"/>
            <t t-snippet="theme_<brand>.s_brand_categories"
               t-thumbnail="/theme_<brand>/static/src/img/snippets/s_brand_categories.png"/>
            <!-- One entry per snippet -->
        </snippets>
    </xpath>
</template>

</odoo>
```

**Thumbnails:** generate placeholder 200×150 PNGs (e.g., via ImageMagick) if the static bundle doesn't already contain them. Users can replace them later.

### Step 8: Generate `views/pages.xml`

For each HTML page in the static bundle (except admin routes):

```xml
<!-- Wrap in <data> because this file mixes <template> and <record> -->
<data>

<template id="page_home" name="Home">
    <t t-call="website.layout">
        <t t-set="additional_title">Home | Brand</t>

        <div id="wrap" class="oe_structure oe_empty theme_<brand>_page">
            <!-- t-call each snippet that appeared in this page in the static bundle -->
            <t t-call="theme_<brand>.s_brand_hero"/>
            <t t-call="theme_<brand>.s_brand_categories"/>
            <t t-call="theme_<brand>.s_brand_about"/>
            <!-- ... -->
        </div>
    </t>
</template>

<record id="page_home_page" model="theme.website.page">
    <field name="url">/</field>
    <field name="view_id" ref="page_home"/>
    <field name="is_published" eval="True"/>
</record>

</data>
```

**URL mapping:**

| Static file | Page URL |
|---|---|
| `index.html` | `/` |
| `about.html` | `/about` |
| `products.html` | `/products` |
| `contact.html` | `/contact` |
| `our-team.html` | `/our-team` |

**The `theme_<brand>_page` class on `#wrap` is critical** — it's the hand-crafted half of the dual-scope SCSS selector. Editor-created pages won't have it but will match the body-class fallback.

### Step 9: Generate `data/ir_asset.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data>

    <!-- Primary variables (MUST load first) -->
    <record id="theme_<brand>_primary_variables" model="theme.ir.asset">
        <field name="name"><Brand> primary variables</field>
        <field name="bundle">web._assets_primary_variables</field>
        <field name="path">theme_<brand>/static/src/scss/primary_variables.scss</field>
    </record>

    <!-- Bootstrap overrides -->
    <record id="theme_<brand>_bootstrap_overridden" model="theme.ir.asset">
        <field name="name"><Brand> bootstrap overrides</field>
        <field name="bundle">web._assets_frontend_helpers</field>
        <field name="path">theme_<brand>/static/src/scss/bootstrap_overridden.scss</field>
    </record>

    <!-- Main theme styles -->
    <record id="theme_<brand>_theme_scss" model="theme.ir.asset">
        <field name="name"><Brand> theme</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">theme_<brand>/static/src/scss/theme.scss</field>
    </record>

    <!-- Header -->
    <record id="theme_<brand>_header_scss" model="theme.ir.asset">
        <field name="name"><Brand> header</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">theme_<brand>/static/src/scss/header.scss</field>
    </record>

    <!-- Footer -->
    <record id="theme_<brand>_footer_scss" model="theme.ir.asset">
        <field name="name"><Brand> footer</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">theme_<brand>/static/src/scss/footer.scss</field>
    </record>

    <!-- Responsive (loads LAST in frontend bundle so media queries cascade) -->
    <record id="theme_<brand>_responsive_scss" model="theme.ir.asset">
        <field name="name"><Brand> responsive</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">theme_<brand>/static/src/scss/responsive.scss</field>
    </record>

    <!-- Main JS -->
    <record id="theme_<brand>_main_js" model="theme.ir.asset">
        <field name="name"><Brand> main JS</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">theme_<brand>/static/src/js/main.js</field>
    </record>

</data>
</odoo>
```

### Step 10: Post-copy hook

`models/theme_<brand>.py` — handles homepage conflict resolution (see `odoo-theme/references/theme-layout-snippets.md` → **"Homepage Page Conflict (CRITICAL)"**):

```python
from odoo import models


class ThemeBrand(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_<brand>_post_copy(self, mod):
        # Remove the default empty homepage that conflicts with our theme home.
        default_home = self.env['website.page'].search([
            ('url', '=', '/'),
            ('view_id.key', '=', 'website.homepage'),
        ])
        if default_home:
            default_home.unlink()

        # Enable the theme's custom header/footer layouts so they take effect.
        self.enable_view('theme_<brand>.layout_header')
        self.enable_view('theme_<brand>.layout_footer')
        self.enable_view('theme_<brand>.layout_body_class')
```

### Step 11: Manifest

```python
{
    'name': '<Brand> Theme',
    'category': 'Website/Theme',
    'version': '18.0.1.0.0',
    'summary': '<Brand> website theme',
    'description': 'Full website theme for <Brand>, generated from static HTML bundle.',
    'author': '<author>',
    'license': 'LGPL-3',
    'depends': [
        'website',
    ],
    'data': [
        # Data files
        'data/generate_primary_template.xml',
        'data/ir_asset.xml',
        'data/website_menu_data.xml',
        # Views
        'views/layout.xml',
        # Snippet files MUST load before the registry
        'views/snippets/s_brand_hero.xml',
        'views/snippets/s_brand_categories.xml',
        # ... one per snippet
        'views/snippets/snippets_registry.xml',
        # Pages last (they t-call the snippets)
        'views/pages.xml',
    ],
    'assets': {},  # All SCSS/JS registered via theme.ir.asset records in data/ir_asset.xml
    'images': [
        'static/description/theme_screenshot.png',
    ],
    'installable': True,
    'application': False,
}
```

**CRITICAL ordering in `data:`** — individual snippet files must appear BEFORE `snippets_registry.xml`, which must appear BEFORE `pages.xml` (pages `t-call` the snippets, so the snippet templates must exist first).

### Step 12: Copy static assets

```bash
cp -r <static-bundle>/img/*     theme_<brand>/static/src/img/
cp -r <static-bundle>/fonts/*   theme_<brand>/static/src/fonts/ 2>/dev/null
cp -r <static-bundle>/audio/*   theme_<brand>/static/src/audio/ 2>/dev/null
```

Update paths in snippets to use `/theme_<brand>/static/src/img/...` instead of `img/...`.

### Step 13: Validate against the generation checklist

Read `references/generation-checklist.md` and tick every item. Common failures caught here:

- Snippet files listed in `data:` after `snippets_registry.xml` → registry resolves nothing.
- `theme_<brand>_page` class missing on `#wrap` in pages.xml → hand-crafted pages unstyled.
- `theme_<brand>_body` class not added via `//body` xpath → editor-created pages unstyled.
- Snippet `<section>` missing `s_<id>` class → drop-zone detection silently fails.
- Multi-value `transition` / `box-shadow` leaked into SCSS → editor crash.

### Step 14: Hand off to docker-dev

Print this to the user:

> Theme module generated at `theme_<brand>/`. To install:
>
> 1. Ensure the module is on Odoo's addons path (use the `odoo-docker-dev` skill if you need a docker setup).
> 2. `docker compose stop web && docker compose run --rm -T web odoo -i theme_<brand> --stop-after-init -d <db> && docker compose start web`
> 3. Open `http://localhost:<port>`, apply the theme via Website → Configurator.
> 4. Verify every page renders correctly and every snippet is draggable in the editor.
>
> If the editor throws `Cannot convert 'px,' units into 'px' units`, grep your generated SCSS for comma-separated `transition:` and `box-shadow:` values and collapse them per the editor-safe rules.

## Key Gotchas

- **`data:` ordering** — snippets → registry → pages. Getting this wrong produces silent registry failures.
- **Dual-scope SCSS** — both `.theme_<brand>_page` (on hand-crafted `#wrap`) and `body.theme_<brand>_body #wrap` (via layout xpath) must exist.
- **Snippet registration form** — `<t t-snippet=".." t-thumbnail=".."/>`, NOT `<snippet t-snippet=".." string="..">`.
- **No custom drop-zone rules** — plain `<section>` snippets work with Odoo's built-in `section, .parallax, .s_hr` rule. Custom rules conflict.
- **Homepage conflict** — always run the post-copy hook to delete the default `website.homepage` record at `url='/'`.
- **Inline `url()` in SCSS** — forbidden for fonts (Odoo bundler limitation from `odoo-theme` skill). Fonts go via `<link>` in layout.xml or via `$o-theme-font-configs`.
- **Images path prefix** — every `<img src>` and `background-image: url()` in snippets must be `/theme_<brand>/static/src/img/...`, absolute from the Odoo root.
- **Admin pages** — if the static bundle accidentally includes `/admin/*` pages, EXCLUDE them from `pages.xml`. Admin migration is a separate skill.
