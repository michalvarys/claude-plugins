---
name: odoo-i18n
description: |
  Add multi-language (i18n) support to Odoo 18 modules — PO files, JSONB translations, JS _t(), email templates, website language configuration, and XML-RPC page translations. Use this skill when the user wants to translate an Odoo module, translate an existing Odoo page via API, add language support, create PO files, internationalize JS code, or make email templates multilingual. Trigger on: "translate", "i18n", "translation", "PO file", "language", "multilingual", "překlad", "přeložit", "jazykové mutace", "vícejazyčný", "lokalizace", "internationalization", "_t()", "multi-language", "update_field_translations", "xml_translate", "translate page", "přeložit stránku".
---

# Odoo 18 Internationalization (i18n)

Add complete multi-language support to Odoo 18 modules. This covers Python model strings, QWeb templates, JavaScript UI, email templates, and website language configuration.

Read `references/i18n-patterns.md` for exact patterns, PO file format, and examples before writing any translation code.

Read `references/xmlrpc-page-translation.md` when translating existing Odoo pages remotely via XML-RPC API (using `update_field_translations` for `xml_translate` fields like `arch_db`).

## Core Principles

### 1. Odoo 18 uses JSONB — NOT ir_translation

Odoo 18 removed the `ir_translation` table. All translatable fields are stored as JSONB columns with language keys:
```json
{"en_US": "Hello", "cs_CZ": "Ahoj", "uk_UA": "Привіт"}
```

This applies to ALL fields with `translate=True`: `name`, `description`, `body_html`, `arch_db`, etc.

### 2. Source language is always en_US

Even if your primary content is in another language (e.g., Czech), the JSONB key for the source text is `en_US`. PO files translate FROM the source (English) TO the target language.

### 3. PO file line references MUST include line numbers

Odoo 18's PO parser requires `:line_number` suffix on `code:` references. Without it, you get `ValueError: invalid literal for int()`.

```
# CORRECT:
#: code:addons/my_module/static/src/js/main.js:0

# WRONG (will crash):
#: code:addons/my_module/static/src/js/main.js
```

Use `:0` when the exact line number is unknown.

## Translation Workflow

### Step 1: Identify translatable strings

1. **Python models**: `_('string')` in selection labels, field strings, error messages
2. **QWeb templates**: Text nodes in `<template>` elements (auto-extracted)
3. **JavaScript**: Strings wrapped in `_t('string')` from `@web/core/l10n/translation`
4. **Email templates**: `name`, `subject`, `body_html` fields (all stored as JSONB)

### Step 2: Make strings translatable in code

Follow the patterns in `references/i18n-patterns.md`:
- Python: `from odoo import _` → `_('Translatable string')`
- JavaScript: `import { _t } from "@web/core/l10n/translation"` → `_t("Translatable string")`
- QWeb: Text in templates is auto-extracted (no changes needed)
- Email templates: Set `<field name="lang">{{ object.lang or 'cs_CZ' }}</field>`

### Step 3: Create PO files

Create `i18n/` directory in the module with:
- `module_name.pot` — POT template (optional but good practice)
- `cs.po` — Czech translation
- `uk.po` — Ukrainian translation
- `en_US.po` — English (for theme modules where source is not English)

### Step 4: Configure website languages

For website modules, ensure target languages are:
1. Active in `res_lang`
2. Added to `website_lang_rel` (NOT `website_res_lang_rel` — that table doesn't exist)
3. Loaded with `--load-language` and `--i18n-overwrite` flags

**Preferred approach:** Create a `settings_*` companion module with XML data file that activates languages and sets website config. See `references/i18n-patterns.md` section 6, Option A.

**CRITICAL Odoo 18 change:** `base.language.install` wizard uses `lang_ids` (Many2many), NOT `lang` (Selection as in Odoo 16/17). Using the old `lang` field throws `ValueError: Invalid field 'lang' on model 'base.language.install'`.

### Step 5: Load translations

```bash
python3 odoo-bin -d dbname -u module_name --stop-after-init \
  --load-language=cs_CZ,uk_UA --i18n-overwrite
```

## Translating Existing Pages via XML-RPC API

When you need to translate an existing Odoo website page remotely (without CLI access), use the XML-RPC `update_field_translations` method. This is the ONLY correct approach for `xml_translate` fields like `arch_db` on `ir.ui.view`.

Read `references/xmlrpc-page-translation.md` for the complete workflow, code examples, and pitfall documentation.

### Quick Summary

1. **Find the view ID** — search `website.page` by URL, get `view_id`
2. **Extract all translatable terms** — call `get_field_translations(view_id, 'arch_db')`, filter by target lang
3. **Build mapping** — `{exact_source_string: translated_string}` for each term
4. **Apply** — call `update_field_translations([view_id], 'arch_db', {'cs_CZ': mapping})`
5. **Verify** — call `get_field_translations` again, count empty vs translated

### Critical Rules

- **NEVER use `write()` with language context** for `xml_translate` fields — it overwrites the base content
- **Source strings must match exactly** — same whitespace, unicode chars, HTML structure
- **Identity translations are silently skipped** — "FAQ" → "FAQ" won't be stored, but displays correctly via fallback
- **HTML structure must be preserved** — only change text content, never add/remove tags

## Key Gotchas

1. **`noupdate=True` blocks template updates**: If `ir_model_data` has `noupdate=True` for email templates, module upgrade won't overwrite them. Use direct SQL for production fixes.

2. **Theme modules auto-create `theme.ir.ui.view`**: `<template>` tags in theme modules create `theme.ir.ui.view` records, NOT `ir.ui.view`. Translation PO files reference `model_terms:theme.ir.ui.view,arch`.

3. **JS translations need module upgrade**: After creating PO files with `code:` references, run module upgrade with `--i18n-overwrite` to load them.

4. **Email template `lang` field**: Set `<field name="lang">{{ object.lang or 'cs_CZ' }}</field>` to enable per-record language selection. Store the customer's language on the model.

5. **Missing DB columns after upgrade**: If new fields are added but DB columns aren't created during upgrade, use manual `ALTER TABLE` as a fallback. Stale `__pycache__` can cause this.

6. **Per-website view copies don't translate text after self-closing tags (CRITICAL)**: When a `theme.ir.ui.view` is copied to a per-website `ir.ui.view` (with `website_id` set), Odoo's translation loader fails to translate text nodes inside `<a>` elements that contain a self-closing child element before the text. For example:
   ```xml
   <a href="/"><i class="fa fa-home me-2"/>Home</a>
   ```
   The `Home` text node will NOT be translated even though the PO file has `msgid "Home"` with the correct `model_terms:theme.ir.ui.view,arch:` reference. The master `theme.ir.ui.view` may get the translation, but the per-website `ir.ui.view` copy retains the English text.

   **Affected pattern:** `<a>` containing `<i class="..."/>text</a>` — the self-closing `<i/>` before the text node breaks Odoo's XML text-node extraction during theme copy.

   **Not affected:** Text in simple elements like `<h6>`, `<span>`, `<p>` without preceding self-closing children — these translate normally.

   **Fix:** After module upgrade with `--i18n-overwrite`, verify the per-website view's `arch_db->>'cs_CZ'` in the database. If link texts remain untranslated, apply a direct SQL `UPDATE` using chained `replace()` calls on the `arch_db` JSONB:

   ```sql
   UPDATE ir_ui_view
   SET arch_db = jsonb_set(
       arch_db::jsonb,
       '{cs_CZ}',
       to_jsonb(
           replace(
           replace(
               arch_db::jsonb->>'cs_CZ',
               '<i class="fa fa-home me-2"/>Home</a>',
               '<i class="fa fa-home me-2"/>Úvod</a>'
           ),
               '<i class="fa fa-cubes me-2"/>Products</a>',
               '<i class="fa fa-cubes me-2"/>Produkty</a>'
           )
       )
   )
   WHERE key = 'theme_xxx.vx_footer' AND website_id IS NOT NULL;
   ```

   **Prevention:** After every theme module upgrade that includes translations, always run:
   ```bash
   docker compose exec -T db psql -U <user> -d <db> -c "
   SELECT key,
       substring(arch_db::jsonb->>'cs_CZ' from 1 for 200) as cs_preview
   FROM ir_ui_view
   WHERE key LIKE 'theme_%' AND website_id IS NOT NULL;"
   ```
   And spot-check that translated text appears in the `cs_CZ` arch.
