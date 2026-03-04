---
name: send-campaign
description: >
  Send email or SMS campaigns via Odoo 18 mailing.mailing with link tracking. Use this skill when the user asks to
  "send email campaign", "send SMS", "odeslat email přes kampaň",
  "odeslat SMS zákazníkovi", "odešli mailing", "rozešli kampaň",
  "send mailing to customer", "blast email", "trigger campaign",
  or any request involving sending emails/SMS through Odoo 18 mailing campaigns with tracking.
---

# Odoo 18 Campaign Sending (mailing.mailing)

Send email and SMS campaigns via Odoo 18 with full link tracking.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md`.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Important: Draft-First Approach

All campaigns should be created as `state: 'draft'` first, then the user manually reviews and sends from Odoo admin. This prevents accidental mass sends.

## Sending to Specific Customer via Campaign

To send a tracked email to a specific customer, create a dedicated mailing targeting just that contact:

### Step 1: Ensure customer has mailing contact

```python
# Find or create mailing contact (see mailing-lists skill)
existing = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'search', [
    [['partner_id', '=', partner_id]]
])
```

### Step 2: Create a targeted mailing list (or use existing)

```python
list_id = models.execute_kw(DB, UID, KEY, 'mailing.list', 'create', [{
    'name': f'Prospect — {company_name}',
    'is_public': False,
}])
# Add contact to list
models.execute_kw(DB, UID, KEY, 'mailing.contact', 'write', [
    [contact_id], {'list_ids': [(4, list_id)]}
])
```

### Step 3: Create the campaign as draft

```python
mailing_model_id = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'mailing.contact']]
])[0]

mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Subject Line',
    'mailing_type': 'mail',  # or 'sms'
    'body_html': '<div>...</div>',
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'keep_archives': True,
}])
```

### Step 4: Return admin link for manual review

The user can review and send from:
`{ODOO_URL}/web#id={mailing_id}&model=mailing.mailing&view_type=form`

## Link Tracking

Odoo automatically wraps all links in email campaigns with tracking URLs. When a recipient clicks a link, Odoo records:
- Who clicked
- When they clicked
- Which link
- How many times

This works automatically — no additional setup needed. Just include regular URLs in the email body and Odoo handles the rest.

## View in Browser Link

Every mailing has a web version accessible at:
- Template variable: `${object.mailing_id.mailing_url_view}`
- Direct pattern: `/mailing/<mailing_id>/view`

Include this in emails as a fallback:
```html
<a href="${object.mailing_id.mailing_url_view}">Otevřít v prohlížeči</a>
```

## SMS with Email Preview Link

For SMS campaigns that link to an email preview:

```python
# After creating the email mailing (mailing_id), create SMS:
sms_body = f'Podívejte se na naši nabídku: {ODOO_URL}/mailing/{email_mailing_id}/view'

sms_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'SMS — Company Name',
    'mailing_type': 'sms',
    'body_plaintext': sms_body,
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
}])
```

## Campaign Statistics

```python
stats = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'read', [
    [mailing_id]
], {'fields': [
    'sent', 'delivered', 'opened', 'clicked',
    'replied', 'bounced', 'state',
    'opened_ratio', 'replied_ratio',
]})
```

## Workflow

1. Identify target (specific customer or mailing list)
2. Create or find mailing contact with partner_id
3. Create campaign as DRAFT
4. Return the Odoo admin link so user can review and send manually
5. NEVER auto-send — always keep as draft for manual approval
