# Odoo 18 Critical Rules — Pitfalls That Break Builds or Corrupt Data

Battle-tested rules from real Odoo 18 projects. Violating these causes ParseError, install failures, runtime crashes, or data corruption. Check this file before generating any Odoo code.

## API & Field Differences (vs Odoo 17)

- `ir.cron`: no `numbercall` field (removed in v18), crons repeat by default
- Use `@api.model_create_multi` for `create()` override (not `@api.model`)
- OWL framework for frontend (not jQuery widgets)
- Cron `code` field uses `safe_eval` — NO `import` statements; put logic in a model method and call it
- `fields.Related()` does NOT exist → use `fields.Many2one(..., related='dotted.path')`
- `<act_window>` shortcut tag NOT valid → use `<record model="ir.actions.act_window">`
- `<odoo noupdate="1">` causes RelaxNG assertion error ("Element odoo has extra content: record") → use `<odoo><data noupdate="1">...</data></odoo>` instead
- `<menuitem>` directly under `<odoo>` IS valid
- `type="html"` fields: use inline XML (not CDATA)
- View mode: `list,form` (NOT `tree,form`)

## Stored Related Fields to Translated Fields = BROKEN

- ❌ `fields.Char(related='x_id.name', store=True)` where the target field has `translate=True` (e.g. `ir.model.name`) → registry inconsistency: the related field inherits `translate=True`, but its `column_type` stays cached as `varchar`. Every save then crashes with:
  ```
  psycopg2.errors.UndefinedFunction: function jsonb_path_query_first(character varying, unknown) does not exist
  ```
  Module upgrade does NOT fix it — the mismatch is deterministic and re-created on every registry load.
- ✅ Follow the stock pattern (see `mass_mailing`): relate to the non-translated technical field and don't store:
  ```python
  mailing_model_name = fields.Char(related='mailing_model_id.model', readonly=True)
  ```
- The same SQL error also appears when a field gained `translate=True` but the module was never upgraded (column stayed `varchar`). Compare `information_schema.columns` with the field definition; a module upgrade converts `varchar → jsonb` losslessly via `convert_column_translatable` (wraps values as `{'en_US': value}`).
- Debug tips:
  - The full failing SQL is logged by `odoo.sql_db` as "bad query" — read the server log to find the real column (the traceback alone doesn't name it).
  - Ground truth from `odoo-bin shell`:
    ```python
    f = env['my.model']._fields['my_field']
    print(f.translate, f.column_type, f.related, f.store)
    ```

## View Inheritance — MUST Use XPath

- ✅ `<xpath expr="//field[@name='name']" position="after">`
- ✅ `<xpath expr="//div[@class='oe_title']" position="after">`
- ❌ `<field name="name" position="after">` (causes ParseError)
- ❌ `<xpath expr="//notebook">` — fails if the parent view has no notebook
- Always inspect the parent view structure first

## One2many Fields in Views

- ❌ WRONG: inline list with fields from the related model → "Field X does not exist in model Y"
- ✅ RIGHT: define a standalone list view for the related model, then just `<field name="xxx_ids"/>` — Odoo auto-finds the list view

## Module Installation Hooks

- `post_init_hook(env)` — NOT `(cr, registry)` (that signature is for migration scripts)
- Use `env['model.name']` directly inside the hook

## Data-Destroying Operations — NEVER Do These

- **NEVER delete `ir_attachment` records** (SQL or ORM) — the table stores all uploaded files, not just cached assets. To clear the asset cache, open any page with `?debug=assets` instead.
- Invoices cannot be deleted from the database (audit trail) — only cancel/archive them.

## Translations

- All user-facing strings in JS must use `_t()` from `@web/core/l10n/translation`; then regenerate the POT and update language PO files.

## OWL Bootstrap Split

- An OWL component class and its `mountComponent()` bootstrap must live in **separate JS files** (module-loader limitation). Importing and mounting in the same file breaks asset loading.
