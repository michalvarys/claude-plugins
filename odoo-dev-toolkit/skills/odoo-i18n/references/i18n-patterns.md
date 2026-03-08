# Odoo 18 i18n Patterns Reference

## 1. JSONB Translation Storage (Odoo 18)

Odoo 18 stores all translatable fields as JSONB. The `ir_translation` table no longer exists.

### How it works

```sql
-- Example: mail.template name field
SELECT name FROM mail_template WHERE id = 1;
-- Returns: {"en_US": "Booking Confirmed", "cs_CZ": "Rezervace potvrzena", "uk_UA": "Бронювання підтверджено"}

-- To query a specific language:
SELECT name->>'cs_CZ' FROM mail_template WHERE id = 1;
-- Returns: "Rezervace potvrzena"

-- To update all languages at once:
UPDATE mail_template SET name = jsonb_build_object(
    'en_US', 'Booking Confirmed',
    'cs_CZ', 'Rezervace potvrzena',
    'uk_UA', 'Бронювання підтверджено'
) WHERE id = 1;
```

### Which fields are JSONB?

Any field with `translate=True` in the Python model:
- `mail.template`: `name`, `subject`, `body_html`, `description`
- `ir.ui.view`: `arch_db`
- `product.template`: `name`, `description`, `description_sale`
- `ir.model.fields.selection`: `name`
- All `Char(translate=True)` and `Text(translate=True)` fields

### Source language key

The source text is ALWAYS stored under `en_US` key, regardless of your actual primary language. If your source content is Czech, it still goes under `en_US` in the JSONB.

## 2. PO File Format for Odoo 18

### File naming

```
module_name/
└── i18n/
    ├── module_name.pot    # POT template (optional)
    ├── cs.po              # Czech (matches cs_CZ)
    ├── uk.po              # Ukrainian (matches uk_UA)
    ├── en_US.po           # English (only for theme modules with non-English source)
    └── sk.po              # Slovak (matches sk_SK)
```

Language code mapping: `cs.po` → `cs_CZ`, `uk.po` → `uk_UA`, `sk.po` → `sk_SK`, `de.po` → `de_DE`

### PO file header

```po
# Translation of Odoo Server.
# This file contains the translation of the following modules:
# 	* module_name
#
msgid ""
msgstr ""
"Project-Id-Version: Odoo Server 18.0\n"
"Report-Msgid-Bugs-To: \n"
"POT-Creation-Date: 2026-03-08 12:00+0000\n"
"PO-Revision-Date: 2026-03-08 12:00+0000\n"
"Last-Translator: \n"
"Language-Team: Czech\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: \n"
"Language: cs\n"
"Plural-Forms: nplurals=4; plural=(n == 1 && n % 1 == 0) ? 0 : (n >= 2 && n <= 4 && n % 1 == 0) ? 1: (n % 1 != 0 ) ? 2 : 3;\n"
```

### Plural-Forms by language

```
# Czech
"Plural-Forms: nplurals=4; plural=(n == 1 && n % 1 == 0) ? 0 : (n >= 2 && n <= 4 && n % 1 == 0) ? 1: (n % 1 != 0 ) ? 2 : 3;\n"

# Ukrainian
"Plural-Forms: nplurals=4; plural=(n % 1 == 0 && n % 10 == 1 && n % 100 != 11 ? 0 : n % 1 == 0 && n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 1 : n % 1 == 0 && (n % 10 == 0 || (n % 10 >= 5 && n % 10 <= 9) || (n % 100 >= 11 && n % 100 <= 14)) ? 2 : 3);\n"

# English
"Plural-Forms: nplurals=2; plural=(n != 1);\n"

# Slovak
"Plural-Forms: nplurals=4; plural=(n == 1 && n % 1 == 0) ? 0 : (n >= 2 && n <= 4 && n % 1 == 0) ? 1: (n % 1 != 0 ) ? 2 : 3;\n"

# German
"Plural-Forms: nplurals=2; plural=(n != 1);\n"
```

### Translation entry types

#### Python model field selections
```po
#. module: bw_booking
#: model:ir.model.fields.selection,name:bw_booking.selection__bw_booking__state__pending
msgid "Awaiting confirmation"
msgstr "Čeká na potvrzení"
```

Reference format: `model:ir.model.fields.selection,name:{module}.selection__{model}__{field}__{value}`

#### Python code strings (_())
```po
#. module: bw_booking
#: code:addons/bw_booking/models/bw_booking.py:0
msgid "Can only confirm a reservation in \"Awaiting confirmation\" state."
msgstr "Lze potvrdit pouze rezervaci ve stavu \"Čeká na potvrzení\"."
```

**CRITICAL**: The `:0` at the end is REQUIRED. Without a line number, Odoo's parser throws `ValueError`.

#### JavaScript _t() strings
```po
#. module: theme_brotherswash
#: code:addons/theme_brotherswash/static/src/js/booking_form.js:0
msgid "Loading services…"
msgstr "Načítám služby…"
```

Same rule: `code:` references MUST have `:line_number` suffix (use `:0` for unknown).

#### QWeb template text (theme modules)
```po
#. module: theme_brotherswash
#: model_terms:theme.ir.ui.view,arch:theme_brotherswash.s_bwd_hero
msgid "Prémiový auto detailing &#8226; Praha 5"
msgstr "Premium auto detailing &#8226; Prague 5"
```

Reference format: `model_terms:theme.ir.ui.view,arch:{module}.{template_xml_id}`

#### QWeb template text (regular modules)
```po
#. module: website_sale
#: model_terms:ir.ui.view,arch:website_sale.cart
msgid "Shopping Cart"
msgstr "Nákupní košík"
```

### Theme module specifics

In theme modules (`theme_*`), `<template>` tags create `theme.ir.ui.view` records, NOT `ir.ui.view`. So PO references use:
- `model_terms:theme.ir.ui.view,arch:` (NOT `model_terms:ir.ui.view,arch:`)

For English PO in theme modules with non-English source text, create `en_US.po` that maps source → English:
```po
#. module: theme_brotherswash
#: model_terms:theme.ir.ui.view,arch:theme_brotherswash.s_bwd_hero
msgid "Prémiový auto detailing &#8226; Praha 5"
msgstr "Premium auto detailing &#8226; Prague 5"
```

## 3. Python Translation Patterns

### Model field strings and selections

```python
from odoo import fields, models, _

class MyModel(models.Model):
    _name = 'my.model'

    # Field string — auto-translated via ir.model.fields
    name = fields.Char(string='Name', required=True)

    # Selection with translatable labels
    state = fields.Selection([
        ('draft', _('Draft')),
        ('confirmed', _('Confirmed')),
        ('done', _('Done')),
        ('cancelled', _('Cancelled')),
    ], default='draft', tracking=True)

    # Language field for per-record language selection
    lang = fields.Char(string='Language', default='cs_CZ')
```

### Error messages

```python
from odoo.exceptions import UserError, ValidationError

def action_confirm(self):
    if self.state != 'draft':
        raise UserError(_('Can only confirm a record in "Draft" state.'))
```

### Source language convention

**Always use English as the source language in Python code**, even if the primary audience is Czech. The PO files handle translation to Czech and other languages.

## 4. JavaScript Translation Patterns

### Import and usage

```javascript
/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";
import { _t } from "@web/core/l10n/translation";

publicWidget.registry.MyWidget = publicWidget.Widget.extend({
    start: function () {
        // Simple string
        this.el.textContent = _t("Loading...");

        // String with HTML (use innerHTML carefully)
        this.el.innerHTML = '<p>' + _t("Select your services") + '</p>';

        // Labels array
        var steps = [_t("Vehicle type"), _t("Services"), _t("Contact")];

        // Conditional text
        var prefix = hasDiscount ? _t("from") + ' ' : '';

        // Error messages
        alert(_t("Please fill in all required fields."));

        // Status messages
        btn.textContent = _t("Submitting...");

        // Success message
        heading.textContent = _t("Thank you for your order!");
    },
});
```

### What to wrap in _t()

- All user-facing text: labels, buttons, headings, messages, placeholders
- Error messages and alerts
- Status indicators ("Loading...", "Submitting...")
- Success/failure messages

### What NOT to wrap in _t()

- CSS class names
- HTML tag names
- Technical identifiers
- API endpoints
- Console.log messages (developer-only)

## 5. Email Template Translation

### XML data file

```xml
<record id="mail_template_booking_pending" model="mail.template">
    <field name="name">BWD: Reservation - Pending confirmation</field>
    <field name="model_id" ref="model_bw_booking"/>
    <field name="email_from">{{ (object.env.company.email or user.email) }}</field>
    <field name="email_to">{{ object.customer_email }}</field>
    <!-- CRITICAL: lang field enables per-record language selection -->
    <field name="lang">{{ object.lang or 'cs_CZ' }}</field>
    <field name="subject">{{ object.env.company.name }} - Your reservation #{{ object.id }}</field>
    <field name="body_html"><![CDATA[
        <div>...English base template...</div>
    ]]></field>
</record>
```

The `lang` field tells Odoo which JSONB key to use when rendering. If `object.lang` is `cs_CZ`, Odoo reads `body_html->>'cs_CZ'`.

### Direct SQL update for production

When `noupdate=True` prevents XML overwrite during module upgrade, use SQL:

```sql
UPDATE mail_template SET
    body_html = jsonb_build_object(
        'en_US', '<div style="...">...English content...</div>',
        'cs_CZ', '<div style="...">...Czech content...</div>',
        'uk_UA', '<div style="...">...Ukrainian content...</div>'
    ),
    subject = jsonb_build_object(
        'en_US', '{{ object.env.company.name }} - Your reservation #{{ object.id }}',
        'cs_CZ', '{{ object.env.company.name }} - Vaše rezervace č. {{ object.id }}',
        'uk_UA', '{{ object.env.company.name }} - Ваше бронювання №{{ object.id }}'
    ),
    name = jsonb_build_object(
        'en_US', 'BWD: Reservation - Pending confirmation',
        'cs_CZ', 'BWD: Rezervace - Čeká na potvrzení',
        'uk_UA', 'BWD: Бронювання - Очікує підтвердження'
    )
WHERE id = (
    SELECT res_id FROM ir_model_data
    WHERE module = 'bw_booking' AND name = 'mail_template_booking_pending'
);
```

### Docker exec for production

```bash
# Pipe SQL file to psql inside Docker
docker compose exec -T db psql -U dbuser -d dbname < scripts/fix_mail_templates.sql
```

Note: On macOS with OrbStack, prefix with `DOCKER_HOST=` if using the OrbStack socket.

## 6. Website Language Configuration

### Activate languages via SQL

```sql
-- 1. Activate languages in res_lang
UPDATE res_lang SET active = true WHERE code IN ('cs_CZ', 'uk_UA', 'en_US');

-- 2. Add languages to website
INSERT INTO website_lang_rel (website_id, lang_id)
SELECT 1, id FROM res_lang WHERE code IN ('cs_CZ', 'uk_UA')
ON CONFLICT DO NOTHING;

-- 3. Set default language
UPDATE website SET default_lang_id = (
    SELECT id FROM res_lang WHERE code = 'cs_CZ'
) WHERE id = 1;
```

### Load translations during upgrade

```bash
python3 odoo-bin -d dbname -u module1,module2 --stop-after-init \
    --load-language=cs_CZ,uk_UA --i18n-overwrite \
    --addons-path="/app/addons,/app/custom"
```

Flags:
- `--load-language=cs_CZ,uk_UA` — loads PO files for these languages
- `--i18n-overwrite` — overwrites existing translations (important for updates)

## 7. Model Language Field Pattern

To send emails in the customer's language, add a `lang` field to your model:

```python
class BwBooking(models.Model):
    _name = 'bw.booking'

    lang = fields.Char(string='Language', default='cs_CZ')
    customer_email = fields.Char(required=True)
```

In the controller, capture the website language:

```python
from odoo import http
from odoo.http import request

class BookingController(http.Controller):
    @http.route('/api/booking/submit', type='json', auth='public', website=True)
    def api_booking_submit(self, **kw):
        vals = {
            'customer_name': kw.get('name'),
            'customer_email': kw.get('email'),
            'lang': request.env.lang or 'cs_CZ',
            # ... other fields
        }
        booking = request.env['bw.booking'].sudo().create(vals)
        return {'success': True, 'id': booking.id}
```

## 8. Complete Example: Adding 3 Languages

### Directory structure

```
my_module/
├── i18n/
│   ├── my_module.pot     # POT template
│   ├── cs.po             # Czech
│   ├── uk.po             # Ukrainian
│   └── en_US.po          # English (only if source is not English)
├── models/
│   └── my_model.py       # Python strings use _()
├── static/src/js/
│   └── widget.js          # JS strings use _t()
├── views/
│   └── templates.xml      # QWeb text auto-extracted
└── data/
    └── mail_template.xml  # Email templates with lang field
```

### Checklist

- [ ] All Python `Selection` labels use `_('English text')`
- [ ] All Python error messages use `_('English text')`
- [ ] All JS user-facing strings use `_t("English text")`
- [ ] Email templates have `<field name="lang">` set
- [ ] Model has `lang` field if email templates use per-record language
- [ ] Controller captures `request.env.lang` into model's `lang` field
- [ ] PO files created for each target language
- [ ] All `code:` PO references have `:0` line number suffix
- [ ] Theme module PO uses `model_terms:theme.ir.ui.view,arch:` (not `ir.ui.view`)
- [ ] Languages activated in `res_lang` and `website_lang_rel`
- [ ] Module upgraded with `--load-language` and `--i18n-overwrite`

## 9. Troubleshooting

### "ValueError: invalid literal for int()"
PO file `#: code:` reference is missing `:line_number`. Add `:0` suffix.

### Translations not appearing after upgrade
- Check `--i18n-overwrite` flag is set
- Check language is active in `res_lang`
- For website: check language is in `website_lang_rel`
- Clear browser cache and cookies

### Email template shows raw Jinja2 variables
The JSONB field doesn't have the correct language key. Check:
```sql
SELECT subject, body_html FROM mail_template WHERE id = X;
```
If it's a plain string instead of JSONB, update with `jsonb_build_object()`.

### Module upgrade doesn't create new DB columns
- Clear `__pycache__` in the module directory
- Restart the Odoo container
- As fallback: `ALTER TABLE my_table ADD COLUMN IF NOT EXISTS col_name type;`

### noupdate=True prevents template updates
For records with `noupdate=True` in `ir_model_data`, module upgrade skips them. Options:
1. Set `noupdate=False` temporarily: `UPDATE ir_model_data SET noupdate = false WHERE module = 'my_module' AND name = 'template_id';`
2. Update directly via SQL with `jsonb_build_object()`
3. Change `<data noupdate="0">` in XML (only affects fresh installs)
