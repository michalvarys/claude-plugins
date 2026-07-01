# Translating Odoo Website Pages via XML-RPC API

This reference covers how to translate existing Odoo 18 website pages (QWeb views) remotely using the XML-RPC API. This is the correct approach when:

- The page already exists in Odoo and you want to add translations for another language
- You don't have CLI access to the Odoo server (no `odoo-bin` shell)
- You want to translate a `website.page` managed through Odoo's website builder

## Key Concept: xml_translate Fields

The `arch_db` field on `ir.ui.view` uses `translate=xml_translate`. This means:

- Translations work at the **TEXT NODE level**, not by replacing the whole field
- Each translatable text fragment inside the XML is a separate translation unit
- HTML structure (tags, attributes, classes) stays the same — only text content changes
- You CANNOT just `write()` the whole arch with a different language context — that **overwrites the base (EN) content**

### WRONG approach (destroys base content)

```python
# DO NOT DO THIS — it overwrites EN with CS content
models.execute_kw(DB, UID, KEY, 'ir.ui.view', 'write',
    [[view_id], {'arch_db': czech_html}],
    {'context': {'lang': 'cs_CZ'}})
```

### CORRECT approach

```python
models.execute_kw(DB, UID, KEY, 'ir.ui.view', 'update_field_translations',
    [[view_id], 'arch_db', {'cs_CZ': {
        'English source text': 'Český překlad',
        'Another source': 'Další překlad',
    }}])
```

## Complete Workflow

### Step 1: Find the view ID

```python
import xmlrpc.client

ODOO_URL = 'https://your-odoo.com'
ODOO_DB = 'your_db'
ODOO_API_KEY = 'your_api_key'
ODOO_LOGIN = 'your_login'

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object', allow_none=True)
UID = common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})

# Find the website.page by URL
pages = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'website.page', 'search_read',
    [[['url', '=', '/your-page-slug']]],
    {'fields': ['id', 'name', 'url', 'view_id']})

# page['view_id'] is [id, name] — take the ID
view_id = pages[0]['view_id'][0]
```

### Step 2: Extract all translatable terms

```python
trans = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'get_field_translations',
    [[view_id], 'arch_db'])

# Returns: [[{lang, source, value}, ...], metadata]
entries = trans[0] if isinstance(trans[0], list) else trans

# Filter to target language
target_lang = 'cs_CZ'
terms = []
for t in entries:
    if t.get('lang') == target_lang:
        terms.append({
            'source': t['source'],
            'value': t.get('value', ''),  # empty = not yet translated
        })

print(f"Total terms: {len(terms)}")
print(f"Already translated: {sum(1 for t in terms if t['value'])}")
print(f"Need translation: {sum(1 for t in terms if not t['value'])}")
```

### Step 3: Build the translation mapping

The mapping is `{exact_source_string: translated_string}`. The source strings must match **exactly** — same whitespace, same HTML tags, same unicode characters.

#### Types of translation terms

**Simple text:**
```python
"See Packages": "Zobrazit balíčky",
"How It Works": "Jak to funguje",
```

**Text with inline HTML (structure must be preserved):**
```python
'Stop paying for<br/><span class="sg-text-gradient">every single SMS</span>':
    'Přestaňte platit za<br/><span class="sg-text-gradient">každou jednu SMS</span>',
```

**Composite spans (entire block is one translation unit):**
```python
'<span class="sg-stat__num">90%</span>\n                                    <span class="sg-stat__label">SMS open rate</span>':
    '<span class="sg-stat__num">90%</span>\n                                    <span class="sg-stat__label">míra otevření SMS</span>',
```

**Select elements (all options are one translation unit):**
```python
'<select name="tech_comfort" class="sg-form__select" required="required">\n                                            <option value="" disabled="disabled" selected="selected">Select one...</option>\n                                            <option value="very-comfortable">Very comfortable — I do this regularly</option>\n                                        </select>':
    '<select name="tech_comfort" class="sg-form__select" required="required">\n                                            <option value="" disabled="disabled" selected="selected">Vyberte...</option>\n                                            <option value="very-comfortable">Velmi pohodlně — dělám to pravidelně</option>\n                                        </select>',
```

**Identity terms (source = translation):**
Terms like "1", "2", "$0.05", "FAQ", "DIY" that are the same in both languages. Odoo's `update_field_translations` silently ignores these (source == value), which is fine — Odoo falls back to the source text when no translation exists.

### Step 4: Apply translations

```python
mapping = {
    'English text': 'Český text',
    # ... all terms
}

result = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'update_field_translations',
    [[view_id], 'arch_db', {target_lang: mapping}])
# Returns True on success
```

### Step 5: Verify

```python
trans = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY,
    'ir.ui.view', 'get_field_translations',
    [[view_id], 'arch_db'])

entries = trans[0] if isinstance(trans[0], list) else trans
translated = sum(1 for t in entries if t.get('lang') == target_lang and t.get('value'))
empty = sum(1 for t in entries if t.get('lang') == target_lang and not t.get('value'))

print(f"Translated: {translated}, Empty: {empty}")
```

## Common Pitfalls

### 1. Source string mismatch (most common failure)

`update_field_translations` silently ignores any mapping key that doesn't exactly match a source term. Common causes:

- **Typographic vs ASCII characters**: Odoo may store `—` (U+2014 em dash) or `'` (U+2019 smart quote) vs your script using `--` or `'`
- **Whitespace differences**: Newlines and indentation in HTML blocks must match exactly — copy source strings from `get_field_translations` output, don't retype them
- **HTML entity encoding**: `&amp;` vs `&`, `&lt;` vs `<`

**Best practice:** Always extract exact source strings from `get_field_translations` first, then build your mapping using those exact strings as keys.

### 2. Identity translations are ignored

When source == translation (e.g., "FAQ" → "FAQ"), Odoo silently skips it. This is expected behavior — the term will display correctly because Odoo falls back to the source text.

### 3. Language must be active

The target language must be active in Odoo (`res.lang` with `active=True`). Check:

```python
langs = models.execute_kw(DB, UID, KEY, 'res.lang', 'search_read',
    [[['active', '=', True]]],
    {'fields': ['code', 'name']})
```

### 4. Large pages need batching

Pages with 100+ translation terms work fine in a single `update_field_translations` call. Odoo handles the mapping internally. No need to batch.

### 5. Translating page metadata

The `website.page` record's `name` field uses simple `translate=True` (not `xml_translate`), so you CAN use `write` with language context:

```python
models.execute_kw(DB, UID, KEY, 'website.page', 'write',
    [[page_id], {'name': 'Czech Page Name'}],
    {'context': {'lang': 'cs_CZ'}})
```

## Debugging: Finding untranslated terms

After applying translations, run verification to find what's still empty:

```python
trans = models.execute_kw(DB, UID, KEY,
    'ir.ui.view', 'get_field_translations',
    [[view_id], 'arch_db'])

entries = trans[0] if isinstance(trans[0], list) else trans
for t in entries:
    if t.get('lang') == 'cs_CZ' and not t.get('value'):
        # Print repr() to see exact unicode characters
        print(repr(t['source'][:100]))
```

Then compare with `repr()` of your mapping keys to find character-level differences.

## Translation Strategy for HTML-Heavy Pages

For pages with complex HTML (landing pages, marketing pages):

1. **Extract all terms** using `get_field_translations` and save to JSON
2. **Translate in batches** — group by section (hero, features, pricing, FAQ, form)
3. **Preserve HTML structure** — only change text content inside tags, never add/remove tags or change attributes
4. **Test on live site** — visit the page with the target locale URL prefix (e.g., `/cs_CZ/page-slug`)
5. **Handle identity terms** — accept that terms identical in both languages will show as "empty" in verification but display correctly

## Field Translation Types Reference

| Model | Field | translate type | How to translate |
|-------|-------|---------------|-----------------|
| `ir.ui.view` | `arch_db` | `xml_translate` | `update_field_translations` with per-term mapping |
| `website.page` | `name` | `True` | `write` with `context={'lang': 'xx_XX'}` |
| `slide.slide` | `html_content` | `xml_translate` | `update_field_translations` with per-term mapping |
| `product.template` | `name`, `description` | `True` | `write` with `context={'lang': 'xx_XX'}` |
| `mail.template` | `body_html` | `True` | `write` with `context={'lang': 'xx_XX'}` |
| `blog.post` | `content` | `True` | `write` with `context={'lang': 'xx_XX'}` |
