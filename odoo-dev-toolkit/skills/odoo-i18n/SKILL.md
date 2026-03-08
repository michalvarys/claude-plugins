---
name: odoo-i18n
description: |
  Add multi-language (i18n) support to Odoo 18 modules — PO files, JSONB translations, JS _t(), email templates, and website language configuration. Use this skill when the user wants to translate an Odoo module, add language support, create PO files, internationalize JS code, or make email templates multilingual. Trigger on: "translate", "i18n", "translation", "PO file", "language", "multilingual", "překlad", "přeložit", "jazykové mutace", "vícejazyčný", "lokalizace", "internationalization", "_t()", "multi-language".
version: 0.1.0
---

# Odoo 18 Internationalization (i18n)

Add complete multi-language support to Odoo 18 modules. This covers Python model strings, QWeb templates, JavaScript UI, email templates, and website language configuration.

Read `references/i18n-patterns.md` for exact patterns, PO file format, and examples before writing any translation code.

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
2. Added to `website_lang_rel`
3. Loaded with `--load-language` and `--i18n-overwrite` flags

### Step 5: Load translations

```bash
python3 odoo-bin -d dbname -u module_name --stop-after-init \
  --load-language=cs_CZ,uk_UA --i18n-overwrite
```

## Key Gotchas

1. **`noupdate=True` blocks template updates**: If `ir_model_data` has `noupdate=True` for email templates, module upgrade won't overwrite them. Use direct SQL for production fixes.

2. **Theme modules auto-create `theme.ir.ui.view`**: `<template>` tags in theme modules create `theme.ir.ui.view` records, NOT `ir.ui.view`. Translation PO files reference `model_terms:theme.ir.ui.view,arch`.

3. **JS translations need module upgrade**: After creating PO files with `code:` references, run module upgrade with `--i18n-overwrite` to load them.

4. **Email template `lang` field**: Set `<field name="lang">{{ object.lang or 'cs_CZ' }}</field>` to enable per-record language selection. Store the customer's language on the model.

5. **Missing DB columns after upgrade**: If new fields are added but DB columns aren't created during upgrade, use manual `ALTER TABLE` as a fallback. Stale `__pycache__` can cause this.
