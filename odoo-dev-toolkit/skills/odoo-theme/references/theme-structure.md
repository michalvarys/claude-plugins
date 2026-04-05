# Odoo 18 Theme Module Structure

## Directory Layout

```
theme_brandname/
├── __init__.py                      # from . import models
├── __manifest__.py
├── models/
│   ├── __init__.py                  # from . import theme_brandname
│   └── theme_brandname.py           # Post-copy hooks
├── views/
│   ├── layout.xml                   # Header + footer inheritance
│   ├── pages.xml                    # Website pages
│   ├── images_library.xml           # Image library for website editor
│   └── snippets/
│       ├── snippets_registry.xml    # Centralized snippet registration
│       ├── s_hero_banner.xml
│       ├── s_about_section.xml
│       ├── s_pricing_preview.xml
│       ├── s_schedule_preview.xml
│       ├── s_contact_section.xml
│       └── s_cta_section.xml
├── data/
│   ├── generate_primary_template.xml
│   ├── ir_asset.xml                 # SCSS bundles
│   └── website_menu_data.xml        # Navigation items
└── static/src/
    ├── img/
    │   ├── icons/                   # Snippet thumbnails (PNG, ~200x150px)
    │   └── content/                 # Default images for pages
    ├── scss/
    │   ├── primary_variables.scss
    │   ├── bootstrap_overridden.scss
    │   ├── theme.scss
    │   ├── header.scss
    │   ├── footer.scss
    │   └── responsive.scss
    └── js/
        ├── mobile_menu.js
        └── tour.js
```

## __manifest__.py Template

```python
{
    'name': 'Brand Name Theme',
    'description': 'Professional theme for Brand Name website.',
    'category': 'Theme/Creative',
    'version': '18.0.1.0.0',
    'author': 'Author Name',
    'license': 'LGPL-3',
    'depends': [
        'theme_common',
        'website',
        # Add if needed:
        # 'website_event',
        # 'website_slides',
        # 'brandname_pricing',   # Custom data module
        # 'brandname_schedule',  # Custom data module
    ],
    'data': [
        # Assets first
        'data/generate_primary_template.xml',
        'data/ir_asset.xml',
        # Layout
        'views/layout.xml',
        # Snippets
        'views/snippets/s_hero_banner.xml',
        'views/snippets/s_about_section.xml',
        'views/snippets/s_pricing_preview.xml',
        'views/snippets/s_schedule_preview.xml',
        'views/snippets/s_contact_section.xml',
        'views/snippets/s_cta_section.xml',
        # Registry AFTER individual snippets
        'views/snippets/snippets_registry.xml',
        # Pages
        'views/pages.xml',
        'views/images_library.xml',
        # Navigation
        'data/website_menu_data.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_brandname/static/src/js/mobile_menu.js',
            'theme_brandname/static/src/js/tour.js',
        ],
        'website.assets_editor': [
            # Editor-specific assets if needed
        ],
    },
    # Homepage snippet configuration for website configurator
    'configurator_snippets': {
        'homepage': ['s_hero_banner', 's_about_section', 's_pricing_preview',
                     's_schedule_preview', 's_cta_section', 's_contact_section'],
    },
    'images': [
        'static/description/banner.png',
        'static/description/theme_brandname_screenshot.jpg',
    ],
    'snippet_lists': {
        'homepage': ['s_hero_banner', 's_about_section', 's_pricing_preview'],
    },
    'license': 'LGPL-3',
}
```

**CRITICAL manifest rules:**
- `depends` must include `theme_common` (provides base theme utilities)
- Snippet XML files go in `data:` list (NOT in `assets:`)
- `snippets_registry.xml` MUST come AFTER individual snippet files
- JS goes in `assets:` dict, SCSS goes as `theme.ir.asset` records
- `configurator_snippets` controls which snippets appear on homepage after theme selection

## Auto-Conversion Rules

In `theme_*` modules, Odoo **automatically converts** standard models:

| You write | Odoo creates |
|-----------|-------------|
| `<template id="...">` | `theme.ir.ui.view` |
| `<record model="ir.ui.view">` | `theme.ir.ui.view` (auto-converted) |
| `<record model="ir.asset">` | `theme.ir.asset` (auto-converted) |

**NEVER** use `ir.ui.view` or `ir.asset` directly in `theme_*` modules — it creates model conflicts during upgrade.

## Asset Registration (data/ir_asset.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<!-- Primary variables (palette + fonts) — loaded first -->
<record id="asset_primary_variables" model="theme.ir.asset">
    <field name="key">theme_brandname_primary_variables</field>
    <field name="name">theme_brandname primary variables</field>
    <field name="bundle">web._assets_primary_variables</field>
    <field name="path">theme_brandname/static/src/scss/primary_variables.scss</field>
</record>

<!-- Bootstrap overrides — loaded after primary variables -->
<record id="asset_bootstrap_overridden" model="theme.ir.asset">
    <field name="key">theme_brandname_bootstrap_overridden</field>
    <field name="name">theme_brandname bootstrap overridden</field>
    <field name="bundle">web._assets_frontend_helpers</field>
    <field name="path">theme_brandname/static/src/scss/bootstrap_overridden.scss</field>
</record>

<!-- Main theme styles -->
<record id="asset_theme" model="theme.ir.asset">
    <field name="key">theme_brandname_theme</field>
    <field name="name">theme_brandname styles</field>
    <field name="bundle">web.assets_frontend</field>
    <field name="path">theme_brandname/static/src/scss/theme.scss</field>
</record>

<!-- Header styles -->
<record id="asset_header" model="theme.ir.asset">
    <field name="key">theme_brandname_header</field>
    <field name="name">theme_brandname header</field>
    <field name="bundle">web.assets_frontend</field>
    <field name="path">theme_brandname/static/src/scss/header.scss</field>
</record>

<!-- Footer styles -->
<record id="asset_footer" model="theme.ir.asset">
    <field name="key">theme_brandname_footer</field>
    <field name="name">theme_brandname footer</field>
    <field name="bundle">web.assets_frontend</field>
    <field name="path">theme_brandname/static/src/scss/footer.scss</field>
</record>

<!-- Responsive styles -->
<record id="asset_responsive" model="theme.ir.asset">
    <field name="key">theme_brandname_responsive</field>
    <field name="name">theme_brandname responsive</field>
    <field name="bundle">web.assets_frontend</field>
    <field name="path">theme_brandname/static/src/scss/responsive.scss</field>
</record>

</odoo>
```

**Asset bundles:**
- `web._assets_primary_variables` — Font + palette variables (loaded FIRST)
- `web._assets_frontend_helpers` — Bootstrap variable overrides
- `web.assets_frontend` — All other styles (theme, header, footer, responsive, component-specific)

## Post-Copy Hook (models/theme_brandname.py)

```python
from odoo import models


class ThemeBrandname(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_brandname_post_copy(self, mod):
        # Disable default Odoo header/footer
        self.disable_view('website.template_header_default')
        self.disable_view('website.footer_custom')
        self.disable_view('website.template_footer_default')

        # Enable custom header/footer
        self.enable_view('theme_brandname.brand_header')
        self.enable_view('theme_brandname.brand_footer')
```

**Post-copy hook naming:** Method MUST be named `_theme_<modulename>_post_copy` — Odoo calls it automatically when the theme is applied to a website.

## Generate Primary Template (data/generate_primary_template.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

<record id="generate_primary_template" model="theme.ir.ui.view">
    <field name="name">theme_brandname.generate_primary_template</field>
    <field name="key">theme_brandname.generate_primary_template</field>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <t t-name="theme_brandname.generate_primary_template">
            <t t-call="website.message_on_empty_page"/>
        </t>
    </field>
</record>

</data>
</odoo>
```

## Image Library (views/images_library.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<record id="brand_img_hero" model="theme.ir.attachment">
    <field name="key">theme_brandname.brand_img_hero</field>
    <field name="name">brand_hero.jpg</field>
    <field name="url">/theme_brandname/static/src/img/content/hero.jpg</field>
</record>

<record id="brand_img_about" model="theme.ir.attachment">
    <field name="key">theme_brandname.brand_img_about</field>
    <field name="name">brand_about.jpg</field>
    <field name="url">/theme_brandname/static/src/img/content/about.jpg</field>
</record>

</odoo>
```

**Image library rules:**
- Use `theme.ir.attachment` model (NOT `ir.attachment`)
- `key` field is REQUIRED (unlike `theme.website.page`)
- Images appear in the "Theme Images" section of the website editor media library

## Navigation (data/website_menu_data.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

<record id="menu_home" model="theme.website.menu">
    <field name="name">Domů</field>
    <field name="url">/</field>
    <field name="sequence">10</field>
</record>

<record id="menu_about" model="theme.website.menu">
    <field name="name">O nás</field>
    <field name="url">/about</field>
    <field name="sequence">20</field>
</record>

<record id="menu_pricing" model="theme.website.menu">
    <field name="name">Ceník</field>
    <field name="url">/pricing</field>
    <field name="sequence">30</field>
</record>

<record id="menu_schedule" model="theme.website.menu">
    <field name="name">Rozvrh</field>
    <field name="url">/schedule</field>
    <field name="sequence">40</field>
</record>

<record id="menu_contact" model="theme.website.menu">
    <field name="name">Kontakt</field>
    <field name="url">/contact</field>
    <field name="sequence">50</field>
</record>

</data>
</odoo>
```

**Menu rules:**
- Use `theme.website.menu` (NOT `website.menu`)
- `noupdate="1"` so menu items are not overwritten on module upgrade
- `sequence` controls order (10, 20, 30...)
- `page_id` (optional) links to `theme.website.page` record for page-bound menus
