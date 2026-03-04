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

## Targeting Specific Partners (res.partner) - RECOMMENDED for Prospecting

When sending to a specific prospect (not a mailing list), target res.partner directly with mailing_domain.
This avoids the need to create mailing.contact and mailing.list records.

### Email to Specific Partner
```python
partner_model_id = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'res.partner']]])[0]

mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Email Subject',
    'mailing_type': 'mail',
    'body_arch': email_html,  # QWeb editable template
    'body_html': email_html,  # Converted HTML for sending
    'mailing_model_id': partner_model_id,
    'mailing_domain': f'["&", ("is_blacklisted", "=", False), ("id", "=", {partner_id})]',
    'state': 'draft',
    'email_from': 'Michal Varys <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

### SMS to Specific Partner
```python
sms_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'SMS Campaign Name',
    'mailing_type': 'sms',
    'body_plaintext': f'SMS text. Link: https://michalvarys.eu/{page_slug}',
    'mailing_model_id': partner_model_id,
    'mailing_domain': f'["&", ("phone_sanitized_blacklisted", "=", False), ("id", "=", {partner_id})]',
    'state': 'draft',
}])
```

### Key Differences: res.partner vs mailing.contact
- **res.partner (Direct)**: For prospecting. Needs only partner_id. Use mailing_domain with id filter. Set both body_arch + body_html.
- **mailing.contact (Lists)**: For newsletters/bulk. Needs mailing.list + mailing.contact. Use contact_list_ids.

### body_arch vs body_html
- **body_arch**: QWeb editable template (what Odoo editor shows). MUST use Odoo mailing editor block structure with `o_mail_snippet_general` classes. See the `email-templates` SKILL for full block structure documentation.
- **body_html**: Converted HTML that gets sent
- For custom HTML emails, set BOTH to the same value
- When body_arch is empty, Odoo editor shows a blank canvas
- Without proper Odoo classes (`o_layout`, `o_mail_snippet_general`, `oe_structure`), blocks appear greyed out in editor with "this block cannot be dropped anywhere"

### SMS Best Practices
- Keep SMS under 160 chars (1 SMS) or max 320 chars (2 SMS)
- Use a catchy hook that drives curiosity/click
- Link to email browser view: `/mailing/{email_mailing_id}/view` (shows full email with web preview link)
- No diacritics in SMS (saves characters and avoids encoding issues)
- Always include sender signature (e.g., "- Michal, varyshop.eu")

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

## UTM Tracking & Link Tracking

Odoo's mailing module automatically appends UTM parameters to all links in emails:
- `utm_source` — mailing name
- `utm_medium` — email or sms
- `utm_campaign` — campaign name

### Assigning UTM Campaign to Mailings

```python
# Assign UTM campaign + source + medium to mailing
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'write', [[mailing_id], {
    'campaign_id': campaign_id,   # utm.campaign ID
    'source_id': source_id,       # utm.source ID
    'medium_id': medium_id,       # utm.medium ID (4=Email, 11=SMS, 1=Website)
}])
```

### link.tracker for Web Preview CTA Buttons

For tracking clicks on web preview pages (outside emails), use `link.tracker`:

```python
tracker_id = models.execute_kw(DB, UID, KEY, 'link.tracker', 'create', [{
    'url': f'https://www.michalvarys.eu/contactus?partner={slug}',
    'title': f'CTA - {company_name}',
    'campaign_id': campaign_id,
    'source_id': source_id,
    'medium_id': 1,  # Website
    'label': 'Mam zajem',
}])
tracker = models.execute_kw(DB, UID, KEY, 'link.tracker', 'read', [[tracker_id]], {'fields': ['short_url']})
short_url = tracker[0]['short_url']  # e.g. https://michalvarys.eu/r/bPY
```

Use the `short_url` in web preview CTA buttons instead of mailto: links. Every click is recorded with IP/timestamp under the campaign.

### Unified Campaign Tracking

Use the SAME `utm.campaign` across all touchpoints:
- Web preview CTA buttons → `link.tracker` with `medium_id=1` (Website)
- Email mailing → `mailing.mailing.campaign_id` with `medium_id=4` (Email)
- SMS mailing → `mailing.mailing.campaign_id` with `medium_id=11` (SMS)

This gives unified analytics across all channels in Odoo.

## Workflow

1. Ask user about campaign type (email/SMS), subject, target list
2. Get or create mailing list (delegate to mailing-lists skill if needed)
3. Create the campaign with appropriate body content
4. Keep as draft for user review
5. Return campaign ID and admin link for manual review/sending
