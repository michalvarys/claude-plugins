---
name: mailing-lists
description: >
  Manage Odoo 18 mailing lists and contacts (mailing.list, mailing.contact) via XML-RPC API. Use this skill when the user asks to
  "create a mailing list", "add to mailing list", "assign contacts to list",
  "manage subscribers", "create contact list", "link partner to mailing",
  "vytvoř mailing list", "přidej do mailing listu", "přiřaď zákazníky do listu",
  "správa odběratelů", "vytvoř seznam kontaktů", "propoj partnera s mailingem",
  or any request involving mailing.list or mailing.contact management in Odoo 18.
---

# Odoo 18 Mailing List Management

Manage mailing lists and contacts in Odoo 18. Mailing contacts MUST have `partner_id` linked to res.partner.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md`.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Critical Rule: partner_id is Required

Every `mailing.contact` MUST have a `partner_id` linking it to a `res.partner` record. This ensures:
- CRM integration works
- Contact data stays synchronized
- Link tracking ties back to the right partner

## Operations

### Create Mailing List

```python
list_id = models.execute_kw(DB, UID, KEY, 'mailing.list', 'create', [{
    'name': 'Web Prospects 2026',
    'is_public': False,
}])
```

### Search Existing Lists

```python
lists = models.execute_kw(DB, UID, KEY, 'mailing.list', 'search_read', [
    []
], {'fields': ['name', 'contact_count', 'is_public']})
```

### Create Mailing Contact (linked to partner)

```python
contact_id = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'create', [{
    'name': 'Jan Novák',
    'email': 'jan@firma.cz',
    'partner_id': partner_id,  # REQUIRED — link to res.partner
    'company_name': 'Firma s.r.o.',
    'list_ids': [(4, list_id)],  # add to mailing list
}])
```

### Add Existing Contact to List

```python
models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
    [contact_id],
    {'list_ids': [(4, new_list_id)]}
])
```

### Find Mailing Contact by Partner

```python
contacts = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'search_read', [
    [['partner_id', '=', partner_id]]
], {'fields': ['name', 'email', 'list_ids', 'partner_id']})
```

### Find or Create Mailing Contact from Partner

```python
# Search for existing mailing contact
existing = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'search_read', [
    [['partner_id', '=', partner_id]]
], {'fields': ['id', 'list_ids']})

if existing:
    # Add to list
    models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
        [existing[0]['id']],
        {'list_ids': [(4, list_id)]}
    ])
    contact_id = existing[0]['id']
else:
    # Get partner data first
    partner = models.execute_kw(DB, UID, KEY, 'res.partner', 'read', [
        [partner_id]
    ], {'fields': ['name', 'email', 'company_name']})[0]

    contact_id = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'create', [{
        'name': partner['name'],
        'email': partner['email'],
        'partner_id': partner_id,
        'company_name': partner.get('company_name', ''),
        'list_ids': [(4, list_id)],
    }])
```

### Bulk Add Partners to Mailing List

```python
# Get all partners matching criteria
partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['customer_rank', '>', 0], ['email', '!=', False]]
], {'fields': ['id', 'name', 'email', 'company_name']})

for partner in partners:
    # Check if mailing contact exists
    existing = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'search', [
        [['partner_id', '=', partner['id']]]
    ])
    if existing:
        models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
            existing, {'list_ids': [(4, list_id)]}
        ])
    else:
        models.execute_kw(DB, UID, KEY, 'mailing.contact', 'create', [{
            'name': partner['name'],
            'email': partner['email'],
            'partner_id': partner['id'],
            'company_name': partner.get('company_name', ''),
            'list_ids': [(4, list_id)],
        }])
```

### Remove Contact from List

```python
models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
    [contact_id],
    {'list_ids': [(3, list_id)]}  # (3, id) removes link without deleting
])
```

## Many2many Operations Reference

- `(4, id)` — add existing record to set
- `(3, id)` — remove link (don't delete record)
- `(6, 0, [id1, id2])` — replace all links with this set
- `(0, 0, {vals})` — create new record and link it

## Workflow

1. Ask user which partners/customers to add and to which list
2. Search or create the mailing list
3. For each partner, find or create a mailing.contact with partner_id
4. Add the contact to the list
5. Report summary: how many added, any issues (missing email, etc.)
