---
name: manage-partners
description: >
  Manage Odoo 18 res.partner records via XML-RPC API. Use this skill when the user asks to
  "create a contact", "add a partner", "update partner info", "edit contact",
  "find partner", "search contacts in Odoo", "add company to Odoo", "update customer",
  "přidej kontakt", "uprav partnera", "najdi firmu v Odoo", "přidej firmu",
  "založ zákazníka", "aktualizuj kontakt", or any request involving
  creating, reading, updating, or searching res.partner records in Odoo 18.
---

# Odoo 18 Partner Management (res.partner)

Manage contacts, companies, and customers in Odoo 18 via XML-RPC API.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup and field reference.

## Configuration

Require these environment variables (ask user if not set):
- `ODOO_URL` — Odoo instance URL (default: `https://michalvarys.eu`)
- `ODOO_DB` — Database name (default: `varyshop`)
- `ODOO_API_KEY` — API key from user profile

UID se zjistí automaticky přes `common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})` — viz sdílená reference.

## Operations

### Create Partner (Company)

```python
partner_id = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [{
    'name': 'Company Name',
    'is_company': True,
    'email': 'info@company.cz',
    'phone': '+420...',
    'website': 'https://company.cz',
    'street': 'Address',
    'city': 'City',
    'zip': 'PSC',
    'country_id': 56,  # Czech Republic
    'customer_rank': 1,
    'comment': '<p>Notes about this partner</p>',
}])
```

### Create Contact (Person under Company)

```python
contact_id = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [{
    'name': 'Jan Novák',
    'is_company': False,
    'parent_id': company_partner_id,
    'email': 'jan@company.cz',
    'phone': '+420...',
    'function': 'CEO',  # job title
    'customer_rank': 1,
}])
```

### Search Partners

```python
partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['name', 'ilike', 'search_term'], ['is_company', '=', True]]
], {'fields': ['name', 'email', 'phone', 'website', 'city'], 'limit': 20})
```

### Update Partner

```python
models.execute_kw(DB, UID, KEY, 'res.partner', 'write', [
    [partner_id],
    {'field': 'new_value'}
])
```

## Partner Comment Field — Rich Analysis Storage

The `comment` field on res.partner supports HTML. Use it to store comprehensive analysis:

```html
<div class="partner-analysis">
  <h3>Digitální stopa</h3>
  <ul>
    <li><strong>Web:</strong> analysis of current website</li>
    <li><strong>Social:</strong> social media presence</li>
    <li><strong>SEO:</strong> search visibility assessment</li>
  </ul>
  <h3>Kontakty</h3>
  <ul>
    <li>Name — role — email — phone</li>
  </ul>
  <h3>Selling argumenty</h3>
  <ul>
    <li>Argument 1 with reasoning</li>
  </ul>
  <h3>Pain pointy</h3>
  <ul>
    <li>Pain point with evidence</li>
  </ul>
</div>
```

## Country IDs (Common)

- Czech Republic: 56
- Slovakia: 201
- Germany: 57
- Austria: 14
- Poland: 177

## Workflow

1. Ask user for partner details (name, type, contact info)
2. Check if partner already exists (search by name/email/website)
3. If exists, offer to update. If not, create new.
4. Return the partner ID and a summary of what was created/updated.
5. Always confirm the action with the user before executing write operations.
