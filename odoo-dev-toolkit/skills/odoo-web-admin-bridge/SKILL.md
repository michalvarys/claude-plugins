---
name: odoo-web-admin-bridge
description: |
  Migrate the admin side of a web application (Next.js /admin, custom CMS, WordPress dashboard) into an Odoo 18 module that provides a simplified, content-editor-friendly UI built on top of existing Odoo models (primarily product.template). Use this skill when the user has a web app with a product/content management backend and wants to replace it with an Odoo module that reuses standard Odoo models without aggressive extensions, exposes a dedicated top-level menu separate from Sales, and scopes access via a content-editor security group. This is stage 3 of the web-to-odoo migration pipeline. Prefers reusing existing product.template fields over adding custom fields.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "admin do Odoo", "správa produktů do Odoo", "Next.js admin na Odoo", "zjednodušená administrace", "editor obsahu", "skrytý sales pro editory", "vlastní menu pro editory", "napojit na product.template", "migrace administrace".
version: 0.1.0
---

# Web Admin → Odoo 18 Bridge Module

Migrates a web application's admin panel into an Odoo 18 module that:

1. **Reuses existing Odoo models** (primarily `product.template`) — does NOT create parallel models or aggressive field extensions.
2. **Exposes a dedicated top-level menu** for content editors, separate from the Sales / Inventory / Accounting menus.
3. **Uses simplified form/list/kanban views** that show only the fields relevant to web publishing — no price lists, no vendor pricelists, no accounting tabs.
4. **Scopes access via a security group** so content editors see only their menu, while admins keep full access to the standard Sales views.
5. **Imports seed data** from the web app's database (JSON seed produced by `web-to-static`) into Odoo records.

This is **stage 3** of the web-to-odoo migration pipeline. Stage 1 is `web-to-static`, stage 2 is `static-to-odoo-theme`.

## Before you start

Read these files in order:

1. **This skill's references:**
   - `references/prisma-to-odoo-mapping.md` — Mapping common Prisma schemas to Odoo fields (products, categories, users, media).
   - `references/simplified-views.md` — The view patterns for content-editor form / list / kanban that hide sales/accounting clutter.
   - `references/security-group.md` — How to create a `group_content_editor` group, menu visibility rules, and ir.rule record rules.
   - `references/seed-import.md` — Loading JSON seed data into Odoo records, handling images (base64 for `image_1920`), and idempotency.

2. **Sibling skills:**
   - `odoo-module-scaffold` — Module structure, manifest conventions.
   - `odoo-views` — `<list>`, `<form>`, `<kanban>` syntax for Odoo 18.
   - `odoo-python` — Models, `_inherit`, computed fields, controllers.

## Core Principles

1. **Reuse before extend.** Before adding any field to `product.template`, verify the field doesn't already exist in the standard Odoo model. The product model in Odoo 18 already has: `name`, `description`, `description_sale`, `website_description`, `list_price`, `image_1920`, `active`, `is_published`, `website_ribbon_id`, `public_categ_ids`, `categ_id`, plus stock fields from `stock` and pricelists from `product`. Map first, extend only as a last resort.

2. **Second menu, not replacement.** Do NOT hide the Sales menu, do NOT remove default product views. Create a **parallel** top-level menu (e.g. "Trafika") with simplified actions. Admins see both menus; content editors see only the simplified one.

3. **Simplified views filter, not mutilate.** The content-editor form view is a new view pointing at `product.template`, not an inheritance of the default form view. Building a new view is cleaner than stripping a complex inherited one.

4. **Security via groups + domain filters.** Content editors get a new group `module.group_content_editor`. The simplified menu is restricted to that group via `groups` on the `ir.ui.menu` record. Optionally, an `ir.rule` restricts which `product.template` records they can see (e.g. `domain="[('is_published', '=', True)]"` so they only work with published-website products).

5. **Idempotent seed import.** Importing seed data must be safe to re-run. Use `search` + `write`/`create` with a stable external identifier (e.g. product name or a custom `default_code`).

6. **No `x_` studio fields.** If you absolutely must add a field, add it as a real Python field in the new module. `x_` fields are a Studio-only pattern and harder to version-control.

## Workflow

### Step 1: Audit the source admin

Read the web application's admin code and build a catalog:

```
{
  "source_type": "nextjs",
  "source_admin_path": "src/app/admin/",
  "data_models": {
    "Product": {
      "prisma_schema": "...",
      "fields": ["id", "name", "description", "price", "image", "category", "subcategory", "badge", "stock", "active"],
      "list_view": "src/app/admin/products/page.tsx",
      "form_view": "src/app/admin/products/[id]/page.tsx",
      "api_routes": ["GET /api/products", "POST /api/products", "PATCH /api/products/[id]", "DELETE /api/products/[id]"]
    },
    "Category": {
      "...": "..."
    }
  },
  "authentication": {
    "method": "cookie + /api/auth",
    "admin_users": "seeded in prisma"
  },
  "upload_endpoint": "/api/upload (Vercel Blob)"
}
```

Ask the user if anything is unclear. Common questions:

- "Which fields from your `Product` model do you actively edit? I'll show only those."
- "Are there any computed/derived fields (e.g. price with VAT) that should be read-only in the Odoo view?"
- "Do you want published/unpublished toggling integrated with `is_published` so the website reflects it immediately?"

### Step 2: Map source fields to Odoo

Use `references/prisma-to-odoo-mapping.md` as the primary reference. For a Prisma `Product` model, the typical mapping is:

| Prisma field | Odoo `product.template` field | Notes |
|---|---|---|
| `name: String` | `name` | Direct |
| `description: String` | `description_sale` (short) or `website_description` (HTML) | Pick based on length/format |
| `price: String` | `list_price` | Convert string to float on import |
| `image: String` (URL) | `image_1920` (binary) | Download and base64-encode |
| `category: String` | `public_categ_ids` (Many2many to `product.public.category`) | Create categories on-the-fly |
| `subcategory: String` | Second `public_categ_ids` entry | Same field, multiple values |
| `badge: String` | `website_ribbon_id` (Many2one to `product.ribbon`) | Map to existing ribbons or create |
| `stock: Int` | `qty_available` (computed from `stock.quant`) OR custom if stock module not installed | Depends on `depends` list |
| `active: Boolean` | `active` + `is_published` | `active` gates Odoo, `is_published` gates website |
| `createdAt` | `create_date` | Auto |
| `updatedAt` | `write_date` | Auto |

**Report to the user** the full mapping before generating anything. Let them correct or refine.

### Step 3: Scaffold the module

```
<brand>_web_catalog/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── product_template.py          # Only if custom fields are truly needed
├── views/
│   ├── product_template_views.xml   # Simplified form / list / kanban
│   ├── product_category_views.xml   # Simplified category views (optional)
│   └── menu.xml                      # Top-level menu + actions
├── security/
│   ├── ir.model.access.csv
│   ├── security_groups.xml           # group_content_editor definition
│   └── record_rules.xml              # Optional ir.rule for published-only scope
├── data/
│   └── seed_products.xml             # Optional: initial seed from the web app
└── static/
    └── description/
        └── icon.png
```

**Technical module name:** `<brand>_web_catalog`, NOT `theme_<brand>_admin`. Theme modules have auto-conversion rules that break `ir.model.access.csv` and regular records. The catalog module is a **plain** module with standard `ir.*` models; the theme module stays separate.

### Step 4: Manifest

```python
{
    'name': '<Brand> Web Catalog',
    'version': '18.0.1.0.0',
    'category': 'Website',
    'summary': 'Simplified product catalog management for the <Brand> website',
    'description': """
Provides a dedicated top-level menu for <Brand> content editors to manage
website products via a simplified form that shows only web-visible fields.
Reuses standard product.template — content editors and sales staff share
the same product records, just viewed through different lenses.
    """,
    'author': '<author>',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'website_sale',  # product.template, product.public.category, product.ribbon
        # 'stock',       # Uncomment if you want qty_available in the view
    ],
    'data': [
        'security/security_groups.xml',
        'security/ir.model.access.csv',
        'security/record_rules.xml',
        'views/product_template_views.xml',
        'views/product_category_views.xml',
        'views/menu.xml',
        # 'data/seed_products.xml',  # Uncomment after generating seed
    ],
    'installable': True,
    'application': True,  # Makes the top-level menu appear in the apps drawer
    'auto_install': False,
}
```

**Why `website_sale` and not just `website` + `product`?**  The `product.public.category`, `product.ribbon`, and `is_published` field on `product.template` all live in `website_sale`. Using them requires the dependency. If the user will never use Odoo eCommerce, an alternative is to create a `<brand>.web.category` model — but that's usually overkill. Prefer `website_sale` unless the user objects.

### Step 5: Security group

See `references/security-group.md`. Key records:

```xml
<!-- security/security_groups.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <record id="module_category_web_catalog" model="ir.module.category">
        <field name="name"><Brand> Web Catalog</field>
        <field name="sequence">20</field>
    </record>

    <record id="group_content_editor" model="res.groups">
        <field name="name">Content Editor</field>
        <field name="category_id" ref="module_category_web_catalog"/>
        <field name="comment">Users in this group can manage website products via the simplified <Brand> menu.</field>
    </record>

    <record id="group_content_manager" model="res.groups">
        <field name="name">Content Manager</field>
        <field name="category_id" ref="module_category_web_catalog"/>
        <field name="implied_ids" eval="[(4, ref('group_content_editor'))]"/>
        <field name="comment">Managers can also unlink products and manage categories.</field>
    </record>

</data>
</odoo>
```

### Step 6: Simplified views

See `references/simplified-views.md`. The key pattern is **a new view, not an inheritance** of the default product form. Odoo's default `product.template_only_form_view` has 200+ fields; inheriting and hiding 180 of them is worse than building a fresh one.

```xml
<!-- views/product_template_views.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>

    <!-- Simplified form: only web-visible fields -->
    <record id="view_web_catalog_product_form" model="ir.ui.view">
        <field name="name"><brand>.web.catalog.product.form</field>
        <field name="model">product.template</field>
        <field name="priority">99</field>  <!-- High number = low priority, stays out of sales flow -->
        <field name="arch" type="xml">
            <form string="Product">
                <header>
                    <button name="action_publish"
                            type="object"
                            string="Publish on Website"
                            class="oe_highlight"
                            invisible="is_published"/>
                    <button name="action_unpublish"
                            type="object"
                            string="Unpublish"
                            invisible="not is_published"/>
                </header>
                <sheet>
                    <field name="image_1920" widget="image" class="oe_avatar"/>
                    <div class="oe_title">
                        <label for="name" string="Product Name"/>
                        <h1><field name="name" placeholder="Product name"/></h1>
                    </div>

                    <group>
                        <group string="Web Visibility">
                            <field name="is_published" widget="boolean_toggle"/>
                            <field name="active" widget="boolean_toggle"/>
                            <field name="website_ribbon_id"
                                   options="{'no_create_edit': False}"/>
                        </group>
                        <group string="Pricing">
                            <field name="list_price" widget="monetary"/>
                            <field name="currency_id" invisible="1"/>
                        </group>
                    </group>

                    <group string="Categorization">
                        <field name="public_categ_ids"
                               widget="many2many_tags"
                               options="{'color_field': 'color', 'no_create_edit': False}"/>
                    </group>

                    <notebook>
                        <page string="Short Description" name="short_description">
                            <field name="description_sale" placeholder="Brief description shown in product cards..."/>
                        </page>
                        <page string="Full Description" name="full_description">
                            <field name="website_description"
                                   widget="html"
                                   options="{'style-inline': true}"/>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>

    <!-- Simplified list -->
    <record id="view_web_catalog_product_list" model="ir.ui.view">
        <field name="name"><brand>.web.catalog.product.list</field>
        <field name="model">product.template</field>
        <field name="priority">99</field>
        <field name="arch" type="xml">
            <list string="Website Products">
                <field name="image_128" widget="image" options="{'size': [32, 32]}"/>
                <field name="name"/>
                <field name="public_categ_ids" widget="many2many_tags"/>
                <field name="list_price" widget="monetary"/>
                <field name="currency_id" column_invisible="True"/>
                <field name="is_published" widget="boolean_toggle"/>
                <field name="active" widget="boolean_toggle"/>
            </list>
        </field>
    </record>

    <!-- Kanban for visual editors -->
    <record id="view_web_catalog_product_kanban" model="ir.ui.view">
        <field name="name"><brand>.web.catalog.product.kanban</field>
        <field name="model">product.template</field>
        <field name="priority">99</field>
        <field name="arch" type="xml">
            <kanban>
                <field name="id"/>
                <field name="name"/>
                <field name="list_price"/>
                <field name="currency_id"/>
                <field name="image_512"/>
                <field name="is_published"/>
                <templates>
                    <t t-name="kanban-box">
                        <div class="oe_kanban_global_click o_kanban_record">
                            <div class="o_kanban_image">
                                <img t-att-src="kanban_image('product.template', 'image_512', record.id.raw_value)"/>
                            </div>
                            <div class="oe_kanban_details">
                                <strong><field name="name"/></strong>
                                <div><field name="list_price" widget="monetary"/></div>
                                <div>
                                    <span t-if="record.is_published.raw_value" class="badge text-bg-success">Published</span>
                                    <span t-if="!record.is_published.raw_value" class="badge text-bg-secondary">Draft</span>
                                </div>
                            </div>
                        </div>
                    </t>
                </templates>
            </kanban>
        </field>
    </record>

    <!-- Search view with published filter pre-applied -->
    <record id="view_web_catalog_product_search" model="ir.ui.view">
        <field name="name"><brand>.web.catalog.product.search</field>
        <field name="model">product.template</field>
        <field name="arch" type="xml">
            <search>
                <field name="name"/>
                <field name="public_categ_ids"/>
                <filter name="published" string="Published"
                        domain="[('is_published', '=', True)]"/>
                <filter name="draft" string="Draft"
                        domain="[('is_published', '=', False)]"/>
                <filter name="archived" string="Archived"
                        domain="[('active', '=', False)]"/>
                <group expand="0" string="Group By">
                    <filter name="group_category" string="Category"
                            context="{'group_by': 'public_categ_ids'}"/>
                </group>
            </search>
        </field>
    </record>

</odoo>
```

### Step 7: Action + menu

```xml
<!-- views/menu.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>

    <!-- Window action — uses the simplified views explicitly -->
    <record id="action_web_catalog_products" model="ir.actions.act_window">
        <field name="name">Website Products</field>
        <field name="res_model">product.template</field>
        <field name="view_mode">kanban,list,form</field>
        <field name="search_view_id" ref="view_web_catalog_product_search"/>
        <field name="context">{
            'default_is_published': True,
            'default_sale_ok': True,
            'default_purchase_ok': False,
        }</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">
                Add a product to your website
            </p>
            <p>
                Create, edit, and publish products shown on the <Brand> website.
            </p>
        </field>
    </record>

    <!-- Explicit view binding to force our simplified views -->
    <record id="action_web_catalog_products_kanban" model="ir.actions.act_window.view">
        <field name="sequence">1</field>
        <field name="view_mode">kanban</field>
        <field name="view_id" ref="view_web_catalog_product_kanban"/>
        <field name="act_window_id" ref="action_web_catalog_products"/>
    </record>
    <record id="action_web_catalog_products_list" model="ir.actions.act_window.view">
        <field name="sequence">2</field>
        <field name="view_mode">list</field>
        <field name="view_id" ref="view_web_catalog_product_list"/>
        <field name="act_window_id" ref="action_web_catalog_products"/>
    </record>
    <record id="action_web_catalog_products_form" model="ir.actions.act_window.view">
        <field name="sequence">3</field>
        <field name="view_mode">form</field>
        <field name="view_id" ref="view_web_catalog_product_form"/>
        <field name="act_window_id" ref="action_web_catalog_products"/>
    </record>

    <!-- Top-level menu — content editors see this instead of Sales -->
    <menuitem id="menu_web_catalog_root"
              name="<Brand>"
              sequence="15"
              web_icon="<brand>_web_catalog,static/description/icon.png"
              groups="group_content_editor"/>

    <menuitem id="menu_web_catalog_products"
              name="Products"
              parent="menu_web_catalog_root"
              action="action_web_catalog_products"
              sequence="10"/>

    <menuitem id="menu_web_catalog_categories"
              name="Categories"
              parent="menu_web_catalog_root"
              action="action_web_catalog_categories"
              sequence="20"/>

</odoo>
```

**`groups="group_content_editor"`** on the root menu means only users in that group see it. Admins see both Sales AND the <Brand> menu because admins typically belong to `base.group_system` which inherits everything.

### Step 8: ir.model.access.csv

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_product_template_editor,product.template editor,product.model_product_template,<brand>_web_catalog.group_content_editor,1,1,1,0
access_product_template_manager,product.template manager,product.model_product_template,<brand>_web_catalog.group_content_manager,1,1,1,1
access_product_public_category_editor,product.public.category editor,website_sale.model_product_public_category,<brand>_web_catalog.group_content_editor,1,1,1,0
access_product_public_category_manager,product.public.category manager,website_sale.model_product_public_category,<brand>_web_catalog.group_content_manager,1,1,1,1
access_product_ribbon_editor,product.ribbon editor,website_sale.model_product_ribbon,<brand>_web_catalog.group_content_editor,1,0,0,0
access_product_ribbon_manager,product.ribbon manager,website_sale.model_product_ribbon,<brand>_web_catalog.group_content_manager,1,1,1,1
```

**Note:** editors can create/edit products but NOT delete them (perm_unlink=0). Managers can. Adjust based on the user's requirements.

### Step 9: Record rule (optional but recommended)

```xml
<!-- security/record_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <!-- Content editors only see products marked for the website (sale_ok=True OR is_published=True).
         This prevents them from accidentally modifying internal-only products from Manufacturing. -->
    <record id="rule_content_editor_product_template" model="ir.rule">
        <field name="name">Content editors: website products only</field>
        <field name="model_id" ref="product.model_product_template"/>
        <field name="domain_force">['|', ('is_published', '=', True), ('sale_ok', '=', True)]</field>
        <field name="groups" eval="[(4, ref('group_content_editor'))]"/>
        <field name="perm_read" eval="True"/>
        <field name="perm_write" eval="True"/>
        <field name="perm_create" eval="True"/>
        <field name="perm_unlink" eval="True"/>
    </record>

</data>
</odoo>
```

### Step 10: Optional custom fields and methods

Only add these if the mapping in Step 2 identified fields the standard model does NOT already cover. Common examples:

```python
# models/product_template.py
from odoo import models, fields, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Only add fields that DON'T already exist. Verify first!
    # Example: the Prisma model had a "subtitle" field that product.template doesn't have.
    website_subtitle = fields.Char(
        string='Website Subtitle',
        translate=True,
        help='Short tagline shown under the product name on the website.',
    )

    def action_publish(self):
        """Called from the simplified form button."""
        self.write({'is_published': True})

    def action_unpublish(self):
        self.write({'is_published': False})
```

**If you don't need custom fields or methods**, omit `models/product_template.py` entirely — the module can be view+security only.

### Step 11: Seed import

See `references/seed-import.md` for the full pattern. Short version: generate a `data/seed_products.xml` from the JSON seed produced by `web-to-static`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <record id="seed_category_cigars" model="product.public.category">
        <field name="name">Cigars</field>
    </record>

    <record id="seed_product_cohiba_robusto" model="product.template">
        <field name="name">Cohiba Robusto</field>
        <field name="list_price">450.0</field>
        <field name="description_sale">Classic Cuban cigar</field>
        <field name="sale_ok" eval="True"/>
        <field name="is_published" eval="True"/>
        <field name="public_categ_ids" eval="[(4, ref('seed_category_cigars'))]"/>
        <field name="image_1920" type="base64" file="<brand>_web_catalog/static/src/img/products/cohiba-robusto.jpg"/>
    </record>

    <!-- ... one record per product ... -->

</data>
</odoo>
```

**For large seeds (hundreds of products)**, use a one-off Python script that runs via `odoo shell` and loads from the JSON directly. The XML approach is fine for up to ~50 records.

### Step 12: Validate install

1. `docker compose stop web`
2. `docker compose run --rm -T web odoo -i <brand>_web_catalog --stop-after-init -d <db>`
3. Check install log for errors (missing field references, XML ID conflicts, security group conflicts).
4. `docker compose start web`
5. Log in as admin → verify the <Brand> menu appears alongside Sales.
6. Create a test user, assign only `group_content_editor`, log in as that user → verify they see ONLY the <Brand> menu (no Sales, no Inventory).
7. Create, edit, publish a product through the simplified form.
8. Open the same product through Sales → Products → verify it's the SAME record (no duplication, no parallel model).

## Key Gotchas

- **`theme_*` modules CAN'T host `ir.model.access.csv`** — that's the whole reason this is a separate plain module, not part of the theme. Theme modules auto-convert `ir.*` records to `theme.ir.*`, which breaks access control.
- **`product.template` vs `product.product`** — the template is the user-facing model in forms/lists, variants live on `product.product`. Always use `product.template` for the simplified catalog unless the user specifically manages variants.
- **`website_sale` dependency is non-trivial** — installs eCommerce features. If the user will NEVER sell online, ask first. Alternative: depend only on `website` + create a `<brand>.web.category` model for category-only use.
- **`image_1920` is binary**, not URL. Seed import must base64-encode the image data.
- **Menu `groups` restriction is additive** — if the user belongs to multiple groups, any one of them matching shows the menu. Ensure admins belong to a group that matches (`base.group_system` usually covers it).
- **Record rules combine with AND** — if you add an ir.rule with `domain_force`, it's applied on TOP of model-level access rights. A user denied by the rule sees no records, even if they have model-level read access.
- **Don't override `product.template_only_form_view`** — that's the sales form, widely used. Use `priority` 99 on a new view to avoid Odoo picking it as the default for Sales users.
- **`action.view_mode` order** is critical — Odoo picks the first view listed. Put `kanban,list,form` so content editors land on the visual kanban by default.
- **Context keys `default_is_published: True`** in the action mean new products created from the menu start as published. Drop this if the user prefers draft-by-default.
- **Ribbons (`website_ribbon_id`) require existing records** — the default install ships a few (SALE, NEW). If the source data uses custom badges like "LIMITED", "EXCLUSIVE", create corresponding `product.ribbon` records in `data/seed_ribbons.xml`.
