# Security Group Pattern

How to create a `group_content_editor` group that sees ONLY the simplified <Brand> menu, while admins see both Sales and <Brand>.

## Concepts

Odoo's security has three layers, applied in this order:

1. **Groups** (`res.groups`) — membership determines which menus/views/actions the user sees.
2. **Model access** (`ir.model.access`) — per-group CRUD permissions on each model (CSV file).
3. **Record rules** (`ir.rule`) — per-group domain filters restricting which records a user can access.

For the web admin bridge, we use all three layers.

## Defining the groups

```xml
<!-- security/security_groups.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <!-- Category — appears as a section in Settings → Users → Access Rights -->
    <record id="module_category_web_catalog" model="ir.module.category">
        <field name="name"><Brand> Web Catalog</field>
        <field name="description">Manage website products through a simplified interface.</field>
        <field name="sequence">20</field>
    </record>

    <!-- Editor — can create/edit products via the <Brand> menu, cannot delete -->
    <record id="group_content_editor" model="res.groups">
        <field name="name">Content Editor</field>
        <field name="category_id" ref="module_category_web_catalog"/>
        <field name="comment">
            Users in this group can manage website products through the simplified
            <Brand> menu. They cannot delete products or access Sales/Inventory menus.
        </field>
    </record>

    <!-- Manager — implies Editor + delete permissions + category management -->
    <record id="group_content_manager" model="res.groups">
        <field name="name">Content Manager</field>
        <field name="category_id" ref="module_category_web_catalog"/>
        <field name="implied_ids" eval="[(4, ref('group_content_editor'))]"/>
        <field name="comment">
            Content managers inherit all editor rights plus the ability to delete
            products and manage the category hierarchy.
        </field>
    </record>

    <!-- Optional: Publisher — can only publish/unpublish, not edit content -->
    <!-- Use this pattern if the workflow requires a separate review/approval step. -->
    <!--
    <record id="group_content_publisher" model="res.groups">
        <field name="name">Content Publisher</field>
        <field name="category_id" ref="module_category_web_catalog"/>
    </record>
    -->

</data>
</odoo>
```

### `implied_ids` explained

When group A has `implied_ids = [group B]`:

- Every user in A is automatically considered a member of B as well.
- Granting A grants B transparently.
- This is how Odoo builds privilege hierarchies: `sales_manager` implies `sales_user` implies `base.group_user`.

In our pattern, `group_content_manager` implies `group_content_editor`, so managers get every editor permission automatically. Set up each model access rule only twice (editor + manager), not three times.

## Model access (ir.model.access.csv)

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_product_template_editor,product.template editor,product.model_product_template,<brand>_web_catalog.group_content_editor,1,1,1,0
access_product_template_manager,product.template manager,product.model_product_template,<brand>_web_catalog.group_content_manager,1,1,1,1
access_product_public_category_editor,product.public.category editor,website_sale.model_product_public_category,<brand>_web_catalog.group_content_editor,1,1,1,0
access_product_public_category_manager,product.public.category manager,website_sale.model_product_public_category,<brand>_web_catalog.group_content_manager,1,1,1,1
access_product_ribbon_editor,product.ribbon editor,website_sale.model_product_ribbon,<brand>_web_catalog.group_content_editor,1,0,0,0
access_product_ribbon_manager,product.ribbon manager,website_sale.model_product_ribbon,<brand>_web_catalog.group_content_manager,1,1,1,1
access_product_image_editor,product.image editor,product.model_product_image,<brand>_web_catalog.group_content_editor,1,1,1,0
access_product_image_manager,product.image manager,product.model_product_image,<brand>_web_catalog.group_content_manager,1,1,1,1
```

### Field-by-field breakdown

| Column | Meaning | Example |
|---|---|---|
| `id` | Unique XML ID for the rule | `access_product_template_editor` |
| `name` | Human-readable description | `product.template editor` |
| `model_id:id` | XML ID of the model access target. Format: `<module>.model_<model_name_with_underscores>` | `product.model_product_template` |
| `group_id:id` | XML ID of the group | `<brand>_web_catalog.group_content_editor` |
| `perm_read` | 1 or 0 | `1` |
| `perm_write` | 1 or 0 | `1` |
| `perm_create` | 1 or 0 | `1` |
| `perm_unlink` | 1 or 0 | `0` (editors can't delete) |

### Finding the right `model_id:id`

```bash
# Inside odoo shell
env['ir.model'].search([('model', '=', 'product.template')]).name
# product.template

# The XML ID is `<module_that_defined_it>.model_<name>`
env.ref('product.model_product_template')
# ir.model(123,)
```

For standard Odoo models, the defining module is usually `product`, `sale`, `website_sale`, `website`, etc. Some models are defined across multiple modules — in that case, any module's XML ID works.

## Menu restriction

```xml
<!-- views/menu.xml -->
<menuitem id="menu_web_catalog_root"
          name="<Brand>"
          sequence="15"
          web_icon="<brand>_web_catalog,static/description/icon.png"
          groups="group_content_editor"/>
```

The `groups` attribute restricts menu visibility:

- Users in `group_content_editor` (or any group that implies it, like `group_content_manager`) see the menu.
- Users NOT in the group don't see the menu or any of its children.
- Admins (`base.group_system`) see everything regardless — they're a super-group.

**To hide the menu from Sales users explicitly**, no extra action needed — Sales users who aren't in `group_content_editor` simply don't see it.

**To show the menu to ALL internal users** (instead of restricting to the editor group), use `groups="base.group_user"`. This is useful if the simplified catalog is the primary way everyone at the company edits products.

## Record rules (optional scope filtering)

```xml
<!-- security/record_rules.xml -->
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <!-- Editors only see products that are website-relevant.
         This prevents them from accidentally modifying internal manufacturing parts or services. -->
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

    <!-- Optional: managers see ALL products without the filter.
         To achieve this, make the rule NOT apply to managers — rules combine with OR per group. -->

</data>
</odoo>
```

### How `ir.rule` evaluates

- Rules for a given model are OR'd together per group: if a user belongs to groups G1 and G2, and both have a rule on the model, the effective domain is `G1_rule OR G2_rule`.
- If the user is in NO group that has a rule on the model, they see all records (no filter).
- A rule with `groups` empty applies to all users globally (global rule).

**Implication:** if you put a restrictive rule on `group_content_editor` and managers imply that group, managers also inherit the restriction. To exempt managers, either:

1. Don't set `implied_ids` on the manager group (make it independent) and re-grant editor permissions manually.
2. Or give the manager group its own rule with a broader domain that OR's with the editor rule.

For the web admin bridge, option 2 is cleaner:

```xml
<record id="rule_content_manager_product_template" model="ir.rule">
    <field name="name">Content managers: all products</field>
    <field name="model_id" ref="product.model_product_template"/>
    <field name="domain_force">[(1, '=', 1)]</field>  <!-- Match everything -->
    <field name="groups" eval="[(4, ref('group_content_manager'))]"/>
</record>
```

Now managers see everything (editor rule OR manager rule = `(is_published OR sale_ok) OR True` = True).

## Assigning users to groups

In the Odoo UI: **Settings → Users & Companies → Users → [user] → Access Rights → <Brand> Web Catalog → Content Editor / Manager**.

Via XML (for demo data):

```xml
<record id="res_users_demo_editor" model="res.users">
    <field name="name">Demo Editor</field>
    <field name="login">editor@example.com</field>
    <field name="groups_id" eval="[(4, ref('<brand>_web_catalog.group_content_editor'))]"/>
</record>
```

Via Python (in a post-install hook):

```python
editor_user = env['res.users'].create({
    'name': 'Content Editor',
    'login': 'editor@example.com',
    'groups_id': [(4, env.ref('<brand>_web_catalog.group_content_editor').id)],
})
```

## Hiding the Sales menu from content editors — don't bother

A common request is "make content editors see ONLY the <Brand> menu, hide Sales". This usually isn't necessary because:

- Sales menu (`sale.sale_menu_root`) is restricted to `sales_team.group_sale_salesman_all_leads` — if the editor isn't in a sales group, they don't see Sales anyway.
- Explicitly hiding menus from other groups requires modifying the Sales module's menu records, which breaks upstream upgrades.

**Just don't add content editors to any sales group.** They'll naturally see only the menus restricted to their own groups (<Brand>) plus the always-visible base menus (Discuss, Calendar, Settings if admin).

If after installation the content editor user sees Sales anyway, check:

1. Are they accidentally in `sales_team.group_sale_salesman`? Remove them.
2. Are they in `base.group_system` (admin)? That's the super-group — it bypasses group restrictions.
3. Did they get auto-added to `base.group_user` with some sales-implying group? Check `Settings → Users → [user] → Access Rights`.

## Verifying the setup

After install, create a test user:

```python
# In odoo shell
editor = env['res.users'].create({
    'name': 'Test Editor',
    'login': 'test-editor@local.test',
    'password': 'testpass123',
    'groups_id': [(6, 0, [
        env.ref('base.group_user').id,
        env.ref('<brand>_web_catalog.group_content_editor').id,
    ])],
})
env.cr.commit()
```

Log out, log in as `test-editor@local.test` / `testpass123`:

- [ ] Top-level menu shows **<Brand>** — and NOT Sales, Inventory, Accounting.
- [ ] Discuss, Calendar, Contacts visible (base group menus).
- [ ] Click <Brand> → Products → simplified kanban loads.
- [ ] Create a product → form is the simplified one, NOT the full Sales form.
- [ ] Attempt to delete a product → should fail (no `perm_unlink`).

If anything is wrong, log in as admin and inspect `Settings → Users → Test Editor → Access Rights`. The Access Rights tab shows every group the user belongs to and why (direct vs. implied).
