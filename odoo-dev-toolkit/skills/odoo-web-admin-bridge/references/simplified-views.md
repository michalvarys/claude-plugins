# Simplified Content-Editor Views

Patterns for building content-editor-friendly form / list / kanban views on top of `product.template` without breaking the standard Sales flow.

## Core rule: new view, not inheritance

Odoo's default `product.template_only_form_view` has:

- ~200 fields across a dozen notebook tabs
- Multi-warehouse stock info
- Pricelists and vendor pricelists
- Accounting tabs (income/expense accounts, tax fiscal positions)
- Manufacturing BOM tab
- Variants configuration

Inheriting and hiding 180 of these is **worse** than building a fresh form from scratch:

- Every Odoo upgrade breaks the inheritance (new fields added upstream)
- The inherited form is still computed server-side — no performance win
- The simplified UX requires a different layout, not just field hiding

**Build a fresh view with `priority="99"`** — high priority number = Odoo picks lower priorities by default. Your view is only shown when explicitly requested via an `ir.actions.act_window.view` binding.

## View priority semantics

```xml
<record id="view_product_template_form" model="ir.ui.view">
    <field name="priority">16</field>  <!-- Odoo's default -->
</record>

<record id="view_web_catalog_product_form" model="ir.ui.view">
    <field name="priority">99</field>  <!-- Your simplified form -->
</record>
```

- Lower number = higher priority = Odoo picks this when resolving `view_mode="form"` with no explicit binding.
- Your high-priority (99) form is only shown when:
  1. An `ir.actions.act_window.view` record explicitly binds it to an action (see below).
  2. The user navigates to it via a menu that opens that action.

Sales → Products continues to show the default form. The <Brand> menu shows yours.

## Explicit view binding on the action

```xml
<record id="action_web_catalog_products" model="ir.actions.act_window">
    <field name="name">Website Products</field>
    <field name="res_model">product.template</field>
    <field name="view_mode">kanban,list,form</field>
</record>

<!-- Bind each view mode to a specific view -->
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
```

The `sequence` field determines the order view mode tabs appear in the UI. `kanban` first (most visual), `list` second, `form` implicit on record click.

## Form view template

```xml
<record id="view_web_catalog_product_form" model="ir.ui.view">
    <field name="name"><brand>.web.catalog.product.form</field>
    <field name="model">product.template</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
        <form string="Website Product">

            <!-- Status bar + quick actions -->
            <header>
                <button name="action_publish"
                        type="object"
                        string="Publish"
                        class="oe_highlight"
                        invisible="is_published"/>
                <button name="action_unpublish"
                        type="object"
                        string="Unpublish"
                        invisible="not is_published"/>
                <field name="is_published" widget="statusbar" invisible="1"/>
            </header>

            <sheet>
                <!-- Archived ribbon -->
                <widget name="web_ribbon" title="Archived" bg_color="text-bg-danger"
                        invisible="active"/>

                <!-- Main image as avatar -->
                <field name="image_1920"
                       widget="image"
                       class="oe_avatar"
                       options="{'preview_image': 'image_128'}"/>

                <!-- Title + subtitle -->
                <div class="oe_title">
                    <label for="name" string="Product Name"/>
                    <h1><field name="name" placeholder="e.g. Cohiba Robusto"/></h1>
                </div>

                <!-- Primary fields — two columns -->
                <group>
                    <group string="Pricing">
                        <field name="list_price" widget="monetary" string="Price"/>
                        <field name="currency_id" invisible="1"/>
                    </group>
                    <group string="Website Visibility">
                        <field name="is_published" widget="boolean_toggle"/>
                        <field name="website_ribbon_id"
                               options="{'no_create_edit': False}"
                               placeholder="Select badge..."/>
                        <field name="active" widget="boolean_toggle"/>
                    </group>
                </group>

                <!-- Categorization -->
                <group string="Categories">
                    <field name="public_categ_ids"
                           widget="many2many_tags"
                           options="{'color_field': 'color', 'no_create_edit': False}"
                           placeholder="Add categories..."/>
                </group>

                <!-- Description — notebook for short vs. full -->
                <notebook>
                    <page string="Short Description" name="short">
                        <field name="description_sale"
                               nolabel="1"
                               placeholder="Brief description shown on product cards..."/>
                    </page>
                    <page string="Full Description" name="full">
                        <field name="website_description"
                               nolabel="1"
                               widget="html"
                               options="{'style-inline': true, 'height': 400}"/>
                    </page>
                    <page string="Gallery" name="gallery">
                        <field name="product_template_image_ids" mode="kanban">
                            <kanban>
                                <field name="image_1920"/>
                                <field name="name"/>
                                <templates>
                                    <t t-name="kanban-box">
                                        <div class="o_kanban_image">
                                            <img t-att-src="kanban_image('product.image', 'image_1920', record.id.raw_value)"/>
                                        </div>
                                        <div class="oe_kanban_details">
                                            <field name="name"/>
                                        </div>
                                    </t>
                                </templates>
                            </kanban>
                            <form>
                                <field name="name"/>
                                <field name="image_1920" widget="image"/>
                            </form>
                        </field>
                    </page>
                </notebook>
            </sheet>

            <!-- Chatter for history and messages -->
            <chatter/>
        </form>
    </field>
</record>
```

### Notes on specific widgets

- **`widget="image"` + `class="oe_avatar"`** — positions the image in the top-right of the sheet, standard Odoo pattern.
- **`widget="boolean_toggle"`** — modern switch UI, better than checkboxes for on/off semantics.
- **`widget="many2many_tags"`** — chip-style input for categories, with autocomplete. `no_create_edit: False` lets editors create new categories inline.
- **`widget="html"`** — rich-text editor for long descriptions. `style-inline: true` keeps output clean for website rendering.
- **`<chatter/>`** — Odoo 18 shorthand for the messages/activities panel. Replaces the old `<div class="oe_chatter">` pattern.
- **`<widget name="web_ribbon">`** — ribbon overlay for archived/draft states. Modern replacement for inline status badges.

## List view template

```xml
<record id="view_web_catalog_product_list" model="ir.ui.view">
    <field name="name"><brand>.web.catalog.product.list</field>
    <field name="model">product.template</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
        <list string="Website Products" multi_edit="1" sample="1">
            <field name="image_128"
                   widget="image"
                   options="{'size': [32, 32]}"
                   nolabel="1"/>
            <field name="name"/>
            <field name="public_categ_ids" widget="many2many_tags" optional="show"/>
            <field name="website_ribbon_id" optional="hide"/>
            <field name="list_price" widget="monetary" sum="Total value"/>
            <field name="currency_id" column_invisible="True"/>
            <field name="is_published" widget="boolean_toggle"/>
            <field name="active" widget="boolean_toggle" optional="show"/>
        </list>
    </field>
</record>
```

**Odoo 18 list attributes:**

- `<list>` (NOT `<tree>`) — Odoo 18 renamed the element.
- `multi_edit="1"` — enables bulk editing by selecting multiple rows and editing a field.
- `sample="1"` — shows sample data in empty state (helps new users understand the view).
- `optional="show"` / `optional="hide"` — column is shown/hidden by default but toggleable via the column chooser.
- `sum="Total value"` — footer aggregate.
- `column_invisible="True"` — column never rendered but field is loaded for other purposes (currency for monetary).

## Kanban view template

```xml
<record id="view_web_catalog_product_kanban" model="ir.ui.view">
    <field name="name"><brand>.web.catalog.product.kanban</field>
    <field name="model">product.template</field>
    <field name="priority">99</field>
    <field name="arch" type="xml">
        <kanban sample="1">
            <field name="id"/>
            <field name="name"/>
            <field name="list_price"/>
            <field name="currency_id"/>
            <field name="image_512"/>
            <field name="is_published"/>
            <field name="website_ribbon_id"/>
            <field name="public_categ_ids"/>

            <templates>
                <t t-name="kanban-box">
                    <div class="oe_kanban_global_click o_kanban_record_has_image_fill">
                        <div class="o_kanban_image_fill_left d-none d-md-block"
                             t-attf-style="background-image: url('#{kanban_image('product.template', 'image_512', record.id.raw_value)}')"/>

                        <div class="oe_kanban_details">
                            <div class="o_kanban_record_top mb-0">
                                <div class="o_kanban_record_headings">
                                    <strong class="o_kanban_record_title">
                                        <field name="name"/>
                                    </strong>
                                </div>
                            </div>

                            <div class="o_kanban_tags_section">
                                <field name="public_categ_ids" widget="many2many_tags"/>
                            </div>

                            <div class="o_kanban_record_bottom mt-2">
                                <div class="oe_kanban_bottom_left">
                                    <field name="list_price" widget="monetary"/>
                                </div>
                                <div class="oe_kanban_bottom_right">
                                    <span t-if="record.is_published.raw_value"
                                          class="badge text-bg-success">Published</span>
                                    <span t-if="!record.is_published.raw_value"
                                          class="badge text-bg-secondary">Draft</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </t>
            </templates>
        </kanban>
    </field>
</record>
```

## Search view with useful filters

```xml
<record id="view_web_catalog_product_search" model="ir.ui.view">
    <field name="name"><brand>.web.catalog.product.search</field>
    <field name="model">product.template</field>
    <field name="arch" type="xml">
        <search>
            <field name="name" string="Name or description"
                   filter_domain="['|', ('name', 'ilike', self), ('description_sale', 'ilike', self)]"/>
            <field name="public_categ_ids"/>
            <field name="website_ribbon_id"/>

            <separator/>
            <filter name="published" string="Published"
                    domain="[('is_published', '=', True)]"/>
            <filter name="draft" string="Draft"
                    domain="[('is_published', '=', False)]"/>
            <separator/>
            <filter name="with_image" string="Has image"
                    domain="[('image_1920', '!=', False)]"/>
            <filter name="without_image" string="Missing image"
                    domain="[('image_1920', '=', False)]"/>
            <separator/>
            <filter name="archived" string="Archived"
                    domain="[('active', '=', False)]"/>

            <group expand="0" string="Group By">
                <filter name="group_category" string="Category"
                        context="{'group_by': 'public_categ_ids'}"/>
                <filter name="group_ribbon" string="Badge"
                        context="{'group_by': 'website_ribbon_id'}"/>
                <filter name="group_published" string="Published Status"
                        context="{'group_by': 'is_published'}"/>
            </group>
        </search>
    </field>
</record>
```

**Default filters:** attach to the action via `context` so content editors land on "published only" by default:

```xml
<field name="context">{
    'search_default_published': 1,
    'default_is_published': True,
    'default_sale_ok': True,
}</field>
```

`search_default_<filter_name>` auto-activates a filter on load. `default_<field>` sets the initial value when creating a new record.

## What NOT to include

Deliberately omitted from the simplified form (these live in the standard Sales form for admins):

- Internal reference / barcode
- Cost (`standard_price`)
- Tax configuration
- Supplier info / purchase fields
- Manufacturing BOM
- Stock locations / reordering rules
- Pricelists
- Variants configuration
- Accounting tabs

If the content editor genuinely needs one of these (e.g. SKU for inventory lookup), add it back to the form — but treat each addition as a conscious decision, not a copy-paste from the standard form.

## Troubleshooting view issues

**Problem: Simplified form shows up in Sales → Products**
→ The view's `priority` is too low. Set it to 99 or higher.

**Problem: Odoo picks the default kanban instead of yours**
→ Missing `ir.actions.act_window.view` binding for kanban. Add explicit binding records.

**Problem: Fields missing from the form don't load**
→ Some widgets (monetary, image) require invisible companion fields (`currency_id` for monetary, `id` for kanban). Add them as `invisible="1"` or `column_invisible="True"`.

**Problem: Content editor can see the view but buttons don't work**
→ Missing `ir.model.access.csv` entries for the custom group. Add read/write for `product.template`.

**Problem: HTML widget editor doesn't load**
→ `website` is not in `depends`. HTML widget requires `web_editor` which is pulled in by `website`.
