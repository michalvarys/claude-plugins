# Odoo 18 Theme Module: Snippets & Pages Patterns

## CRITICAL: Do NOT use `<record model="theme.ir.ui.view">` for pages and snippets

In Odoo 18 theme modules (`theme_*`), using `<record model="theme.ir.ui.view">` with explicit `<field name="arch">` is the **WRONG pattern** for defining pages and snippets. It causes:
- Content not appearing after clean install + theme selection
- Broken snippet registration in the website editor
- Overcomplicated XML that's hard to maintain

### The correct pattern: `<template>` tags

In `theme_*` modules, `<template id="...">` inside a data XML file automatically creates `theme.ir.ui.view` records. You do NOT need to define them manually with `<record>`.

---

## Snippet Pattern (Correct)

File: `views/snippets/s_my_snippet.xml` (listed in manifest `data:`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="s_my_snippet" name="My Snippet">
    <section class="my-snippet o_cc o_colored_level" id="my-section"
             data-snippet="s_my_snippet" data-name="My Snippet">
        <div class="container">
            <h2 class="my-section-title">Section Title</h2>
            <p>Content here.</p>
        </div>
    </section>
</template>

</odoo>
```

Key rules:
- `<template>` goes directly under `<odoo>` — **NOT** inside `<data>`
- The section element MUST have `data-snippet` and `data-name` attributes for the website editor
- Use `o_cc o_colored_level` classes for Odoo color system compatibility
- The `id` attribute becomes the template's XML ID (prefixed with module name automatically)

### WRONG Snippet Pattern (Do NOT use)

```xml
<!-- WRONG — do NOT use <record> for snippets in theme modules -->
<odoo>
<record id="s_my_snippet" model="theme.ir.ui.view">
    <field name="name">My Snippet</field>
    <field name="key">theme_mymodule.s_my_snippet</field>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <t t-name="theme_mymodule.s_my_snippet">
            <section>...</section>
        </t>
    </field>
</record>
</odoo>
```

---

## Page Pattern (Correct)

File: `views/pages.xml` (listed in manifest `data:`)

When a file has BOTH `<template>` AND `<record>` elements (e.g., a page view + `theme.website.page` record), wrap everything in `<data>`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data>

<template id="my_homepage" name="My Homepage">
    <t t-call="website.layout">
        <t t-set="no_header" t-value="True"/>
        <t t-set="no_footer" t-value="True"/>
        <t t-set="additional_title">Page Title | Brand</t>
        <t t-set="meta_description">SEO description.</t>

        <div id="wrap" class="oe_structure oe_empty my-wrapper">
            <!-- All page content inlined here -->
            <section class="my-hero o_colored_level" id="hero">
                <div class="container">
                    <h1>Welcome</h1>
                </div>
            </section>

            <!-- More sections... -->
        </div>
    </t>
</template>

<record id="my_homepage_page" model="theme.website.page">
    <field name="url">/</field>
    <field name="view_id" ref="my_homepage"/>
    <field name="is_published" eval="True"/>
</record>

</data>
</odoo>
```

Key rules:
- `<template>` + `<record>` in same file → wrap in `<data>`
- The page content is **inlined** inside the template (not using `t-snippet-call` or external snippet references)
- `no_header`/`no_footer` set to `True` for custom header/footer (common in landing pages)
- `theme.website.page` has NO `key` field — just `url`, `view_id`, and `is_published`
- `<div id="wrap" class="oe_structure oe_empty">` is required for website editor compatibility

### WRONG Page Pattern (Do NOT use)

```xml
<!-- WRONG — do NOT use <record model="theme.ir.ui.view"> for pages -->
<odoo>
<record id="my_homepage" model="theme.ir.ui.view">
    <field name="name">My Homepage</field>
    <field name="key">theme_mymodule.my_homepage</field>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <t t-name="theme_mymodule.my_homepage">
            <t t-call="website.layout">
                ...
            </t>
        </t>
    </field>
</record>
</odoo>
```

---

## Manifest Pattern

```python
{
    'name': 'My Theme',
    'version': '18.0.1.0.0',
    'depends': ['theme_common', 'website'],
    'data': [
        'data/ir_asset.xml',
        # Snippets
        'views/snippets/s_hero.xml',
        'views/snippets/s_about.xml',
        'views/snippets/s_contact.xml',
        # Pages (with inlined content)
        'views/pages.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'my_theme/static/src/js/main.js',
        ],
    },
}
```

Key rules:
- Snippet XML files go in manifest `data:` list
- JS files go in manifest `assets:` dict (NOT as `theme.ir.asset` records)
- SCSS files go as `theme.ir.asset` records in `data/ir_asset.xml` (because they need specific bundles like `web._assets_primary_variables`)

---

## Asset Registration

### SCSS — use `theme.ir.asset` records (correct)

```xml
<!-- data/ir_asset.xml -->
<odoo>
    <record id="asset_primary_variables" model="theme.ir.asset">
        <field name="key">my_theme_primary_variables</field>
        <field name="name">my_theme primary variables</field>
        <field name="bundle">web._assets_primary_variables</field>
        <field name="path">my_theme/static/src/scss/primary_variables.scss</field>
    </record>
    <record id="asset_theme" model="theme.ir.asset">
        <field name="key">my_theme_styles</field>
        <field name="name">my_theme styles</field>
        <field name="bundle">web.assets_frontend</field>
        <field name="path">my_theme/static/src/scss/theme.scss</field>
    </record>
</odoo>
```

### JS — use manifest `assets` dict (correct)

```python
# __manifest__.py
'assets': {
    'web.assets_frontend': [
        'my_theme/static/src/js/main.js',
    ],
},
```

Do NOT register JS as `theme.ir.asset` records — the manifest `assets` dict is cleaner and avoids duplication issues.

---

## Frontend JS Pattern (publicWidget)

For dynamic UI in theme pages, use `publicWidget.Widget` — NOT `DOMContentLoaded`:

```javascript
/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.MyWidget = publicWidget.Widget.extend({
    selector: '#myElement',

    start() {
        this._super(...arguments);
        // Widget is now attached to #myElement
        // this.el = the DOM element
    },
});
```

Why: `DOMContentLoaded` fires before the Odoo module system loads ES module imports, causing import errors.

For JSON-RPC calls:
```javascript
import { rpc } from "@web/core/network/rpc";

// Inside a publicWidget method:
rpc('/my/api/endpoint', { param: value }).then(function (result) {
    // result is already unwrapped (no .result nesting)
});
```

## Server-Side Data Injection

To pass data from Python to JS without AJAX, inject it as window globals in the QWeb template:

```xml
<script>
    window.myData = <t t-raw="json.dumps(my_python_dict)"/>;
</script>
```

Then read `window.myData` in your JS widget — no API calls needed for initial data.
