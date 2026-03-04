---
name: mailing-campaigns
description: >
  Create email and SMS mailing campaigns (mailing.mailing) in Odoo 18 via XML-RPC API. Use this skill when the user asks to
  "create a mailing campaign", "create email campaign", "create SMS campaign",
  "new newsletter", "create a mass email", "set up email blast",
  "vytvoř mailing kampaň", "vytvoř emailovou kampaň", "vytvoř SMS kampaň",
  "nový newsletter", "hromadný email", "rozesílka", "kampaň",
  or any request involving creating or managing mailing.mailing campaigns in Odoo 18.
---

# Odoo 18 Mailing Campaign Management (mailing.mailing)

Create and manage email and SMS mailing campaigns in Odoo 18 via XML-RPC API.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Creating Email Campaign

### Step 1: Get the mailing.contact model ID

```python
model_ids = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'mailing.contact']]
])
mailing_model_id = model_ids[0]
```

### Step 2: Create the campaign

```python
mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Email Subject Line',
    'mailing_type': 'mail',
    'body_html': '''<div style="margin: 0 auto; max-width: 600px; font-family: Arial, sans-serif;">
        <h1>Headline</h1>
        <p>Email body content...</p>
        <a href="https://michalvarys.eu/page" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">CTA Button</a>
    </div>''',
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],  # target mailing lists
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

## Creating SMS Campaign

```python
mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'SMS Campaign Name',
    'mailing_type': 'sms',
    'body_plaintext': 'Text SMS zprávy. Odkaz: https://michalvarys.eu/page',
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
}])
```

## Email Body Best Practices

### Responsive Email HTML Structure

```html
<div style="margin: 0 auto; max-width: 600px; font-family: Arial, Helvetica, sans-serif; color: #333;">
    <!-- Header with logo -->
    <div style="text-align: center; padding: 20px 0;">
        <img src="/web/image/company_logo" alt="Michal Varyš" style="max-height: 60px;"/>
    </div>

    <!-- Main content -->
    <div style="padding: 20px; background: #ffffff;">
        <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 16px;">Headline</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Content paragraph...
        </p>

        <!-- CTA Button -->
        <div style="text-align: center; padding: 24px 0;">
            <a href="https://michalvarys.eu/page"
               style="display: inline-block; padding: 14px 28px;
                      background-color: #2563eb; color: #ffffff;
                      text-decoration: none; border-radius: 8px;
                      font-weight: bold; font-size: 16px;">
                Zobrazit nabídku
            </a>
        </div>
    </div>

    <!-- View in browser link -->
    <div style="text-align: center; padding: 16px; font-size: 12px; color: #999;">
        <a href="/mailing/${mailing_id}/view" style="color: #999;">
            Pokud se email nezobrazuje správně, otevřete v prohlížeči
        </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; font-size: 12px; color: #999; border-top: 1px solid #eee;">
        <p>Michal Varyš | michalvarys.eu</p>
        <a href="/mailing/${mailing_id}/unsubscribe" style="color: #999;">Odhlásit se</a>
    </div>
</div>
```

### View in Browser Link

Odoo automatically generates a web version of each mailing. The link format:
- `${object.mailing_id.mailing_url_view}` — in Jinja templates
- `/mailing/<mailing_id>/view` — direct URL pattern

Use this in the SMS template to link to the full email view.

## Managing Campaigns

### List Campaigns

```python
mailings = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'search_read', [
    [['state', '=', 'draft']]
], {'fields': ['subject', 'mailing_type', 'state', 'create_date']})
```

### Schedule Campaign

```python
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'write', [
    [mailing_id],
    {'schedule_date': '2026-03-15 09:00:00'}
])
```

### Send Campaign (puts in queue)

```python
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'action_send_mail', [[mailing_id]])
```

## UTM Tracking

Odoo's mailing module automatically appends UTM parameters to all links in emails:
- `utm_source` — mailing name
- `utm_medium` — email or sms
- `utm_campaign` — campaign name

For custom tracking, create UTM records:

```python
source_id = models.execute_kw(DB, UID, KEY, 'utm.source', 'create', [{'name': 'source-name'}])
campaign_id = models.execute_kw(DB, UID, KEY, 'utm.campaign', 'create', [{'name': 'Campaign Name'}])
```

## Workflow

1. Ask user about campaign type (email/SMS), subject, target list
2. Get or create mailing list (delegate to mailing-lists skill if needed)
3. Create the campaign with appropriate body content
4. Keep as draft for user review
5. Return campaign ID and admin link for manual review/sending
