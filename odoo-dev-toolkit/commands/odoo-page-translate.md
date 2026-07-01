---
name: odoo-page-translate
description: |
  Translate an existing Odoo 18 website page into another language via XML-RPC API. Uses update_field_translations for xml_translate fields (arch_db). Accepts a page URL and target language, extracts all translatable terms, translates them, and applies the translations directly in Odoo. Trigger on: "/odoo-page-translate".
---

# Odoo Page Translate

Translate an existing Odoo website page into another language using the XML-RPC API.

Read `skills/odoo-i18n/references/xmlrpc-page-translation.md` for the technical reference on `update_field_translations`, field types, and common pitfalls.

## Input

The user provides:
- **Page URL** — e.g. `https://www.example.com/cs_CZ/my-page` or `https://www.example.com/my-page`
- **Target language** (optional) — inferred from the URL locale prefix (e.g. `/cs_CZ/` → `cs_CZ`), or ask the user

## Step 0: Get Odoo Credentials

Before doing anything, you need XML-RPC connection details. Check if the user has an `odoo-content-toolkit` reference file with credentials:

```bash
find ~/.claude/plugins -path "*/odoo-content-toolkit/references/xmlrpc-api.md" 2>/dev/null
```

If found, read it and extract `ODOO_URL`, `ODOO_DB`, `ODOO_LOGIN`, and `ODOO_API_KEY`.

If NOT found, ask the user for:

1. **Odoo URL** — the base URL of the Odoo instance (e.g. `https://www.example.com`)
2. **Database name** — the Odoo database name
3. **Login email** — the Odoo user email
4. **API key** — an Odoo API key (Settings → Users → API Keys)

Use `AskUserQuestion` to collect these. Store them for the duration of the session.

## Step 1: Parse the URL

Extract from the provided URL:
- **Base URL** — `https://www.example.com`
- **Locale prefix** — `/cs_CZ/` (if present)
- **Page slug** — `/my-page`

If the URL contains a locale prefix like `/cs_CZ/`, `/de_DE/`, `/fr_FR/`, that is the target language. If no locale prefix, ask the user which language to translate to.

## Step 2: Find the View ID

Write and execute a Python script:

```python
import xmlrpc.client

ODOO_URL = '...'
ODOO_DB = '...'
ODOO_API_KEY = '...'
ODOO_LOGIN = '...'

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object', allow_none=True)
UID = common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})

# Find website.page by URL slug
pages = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'website.page', 'search_read',
    [[['url', '=', '/my-page']]],
    {'fields': ['id', 'name', 'url', 'view_id']})

if pages:
    view_id = pages[0]['view_id'][0]
    page_id = pages[0]['id']
    print(f"Found: page_id={page_id}, view_id={view_id}, name={pages[0]['name']}")
else:
    # Try with 'like' search
    pages = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
        'website.page', 'search_read',
        [[['url', 'like', 'my-page']]],
        {'fields': ['id', 'name', 'url', 'view_id']})
    print("Pages found:", pages)
```

Also verify the target language is active:

```python
langs = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'res.lang', 'search_read',
    [[['code', '=', 'cs_CZ'], ['active', '=', True]]],
    {'fields': ['code', 'name']})
if not langs:
    print("WARNING: Target language is NOT active in Odoo!")
```

## Step 3: Extract All Translatable Terms

```python
import json

trans = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'get_field_translations',
    [[view_id], 'arch_db'])

entries = trans[0] if isinstance(trans[0], list) else trans

target_lang = 'cs_CZ'
terms = []
for t in entries:
    if t.get('lang') == target_lang:
        terms.append(t['source'])

# Save to file for reference
with open('source_terms.json', 'w', encoding='utf-8') as f:
    json.dump(terms, f, ensure_ascii=False, indent=2)

print(f"Total translatable terms: {len(terms)}")
```

Save the terms to a JSON file in the scratchpad directory. This is the source of truth — mapping keys MUST come from this file, not from retyping.

## Step 4: Build the Translation Mapping

This is the core step. For each source term, produce the translation.

### Rules for building the mapping:

1. **Use exact source strings** — copy from `source_terms.json`, do not retype
2. **Preserve HTML structure** — only change text content, never add/remove/modify tags or attributes
3. **Preserve whitespace** — newlines and indentation in multi-line HTML blocks must stay identical
4. **Skip identity terms** — terms that are the same in both languages (numbers, brand names, dollar amounts) can be included but Odoo will silently ignore them. This is fine.
5. **Handle select elements** — the entire `<select>...</select>` block is one translation unit. Translate the option text but keep `value` attributes unchanged.
6. **Handle composite spans** — blocks like `<span class="x">Text</span>\n<span class="y">Label</span>` are one unit. Translate text inside each span.

### Strategy:

- Read the page's source XML (if available locally) to understand the Czech/target content
- If no local file exists, translate the source terms directly based on page context
- Group translations by page section for clarity (hero, features, pricing, FAQ, form, etc.)
- For pages with 50+ terms, build the mapping in a Python script with comments for each section

## Step 5: Apply Translations

```python
mapping = {
    'English source': 'Translation',
    # ... all terms
}

print(f"Applying {len(mapping)} translations...")
result = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'update_field_translations',
    [[view_id], 'arch_db', {target_lang: mapping}])
print(f"Result: {result}")
```

## Step 6: Verify and Fix Mismatches

After applying, always verify:

```python
trans = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'get_field_translations',
    [[view_id], 'arch_db'])

entries = trans[0] if isinstance(trans[0], list) else trans
translated = 0
empty = 0
empty_terms = []

for t in entries:
    if t.get('lang') == target_lang:
        if t.get('value'):
            translated += 1
        else:
            empty += 1
            empty_terms.append(t['source'])

print(f"Translated: {translated}, Empty: {empty}")
```

If there are empty terms that should have been translated:

1. **Save the exact missing terms** to a JSON file
2. **Compare with `repr()`** to find character-level differences (smart quotes, em dashes, whitespace)
3. **Build a fix mapping** using the exact source strings from Odoo
4. **Re-apply** only the missing terms

Common mismatches:
- `'` (U+2019 smart quote) vs `'` (U+0027 ASCII apostrophe)
- `—` (U+2014 em dash) vs `--` (ASCII)
- `&amp;` vs `&`
- Trailing/leading whitespace differences
- Newline/indentation differences in HTML blocks

## Step 7: Final Verification

```bash
curl -s "https://www.example.com/cs_CZ/my-page" | grep -o "Expected Czech text"
```

Confirm the translated page loads correctly at the locale-prefixed URL.

## Also Translate

After translating `arch_db`, also translate the page name:

```python
models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'website.page', 'write',
    [[page_id], {'name': 'Czech Page Name'}],
    {'context': {'lang': target_lang}})
```

## Summary Output

At the end, report:
- Total terms found
- Terms translated successfully
- Terms remaining empty (and why — identity terms or genuine mismatches)
- URL to verify the translated page
