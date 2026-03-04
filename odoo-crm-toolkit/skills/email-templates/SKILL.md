---
name: email-templates
description: >
  Create QWeb email templates for Odoo 18 mailing campaigns via XML-RPC API. Use this skill when the user asks to
  "create email template", "design email for mailing", "make newsletter template",
  "email template for campaign", "QWeb email template",
  "vytvoř emailovou šablonu", "navrhni email pro kampaň", "šablona pro mailing",
  "QWeb šablona emailu", "design emailu", "vytvoř newsletter šablonu",
  or any request involving creating email templates for Odoo 18 mailing.mailing campaigns.
---

# Odoo 18 Email Template Creation

Create professional email templates for mailing campaigns in Odoo 18.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md`.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Email Template Types

### 1. Direct HTML in mailing.mailing (body_html)

For one-off campaigns. HTML is stored directly in the mailing body.

### 2. mail.template (Reusable Templates)

For templates that can be reused across multiple mailings. Supports Jinja2 placeholders.

### 3. QWeb Template (ir.ui.view type=qweb)

For complex templates rendered server-side. Most powerful but requires more setup.

## Creating Email for mailing.mailing

The body_html field accepts full HTML. Design emails with inline CSS (email clients don't support external stylesheets or `<style>` blocks reliably).

### Professional Email Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
    <!-- Wrapper table for email clients -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <!-- Content container -->
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">

                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">
                                Michal Varyš
                            </h1>
                            <p style="margin: 4px 0 0; color: #a0aec0; font-size: 13px;">
                                Web Design &amp; Development
                            </p>
                        </td>
                    </tr>

                    <!-- Hero Section -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1a1a2e; font-size: 24px; line-height: 1.3;">
                                Headline Text
                            </h2>
                            <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                                Main message paragraph with key value proposition.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="border-radius: 8px; background-color: #2563eb;">
                                        <a href="https://michalvarys.eu/page"
                                           style="display: inline-block; padding: 14px 28px;
                                                  color: #ffffff; text-decoration: none;
                                                  font-weight: 600; font-size: 16px;">
                                            Zobrazit nabídku
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content Sections -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <!-- Feature list or content blocks -->
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px;">
                                        <h3 style="margin: 0 0 8px; color: #1a1a2e; font-size: 16px;">Feature Title</h3>
                                        <p style="margin: 0; color: #4a5568; font-size: 14px;">Feature description.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Pricing Section -->
                    <tr>
                        <td style="padding: 30px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <h3 style="margin: 0 0 12px; color: #1a1a2e; font-size: 18px;">Ceník</h3>
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 8px 0; color: #4a5568; font-size: 14px;">Web, server, design, SSL</td>
                                    <td align="right" style="padding: 8px 0; color: #1a1a2e; font-weight: 600;">od 1 290 Kč/měsíc</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: #1a1a2e; text-align: center;">
                            <p style="margin: 0 0 8px; color: #a0aec0; font-size: 12px;">
                                Michal Varyš | <a href="https://michalvarys.eu" style="color: #60a5fa; text-decoration: none;">michalvarys.eu</a>
                            </p>
                            <p style="margin: 0; color: #718096; font-size: 11px;">
                                <a href="${object.mailing_id.mailing_url_unsubscribe}" style="color: #718096; text-decoration: underline;">Odhlásit se</a>
                                &nbsp;|&nbsp;
                                <a href="${object.mailing_id.mailing_url_view}" style="color: #718096; text-decoration: underline;">Otevřít v prohlížeči</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## Odoo Mailing Editor Block Structure (body_arch)

When setting `body_arch`, the HTML MUST follow Odoo's mailing editor structure so blocks are editable/draggable in the Odoo editor. Without these classes, blocks appear greyed out with "this block cannot be dropped anywhere".

### Required Wrapper Structure

```html
<div class="o_layout oe_unremovable oe_unmovable bg-200" data-name="Mailing"
     style="background-color: #f5f5f5; padding: 0;">
  <div class="container o_mail_wrapper o_mail_regular oe_unremovable"
       style="max-width: 600px; margin: 0 auto;">
    <div class="row">
      <div class="col o_mail_no_options o_mail_wrapper_td oe_structure"
           style="padding: 0;">

        <!-- EDITABLE BLOCKS GO HERE -->

      </div>
    </div>
  </div>
</div>
```

### Editable Block Classes

Every content block MUST have class `o_mail_snippet_general` plus a block-type class:

- `s_text_block` — text paragraph/heading
- `s_call_to_action` — CTA button section
- `s_three_columns` — 3-column layout
- `s_cover` — hero/cover with background image
- `s_features` — feature cards with icons
- `s_image_text` — image + text side by side

### View Online Block

Add as the FIRST block inside the structure:

```html
<div class="o_snippet_view_in_browser o_mail_snippet_general"
     style="text-align: center; padding: 8px; font-size: 12px;">
  <a t-att-href="'/mailing/' + str(object.mailing_id.id) + '/view'"
     style="color: #999; text-decoration: underline;">
    Zobrazit v prohlížeči
  </a>
</div>
```

### Example Editable Block

```html
<div class="s_text_block o_mail_snippet_general" style="padding: 24px 40px;">
  <div class="container s_allow_columns">
    <div class="row">
      <div class="col-lg-12">
        <h2 style="color: #1a1a2e; font-size: 22px;">Editable Heading</h2>
        <p style="color: #4a5568; font-size: 15px; line-height: 1.6;">
          Editable paragraph text...
        </p>
      </div>
    </div>
  </div>
</div>
```

### CTA Button Block

```html
<div class="s_call_to_action o_mail_snippet_general o_cc o_cc3"
     style="padding: 24px 40px; text-align: center;">
  <div class="container s_allow_columns">
    <a href="https://michalvarys.eu/page"
       class="btn btn-primary btn-lg"
       style="display: inline-block; padding: 14px 28px; background: #2563eb;
              color: #fff; text-decoration: none; border-radius: 8px;
              font-weight: 600;">
      Zobrazit nabídku
    </a>
  </div>
</div>
```

### Footer Block with Unsubscribe

```html
<div class="o_mail_snippet_general" data-name="Footer"
     style="padding: 20px 40px; text-align: center; background: #1a1a2e;">
  <p style="color: #a0aec0; font-size: 12px; margin: 0 0 8px;">
    Michal Varyš | michalvarys.eu
  </p>
  <p style="color: #718096; font-size: 11px; margin: 0;">
    <a t-att-href="'/mailing/' + str(object.mailing_id.id) + '/unsubscribe'"
       style="color: #718096; text-decoration: underline;">Odhlásit se</a>
  </p>
</div>
```

### CRITICAL: Set BOTH body_arch AND body_html

```python
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'write', [[mailing_id], {
    'body_arch': email_with_odoo_classes,  # Editor version with o_mail_snippet_general
    'body_html': email_with_odoo_classes,  # Same HTML for sending
}])
```

## Email Design Rules

### Inline CSS Only
Email clients strip `<style>` tags. ALL styling must be inline.

### Table-Based Layout
Use `<table role="presentation">` for layout. Flexbox and Grid don't work in email.

### Max Width 600px
Standard email width. Use a centered wrapper table.

### Image URLs Must Be Absolute
Always use `https://michalvarys.eu/web/image/...` — never relative paths.

### Fonts
Stick to system fonts: Arial, Helvetica, Georgia, Times New Roman. Web fonts are unreliable in email.

### Dark Mode Considerations
- Use `color` on text (don't rely on default black)
- Add `background-color` explicitly on white backgrounds
- Test with both light and dark bg assumptions

## Jinja2 Placeholders (for mail.template)

Available in mail.template context:
- `{{ object.name }}` — contact/partner name
- `{{ object.email }}` — contact email
- `{{ object.company_name }}` — company name
- `{{ object.partner_id.name }}` — linked partner name

## Creating Email as Draft Mailing

```python
mailing_model_id = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'mailing.contact']]
])[0]

mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Email Subject',
    'mailing_type': 'mail',
    'body_html': email_html_content,
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

## Workflow

1. Understand the email purpose, audience, and style
2. Design HTML email following inline CSS and table layout rules
3. Include proper header, CTA, pricing (if applicable), and footer
4. Always include "View in browser" and "Unsubscribe" links
5. Create as draft mailing for manual review
6. Return admin link: `{ODOO_URL}/web#id={mailing_id}&model=mailing.mailing&view_type=form`
