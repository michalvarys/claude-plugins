# Odoo 18 XML-RPC API Reference

## Connection Setup

All communication with Odoo uses XML-RPC protocol via Python's `xmlrpc.client`.

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `ODOO_URL` | Odoo instance URL | `https://michalvarys.eu` |
| `ODOO_DB` | Database name | `varyshop` |
| `ODOO_API_KEY` | API key (from user profile) | `xxxxxxxxxxxxxxxx` |

> **UID se zjišťuje automaticky** — není potřeba ho nastavovat ručně. Funkce `common.authenticate()` vrátí UID na základě API klíče.

### Python Connection Template

```python
import xmlrpc.client

ODOO_URL = "https://michalvarys.eu"
ODOO_DB = "varyshop"
ODOO_API_KEY = "API_KEY_HERE"  # from env or config

# Endpoints
common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

# Version check (no auth needed)
version = common.version()

# Authenticate — returns UID automatically
# With API key: use any string as login (e.g. empty), key as password
ODOO_UID = common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})
if not ODOO_UID:
    raise Exception("Authentication failed — check ODOO_API_KEY and ODOO_DB")
print(f"Authenticated as UID: {ODOO_UID}")
```

### API Key Authentication

With API key, use the key as password parameter in all `execute_kw` calls.
UID is obtained from the `authenticate()` call above.

```python
# Generic execute_kw pattern
result = models.execute_kw(
    ODOO_DB,
    ODOO_UID,       # auto-detected from authenticate()
    ODOO_API_KEY,
    'model.name',      # e.g. 'res.partner'
    'method_name',      # e.g. 'create', 'write', 'search_read'
    [positional_args],  # method arguments
    {keyword_args}      # optional keyword arguments
)
```

## CRUD Operations

### Search

```python
# search — returns list of IDs
ids = models.execute_kw(DB, UID, KEY, 'res.partner', 'search', [
    [['is_company', '=', True], ['customer_rank', '>', 0]]
], {'limit': 10, 'offset': 0, 'order': 'name ASC'})
```

### Search & Read (combined)

```python
# search_read — returns list of dicts
partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['is_company', '=', True]]
], {'fields': ['name', 'email', 'phone', 'website'], 'limit': 10})
```

### Create

```python
# create — returns new record ID
partner_id = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [{
    'name': 'Test Company s.r.o.',
    'email': 'info@test.cz',
    'phone': '+420123456789',
    'is_company': True,
    'website': 'https://test.cz',
    'comment': 'Notes about this partner',
}])
```

### Write (Update)

```python
# write — returns True on success
models.execute_kw(DB, UID, KEY, 'res.partner', 'write', [
    [partner_id],  # list of IDs to update
    {'phone': '+420987654321', 'email': 'new@test.cz'}
])
```

### Unlink (Delete)

```python
# unlink — returns True on success
models.execute_kw(DB, UID, KEY, 'res.partner', 'unlink', [[record_id]])
```

### Read (by IDs)

```python
# read — returns list of dicts for given IDs
records = models.execute_kw(DB, UID, KEY, 'res.partner', 'read', [
    [1, 2, 3]
], {'fields': ['name', 'email']})
```

## Model-Specific Patterns

### res.partner

Key fields:
- `name` (str) — partner name
- `email` (str) — email address
- `phone` (str) — phone number
- `mobile` (str) — mobile number
- `website` (str) — website URL
- `is_company` (bool) — True for companies, False for individuals
- `parent_id` (int) — parent company ID (for contacts of a company)
- `street`, `street2`, `city`, `zip`, `state_id`, `country_id` — address
- `comment` (html) — internal notes (supports HTML)
- `customer_rank` (int) — >0 means it's a customer
- `supplier_rank` (int) — >0 means it's a supplier
- `category_id` (list of ints) — partner tags
- `image_1920` (base64) — partner image

### crm.lead

Key fields:
- `name` (str) — opportunity name/title
- `partner_id` (int) — associated partner
- `email_from` (str) — contact email
- `phone` (str) — contact phone
- `expected_revenue` (float) — expected revenue
- `probability` (float) — probability 0-100
- `stage_id` (int) — pipeline stage
- `user_id` (int) — salesperson
- `team_id` (int) — sales team
- `description` (html) — description/notes
- `type` (str) — 'lead' or 'opportunity'
- `tag_ids` (list of ints) — tags
- `website` (str) — website of the lead

### sale.order

Key fields:
- `name` (str) — order reference (auto)
- `partner_id` (int) — customer
- `date_order` (datetime) — order date
- `amount_total` (float) — total amount
- `state` (str) — 'draft', 'sent', 'sale', 'done', 'cancel'
- `order_line` (one2many) — order lines
- `invoice_ids` (many2many) — related invoices

### sale.order.line

Key fields:
- `order_id` (int) — parent order
- `product_id` (int) — product
- `product_uom_qty` (float) — quantity
- `price_unit` (float) — unit price
- `price_subtotal` (float) — subtotal
- `discount` (float) — discount %

### mailing.mailing

Key fields:
- `subject` (str) — email subject
- `mailing_type` (str) — 'mail' or 'sms'
- `body_html` (html) — email body HTML
- `body_plaintext` (str) — SMS body text
- `mailing_model_id` (int) — target model ID (use ir.model for 'mailing.contact')
- `contact_list_ids` (list of ints) — mailing lists (Many2many)
- `state` (str) — 'draft', 'in_queue', 'sending', 'done'
- `email_from` (str) — sender email
- `reply_to` (str) — reply-to email
- `mail_server_id` (int) — outgoing mail server
- `campaign_id` (int) — marketing campaign
- `medium_id` (int) — medium (email, sms)
- `source_id` (int) — UTM source
- `body_arch` (html) — template architecture (QWeb)
- `schedule_date` (datetime) — scheduled send date
- `keep_archives` (bool) — keep sent emails

### mailing.list

Key fields:
- `name` (str) — list name
- `contact_count` (int) — number of contacts (readonly)
- `is_public` (bool) — publicly visible

### mailing.contact

Key fields:
- `name` (str) — contact name
- `email` (str) — email
- `list_ids` (many2many) — mailing lists
- `partner_id` (int) — linked res.partner
- `title_id` (int) — title
- `company_name` (str) — company name
- `country_id` (int) — country
- `tag_ids` (many2many) — tags

### mail.template

Key fields:
- `name` (str) — template name
- `subject` (str) — email subject (supports Jinja: {{ object.name }})
- `body_html` (html) — email body HTML (supports Jinja)
- `model_id` (int) — model this template is for (ir.model ID)
- `email_from` (str) — sender
- `email_to` (str) — recipient expression
- `partner_to` (str) — partner IDs expression
- `reply_to` (str) — reply-to

### ir.ui.view (QWeb templates)

Key fields:
- `name` (str) — view name
- `type` (str) — 'qweb'
- `arch_db` (html) — template XML content
- `key` (str) — external ID like 'website.page_slug'
- `website_id` (int) — website ID (for multi-website)

### website.page

Key fields:
- `name` (str) — page name
- `url` (str) — page URL path (e.g., '/my-page')
- `view_id` (int) — linked ir.ui.view
- `website_published` (bool) — published state
- `is_published` (bool) — same as above
- `website_indexed` (bool) — allow search engine indexing
- `menu_ids` (one2many) — linked menu items
- `date_publish` (datetime) — publish date

## Creating a QWeb Page via API

Two-step process:

### Step 1: Create ir.ui.view (the template)

```python
view_id = models.execute_kw(DB, UID, KEY, 'ir.ui.view', 'create', [{
    'name': 'Page Display Name',
    'type': 'qweb',
    'arch_db': '''<t t-name="website.page-slug">
  <t t-set="pageName" t-value="'Page Display Name'"/>
  <t t-call="website.layout">
    <div id="wrap" class="oe_structure oe_empty">
      <section class="o_colored_level pt104 pb104">
        <div class="container">
          <h1>Hello World</h1>
        </div>
      </section>
    </div>
  </t>
</t>''',
    'key': 'website.page-slug',
}])
```

### Step 2: Create website.page (the URL binding)

```python
page_id = models.execute_kw(DB, UID, KEY, 'website.page', 'create', [{
    'name': 'Page Display Name',
    'url': '/page-slug',
    'view_id': view_id,
    'website_published': True,   # publish immediately
    'website_indexed': True,     # allow SEO indexing
    'is_published': True,
}])
```

**Important**: Do NOT create a website.menu entry if the page should be hidden from navigation.

## Creating Email Templates for Mailing

### Option A: Direct mailing.mailing with body_html

```python
mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Email Subject',
    'mailing_type': 'mail',
    'body_html': '<div>Full HTML email content here</div>',
    'state': 'draft',  # keep as draft for manual review
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
}])
```

### Option B: mail.template for reusable templates

```python
# First get the ir.model ID for the target model
model_ids = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'mailing.contact']]
])

template_id = models.execute_kw(DB, UID, KEY, 'mail.template', 'create', [{
    'name': 'Template Name',
    'subject': 'Subject with {{ object.name }}',
    'body_html': '<div>HTML content with {{ object.name }}</div>',
    'model_id': model_ids[0],
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
}])
```

## Creating SMS Templates

```python
sms_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'SMS Campaign Name',
    'mailing_type': 'sms',
    'body_plaintext': 'SMS text with link: https://michalvarys.eu/page-slug',
    'state': 'draft',
}])
```

## Uploading Images/Attachments

```python
import base64

with open('image.png', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

attachment_id = models.execute_kw(DB, UID, KEY, 'ir.attachment', 'create', [{
    'name': 'image.png',
    'type': 'binary',
    'datas': image_data,
    'res_model': 'ir.ui.view',  # or the target model
    'res_id': 0,  # 0 for global
    'public': True,  # accessible without login
    'mimetype': 'image/png',
}])

# Get the URL for use in QWeb templates
attachment = models.execute_kw(DB, UID, KEY, 'ir.attachment', 'read', [
    [attachment_id]
], {'fields': ['image_src', 'local_url']})
# Use: /web/image/{attachment_id}
```

## Mailing List Management

### Create mailing list

```python
list_id = models.execute_kw(DB, UID, KEY, 'mailing.list', 'create', [{
    'name': 'My Prospects',
    'is_public': False,
}])
```

### Create mailing contact linked to partner

```python
contact_id = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'create', [{
    'name': 'Jan Novák',
    'email': 'jan@firma.cz',
    'partner_id': partner_id,  # REQUIRED: link to res.partner
    'list_ids': [(4, list_id)],  # add to mailing list
}])
```

### Add existing contact to list

```python
models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
    [contact_id],
    {'list_ids': [(4, new_list_id)]}  # (4, id) = add link
])
```

### Many2many Operations

- `(4, id)` — add existing record
- `(3, id)` — remove link (don't delete)
- `(6, 0, [ids])` — replace all links
- `(0, 0, {vals})` — create and link new record

## UTM Tracking

For link tracking in mailing campaigns, Odoo automatically handles UTM parameters when using mailing.mailing. Links in emails get tracking parameters appended.

For manual link tracking:

```python
# Create UTM source
source_id = models.execute_kw(DB, UID, KEY, 'utm.source', 'create', [{
    'name': 'prospect-web-campaign'
}])

# Create UTM campaign
campaign_id = models.execute_kw(DB, UID, KEY, 'utm.campaign', 'create', [{
    'name': 'Prospect Website Campaign'
}])
```

## Error Handling

Always wrap XML-RPC calls in try/except:

```python
try:
    result = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [{...}])
except xmlrpc.client.Fault as e:
    print(f"Odoo Error: {e.faultString}")
except Exception as e:
    print(f"Connection Error: {e}")
```

## Batch Operations

For creating multiple records efficiently:

```python
# Create multiple partners at once (Odoo 18 supports list of dicts)
partner_ids = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [
    [{'name': 'Partner 1'}, {'name': 'Partner 2'}]
])
```
