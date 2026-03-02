# Odoo 18 View Patterns Reference

## File Wrapper

Every backend view XML file uses this wrapper:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <!-- views, actions, menus go here -->
</odoo>
```

**Important:** This `<?xml?>` declaration and `<odoo>` wrapper is correct for backend view files. Do NOT confuse with QWeb website page templates which start directly with `<t t-name="...">`.

---

## Form View

```xml
<record id="view_model_name_form" model="ir.ui.view">
    <field name="name">model.name.form</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <form string="Record Name">
            <!-- Statusbar (if state field exists) -->
            <header>
                <button name="action_confirm" type="object"
                    string="Confirm" class="oe_highlight"
                    invisible="state != 'draft'"/>
                <button name="action_cancel" type="object"
                    string="Cancel"
                    invisible="state in ('done', 'cancel')"/>
                <field name="state" widget="statusbar"
                    statusbar_visible="draft,confirmed,done"/>
            </header>

            <sheet>
                <!-- Ribbon for special states -->
                <div class="oe_button_box" name="button_box">
                    <button name="action_view_related"
                        type="object" class="oe_stat_button"
                        icon="fa-list">
                        <field name="related_count" string="Related" widget="statinfo"/>
                    </button>
                </div>

                <widget name="web_ribbon" title="Archived"
                    bg_color="text-bg-danger"
                    invisible="active"/>

                <!-- Title area -->
                <div class="oe_title">
                    <label for="name"/>
                    <h1>
                        <field name="name" placeholder="Record name..."/>
                    </h1>
                </div>

                <!-- Main fields -->
                <group>
                    <group>
                        <field name="partner_id"/>
                        <field name="date"/>
                    </group>
                    <group>
                        <field name="user_id"/>
                        <field name="company_id"/>
                    </group>
                </group>

                <!-- Notebook for tabbed sections -->
                <notebook>
                    <page string="Details" name="details">
                        <field name="line_ids">
                            <list editable="bottom">
                                <field name="product_id"/>
                                <field name="quantity"/>
                                <field name="price_unit"/>
                                <field name="subtotal"/>
                            </list>
                        </field>
                    </page>
                    <page string="Notes" name="notes">
                        <field name="note" placeholder="Internal notes..."/>
                    </page>
                </notebook>
            </sheet>

            <!-- Chatter (for mail.thread / mail.activity.mixin models) -->
            <chatter/>
        </form>
    </field>
</record>
```

### Form View Rules

- Always use `<sheet>` to wrap the main content area
- `<header>` goes before `<sheet>` for status/action buttons
- `<group>` creates a two-column layout; nested `<group>` splits into halves
- Use `invisible` attribute with domain-like Python expressions (Odoo 18 style, no `attrs`)
- `<notebook>` for tabbed sections — use `name` attribute on `<page>` for inheritance
- `<chatter/>` shorthand replaces the old `<div class="oe_chatter">` pattern
- Button box goes at the top of `<sheet>` in a `<div class="oe_button_box">`

### Odoo 18 invisible/readonly/required syntax

In Odoo 18, conditional visibility uses Python-like expressions directly:

```xml
<!-- Odoo 18 (correct) -->
<field name="field_a" invisible="state != 'draft'"/>
<field name="field_b" readonly="state == 'done'"/>
<field name="field_c" required="type == 'service'"/>

<!-- Odoo 17 and earlier (WRONG for Odoo 18) -->
<field name="field_a" attrs="{'invisible': [('state', '!=', 'draft')]}"/>
```

---

## List View

```xml
<record id="view_model_name_list" model="ir.ui.view">
    <field name="name">model.name.list</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <list string="Records"
              decoration-danger="state == 'overdue'"
              decoration-success="state == 'done'"
              multi_edit="1">
            <field name="name"/>
            <field name="partner_id"/>
            <field name="date"/>
            <field name="amount" sum="Total"/>
            <field name="state"
                widget="badge"
                decoration-success="state == 'done'"
                decoration-info="state == 'draft'"
                decoration-warning="state == 'confirmed'"/>
        </list>
    </field>
</record>
```

### List View Rules

- **Use `<list>` not `<tree>`** — Odoo 18 renamed the tag
- `decoration-*` for row coloring based on conditions
- `sum`, `avg` attributes for column aggregation
- `multi_edit="1"` enables inline mass editing
- `editable="bottom"` or `editable="top"` for inline editing
- `optional="show"` or `optional="hide"` to let users toggle columns

---

## Kanban View

```xml
<record id="view_model_name_kanban" model="ir.ui.view">
    <field name="name">model.name.kanban</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <kanban default_group_by="stage_id"
                class="o_kanban_small_column"
                quick_create="true"
                records_draggable="true">
            <field name="name"/>
            <field name="partner_id"/>
            <field name="stage_id"/>
            <field name="color"/>
            <progressbar field="activity_state"
                colors='{"planned": "success", "today": "warning", "overdue": "danger"}'/>
            <templates>
                <t t-name="card">
                    <field name="color" widget="color_picker"/>
                    <div class="o_kanban_details">
                        <strong>
                            <field name="name"/>
                        </strong>
                        <div class="o_kanban_bottom_left">
                            <field name="priority" widget="priority"/>
                            <field name="activity_ids" widget="kanban_activity"/>
                        </div>
                        <div class="o_kanban_bottom_right">
                            <field name="user_id" widget="many2one_avatar_user"/>
                        </div>
                    </div>
                </t>
            </templates>
        </kanban>
    </field>
</record>
```

### Kanban Rules

- `default_group_by` sets the grouping field (typically a stage or state)
- `<progressbar>` shows activity/status distribution per column
- Use `<t t-name="card">` for the card template (Odoo 18 simplified pattern)
- `widget="many2one_avatar_user"` shows user avatar
- `widget="priority"` for star rating
- `records_draggable="true"` enables drag-and-drop between columns

---

## Search View

```xml
<record id="view_model_name_search" model="ir.ui.view">
    <field name="name">model.name.search</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <search string="Search Records">
            <!-- Search fields -->
            <field name="name"/>
            <field name="partner_id"/>
            <field name="user_id"/>

            <!-- Quick filters -->
            <filter string="My Records"
                name="my_records"
                domain="[('user_id', '=', uid)]"/>
            <filter string="Draft"
                name="draft"
                domain="[('state', '=', 'draft')]"/>
            <filter string="This Month"
                name="this_month"
                domain="[('date', '&gt;=', (context_today() - relativedelta(day=1)).strftime('%Y-%m-%d')),
                         ('date', '&lt;', (context_today() + relativedelta(months=1, day=1)).strftime('%Y-%m-%d'))]"/>
            <separator/>
            <filter string="Archived"
                name="inactive"
                domain="[('active', '=', False)]"/>

            <!-- Group by -->
            <group expand="0" string="Group By">
                <filter string="Partner"
                    name="group_partner"
                    context="{'group_by': 'partner_id'}"/>
                <filter string="State"
                    name="group_state"
                    context="{'group_by': 'state'}"/>
                <filter string="Date"
                    name="group_date"
                    context="{'group_by': 'date:month'}"/>
            </group>

            <!-- Search panel (left sidebar) -->
            <searchpanel>
                <field name="stage_id" icon="fa-tasks" enable_counters="1"/>
                <field name="user_id" select="multi" icon="fa-user" enable_counters="1"/>
            </searchpanel>
        </search>
    </field>
</record>
```

### Search View Rules

- `<field>` entries define which fields are searchable
- `<filter>` with `domain` for quick filter buttons
- `<filter>` with `context="{'group_by': ...}"` for group-by options
- `<separator/>` adds visual divider between filter groups
- `<searchpanel>` creates a left sidebar for hierarchical filtering
- Use `&gt;` and `&lt;` for `>` and `<` in XML domain expressions
- Give every filter a `name` attribute for inheritance

---

## Calendar View

```xml
<record id="view_model_name_calendar" model="ir.ui.view">
    <field name="name">model.name.calendar</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <calendar string="Records"
            date_start="date_start"
            date_stop="date_stop"
            color="user_id"
            mode="month"
            quick_create="true">
            <field name="name"/>
            <field name="partner_id"/>
            <field name="state"/>
        </calendar>
    </field>
</record>
```

---

## Pivot View

```xml
<record id="view_model_name_pivot" model="ir.ui.view">
    <field name="name">model.name.pivot</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <pivot string="Analysis">
            <field name="date" type="row" interval="month"/>
            <field name="partner_id" type="row"/>
            <field name="amount" type="measure"/>
            <field name="quantity" type="measure"/>
        </pivot>
    </field>
</record>
```

---

## Graph View

```xml
<record id="view_model_name_graph" model="ir.ui.view">
    <field name="name">model.name.graph</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <graph string="Statistics" type="bar" stacked="True">
            <field name="date" interval="month"/>
            <field name="amount" type="measure"/>
        </graph>
    </field>
</record>
```

Graph types: `bar`, `pie`, `line`.

---

## Window Action

```xml
<record id="action_model_name" model="ir.actions.act_window">
    <field name="name">Display Name</field>
    <field name="res_model">model.name</field>
    <field name="view_mode">list,form,kanban,calendar,pivot,graph</field>
    <field name="context">{'search_default_my_records': 1}</field>
    <field name="domain">[]</field>
    <field name="help" type="html">
        <p class="o_view_nocontent_smiling_face">
            Create your first record
        </p>
        <p>
            Description of what this record type is for.
        </p>
    </field>
</record>
```

### Action Tips

- `search_default_{filter_name}: 1` in context activates a search filter by default
- `view_mode` order determines tab order in the UI
- `domain` pre-filters records (e.g., `[('type', '=', 'sale')]`)
- `help` HTML shown when no records exist

---

## Common Widgets

| Widget | Field Type | Purpose |
|--------|-----------|---------|
| `statusbar` | Selection | State progression bar |
| `badge` | Selection/Char | Colored badge |
| `many2one_avatar_user` | Many2one (res.users) | User with avatar |
| `many2many_tags` | Many2many | Colored tags |
| `priority` | Selection | Star rating |
| `color_picker` | Integer | Kanban color picker |
| `percentage` | Float | Percentage display |
| `monetary` | Float + currency_id | Currency-formatted amount |
| `image` | Binary | Image display |
| `html` | Html | Rich text editor |
| `kanban_activity` | Activity | Activity icons in kanban |
| `section_and_note_one2many` | One2many | Lines with sections and notes |
| `remaining_days` | Date | Days remaining countdown |
