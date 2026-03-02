---
name: odoo-views
description: |
  Create and edit Odoo 18 XML views — form, list, kanban, search, calendar, pivot, graph, and inherited views. Use this skill when the user wants to create, modify, or fix any Odoo backend view. Trigger on: "create view", "form view", "list view", "kanban view", "search view", "edit view", "fix view", "XML view", "Odoo view", "upravit view", "vytvořit view", "formulářový pohled", "seznam", "kanban", "pohled", "Odoo pohled", "nový pohled", "opravit pohled", "zděděný pohled", "inherit view", "rozšířit pohled".
version: 0.1.0
---

# Odoo 18 Views

Create and modify all types of Odoo 18 backend XML views. Every view you produce is valid Odoo XML, follows naming conventions, and uses Odoo 18 patterns.

Read `references/view-patterns.md` for exact XML patterns and examples before writing any view code.

## Core Principles

### 1. Odoo 18 syntax

Odoo 18 introduced changes:
- Use `<list>` instead of `<tree>` for list views
- Use `<search>` with `<searchpanel>` for advanced filtering
- New widget names and attributes — check the reference

### 2. Consistent XML IDs

Every view, action, and menu needs a unique XML ID following the pattern:
- Views: `view_{model_underscore}_{type}` (e.g., `view_sale_order_form`)
- Actions: `action_{model_underscore}` (e.g., `action_sale_order`)
- Menus: `menu_{section}` (e.g., `menu_sale_order_main`)

### 3. Proper inheritance

When extending views from other modules, use `inherit_id` with `xpath` expressions. Never copy-paste the entire parent view.

## View Creation Workflow

### Step 1: Identify the view type

| Type | Tag | Purpose |
|------|-----|---------|
| Form | `<form>` | Detail/edit view for single record |
| List | `<list>` | Table view for multiple records (NOT `<tree>`) |
| Kanban | `<kanban>` | Card-based board view |
| Search | `<search>` | Filter and group-by definitions |
| Calendar | `<calendar>` | Date-based timeline view |
| Pivot | `<pivot>` | Pivot table analysis |
| Graph | `<graph>` | Chart visualization |
| Activity | `<activity>` | Activity scheduling view |

### Step 2: Write the view

Follow patterns in `references/view-patterns.md`. Every view is wrapped in:

```xml
<record id="view_xml_id" model="ir.ui.view">
    <field name="name">model.name.view.type</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <!-- view content -->
    </field>
</record>
```

### Step 3: Create the window action

```xml
<record id="action_model_name" model="ir.actions.act_window">
    <field name="name">Action Display Name</field>
    <field name="res_model">model.name</field>
    <field name="view_mode">list,form,kanban</field>
    <field name="help" type="html">
        <p class="o_view_nocontent_smiling_face">
            Create your first record
        </p>
    </field>
</record>
```

### Step 4: Add menu items

```xml
<!-- Top-level menu (app menu) -->
<menuitem id="menu_root"
    name="App Name"
    web_icon="module_name,static/description/icon.png"
    sequence="10"/>

<!-- Sub-menu -->
<menuitem id="menu_section"
    name="Section"
    parent="menu_root"
    sequence="10"/>

<!-- Action menu item -->
<menuitem id="menu_model_name"
    name="Model Name"
    parent="menu_section"
    action="action_model_name"
    sequence="10"/>
```

### Step 5: Validate

- [ ] All XML files wrapped in `<odoo>` root element
- [ ] XML IDs are unique within the module
- [ ] `<list>` used instead of `<tree>` (Odoo 18)
- [ ] Form views have `<sheet>` wrapper for content
- [ ] Statusbar uses `widget="statusbar"` with `statusbar_visible`
- [ ] `<chatter/>` at the bottom of forms for mail-enabled models
- [ ] Search views define at least basic field searches and group-by options
- [ ] Menu items are ordered with `sequence` attribute

## Inheritance Patterns

### Adding fields to existing views

```xml
<record id="view_partner_form_inherit_custom" model="ir.ui.view">
    <field name="name">res.partner.form.inherit.custom</field>
    <field name="model">res.partner</field>
    <field name="inherit_id" ref="base.view_partner_form"/>
    <field name="arch" type="xml">
        <xpath expr="//field[@name='email']" position="after">
            <field name="custom_field"/>
        </xpath>
    </field>
</record>
```

### xpath position options

| Position | Effect |
|----------|--------|
| `after` | Insert after the matched element |
| `before` | Insert before the matched element |
| `inside` | Append inside the matched element |
| `replace` | Replace the matched element entirely |
| `attributes` | Modify attributes of the matched element |

### Modifying attributes

```xml
<xpath expr="//field[@name='partner_id']" position="attributes">
    <attribute name="required">1</attribute>
    <attribute name="readonly">state != 'draft'</attribute>
</xpath>
```

## Output Format

Save views in `views/` directory. Use separate files for:
- Model views: `views/{model_name}_views.xml`
- Menus: `views/menu.xml`
- Inherited views: `views/{model_name}_views.xml` (in the extending module)

All XML files must start with `<?xml version="1.0" encoding="UTF-8"?>` and use `<odoo>` as root element. (Note: this is for backend view XML files, NOT for QWeb website templates which have different rules.)
