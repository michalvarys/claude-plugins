---
name: prospect-website
description: >
  Full prospect-to-website workflow for Odoo 18 — analyze a company, create a web preview page,
  CRM opportunity, email template, and SMS template. Use this skill when the user asks to
  "prospect a company", "create prospect website", "analyze and create web for company",
  "full prospect workflow", "web prospect pipeline",
  "prospektuj firmu", "vytvoř prospect web", "analyzuj firmu a vytvoř web",
  "celý prospect workflow", "prospect pipeline",
  "vytvoř náhled webu pro firmu", "prospect web stránku",
  or any request involving the full prospect workflow of analyzing a company and creating
  a web preview, CRM lead, and email/SMS templates in Odoo 18.
  This skill delegates to: odoo-qweb-page (from odoo-dev-toolkit), manage-partners,
  crm-opportunities, mailing-campaigns, mailing-lists, email-templates, and send-campaign skills.
---

# Prospect Website — Full Workflow

This is the master orchestration skill that analyzes a company, creates a web preview page in Odoo, sets up CRM and mailing infrastructure, and prepares personalized email + SMS templates — all as drafts for manual review.

## Overview

When triggered, this skill executes the following pipeline:

1. **Analyze the company** (web research + digital footprint)
2. **Create res.partner** with full analysis in comment field
3. **Create CRM opportunity** linked to the partner
4. **Create QWeb web preview page** (published, NOT in menu)
5. **Create personalized email template** matching the web style
6. **Create SMS template** with link to email browser view
7. **Set up mailing list and contact** linked to partner

Everything is created as draft/unpublished where possible, and the user manually reviews and sends.

## Prerequisites

Before starting, read these references:
- `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` — API connection and model fields
- The `odoo-qweb-page` skill from `odoo-dev-toolkit` plugin — for QWeb page creation patterns

Environment variables needed: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky přes authenticate)

Default sender: **Michal Varyš <info@michalvarys.eu>**
Default Odoo URL: **https://michalvarys.eu**
Default DB: **varyshop**

## Step-by-Step Execution

### Step 1: Company Analysis

Use web search and website fetching to gather:

**Company Info:**
- Company name, IČO, address
- Industry/sector
- Key people (CEO, CTO, marketing, etc.) with names + roles
- Contact info (email, phone, social media)

**Digital Footprint Analysis:**
- Current website assessment (design quality, mobile responsiveness, speed, SSL)
- SEO visibility (estimated traffic, keyword rankings if findable)
- Social media presence (which platforms, activity level)
- Google Business profile
- Online reviews and ratings

**Selling Arguments (min 5):**
- Identify specific weaknesses in their current web presence
- Frame each as an opportunity with concrete benefit
- Example: "Current website is not mobile-friendly → 60% of users browse on mobile, they're losing visitors"

**Pain Points (min 3):**
- What problems does their current digital presence cause?
- Lost leads, poor brand image, low search visibility, etc.

### Step 2: Create res.partner in Odoo

Create the company as res.partner with the full analysis stored in the `comment` field as structured HTML:

```python
partner_id = models.execute_kw(DB, UID, KEY, 'res.partner', 'create', [{
    'name': 'Company Name s.r.o.',
    'is_company': True,
    'email': 'info@company.cz',
    'phone': '+420...',
    'website': 'https://company.cz',
    'street': 'Address',
    'city': 'City',
    'zip': 'PSC',
    'country_id': 56,
    'customer_rank': 1,
    'comment': '''<div class="prospect-analysis">
        <h3>📊 Digitální stopa</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr><td style="padding:4px 8px;"><strong>Web:</strong></td><td>Assessment...</td></tr>
            <tr><td style="padding:4px 8px;"><strong>SEO:</strong></td><td>Assessment...</td></tr>
            <tr><td style="padding:4px 8px;"><strong>Social:</strong></td><td>Assessment...</td></tr>
            <tr><td style="padding:4px 8px;"><strong>Google Business:</strong></td><td>Assessment...</td></tr>
        </table>

        <h3>👥 Kontakty</h3>
        <ul>
            <li><strong>Name</strong> — Role — email — phone</li>
        </ul>

        <h3>🎯 Selling argumenty</h3>
        <ol>
            <li><strong>Argument:</strong> Reasoning with data</li>
        </ol>

        <h3>⚠️ Pain pointy</h3>
        <ol>
            <li><strong>Pain:</strong> Impact description</li>
        </ol>

        <h3>📝 Poznámky</h3>
        <p>Additional notes from analysis</p>
    </div>''',
}])
```

### Step 3: Create CRM Opportunity

```python
lead_id = models.execute_kw(DB, UID, KEY, 'crm.lead', 'create', [{
    'name': f'Web redesign — {company_name}',
    'type': 'opportunity',
    'partner_id': partner_id,
    'email_from': company_email,
    'phone': company_phone,
    'website': company_website,
    'expected_revenue': 15000.0,  # adjust based on scope
    'probability': 20.0,
    'description': f'''<div>
        <h3>Příležitost</h3>
        <p>Redesign webu pro {company_name}. Náhled nového webu: https://michalvarys.eu/{page_slug}</p>

        <h3>Scope</h3>
        <ul>
            <li>Kompletní redesign webu</li>
            <li>SEO optimalizace</li>
            <li>Mobilní responsivita</li>
            <li>SSL certifikát</li>
            <li>Hosting a údržba</li>
        </ul>

        <h3>Cenová nabídka</h3>
        <p>Web, server, design, SSL, bezpečnost a údržba systému od <strong>1 290 Kč/měsíc</strong></p>

        <h3>Další kroky</h3>
        <ol>
            <li>Zkontrolovat náhled webu</li>
            <li>Odeslat email s nabídkou</li>
            <li>Follow-up telefonát</li>
        </ol>
    </div>''',
}])
```

### Step 4: Create QWeb Web Preview Page

Use the `odoo-qweb-page` skill patterns from `odoo-dev-toolkit` to create a professional landing page.

**The page MUST:**
- Use `website.layout` with `page.layout` structure
- Be published (`website_published: True`)
- NOT be in menu (don't create `website.menu` entry)
- Match the company's industry and style
- Include sections: Hero, Services/Offer, Why Us, Pricing overview, CTA
- Have full SEO meta tags and JSON-LD
- Be visually impressive — this IS the sales pitch

**Create via API (two-step):**

```python
# 1. Create ir.ui.view with QWeb template
page_slug = f'preview-{company_slug}'

view_id = models.execute_kw(DB, UID, KEY, 'ir.ui.view', 'create', [{
    'name': f'Web Preview — {company_name}',
    'type': 'qweb',
    'arch_db': qweb_template_xml,  # Full QWeb template
    'key': f'website.{page_slug}',
}])

# 2. Create website.page
page_id = models.execute_kw(DB, UID, KEY, 'website.page', 'create', [{
    'name': f'Web Preview — {company_name}',
    'url': f'/{page_slug}',
    'view_id': view_id,
    'website_published': True,
    'is_published': True,
    'website_indexed': False,  # Don't index preview pages
}])
```

**QWeb Template Requirements:**
- Follow ALL rules from the odoo-qweb-page skill
- NO `<?xml ?>` declaration
- NO `<odoo>`, `<data>`, `<template>` wrappers
- Start with `<t t-name="website.{page_slug}">`
- Use `<t t-call="website.layout">`
- `<div id="wrap" class="oe_structure oe_empty">`
- Every `<section>` has `o_colored_level`
- CSS in `<xpath expr="head" position="inside"><style>...</style></xpath>`
- All CSS classes namespaced (prefix with `pv-` for "preview")

### Step 5: Create Personalized Email Template

Create an email matching the web preview style. The email should:
- Use the same color scheme as the web preview
- Explain what was done ("Připravili jsme pro vás náhled nového webu")
- Include link to the web preview page
- Show pricing (web, server, design, SSL, bezpečnost, údržba od 1 290 Kč/měsíc)
- Have a clear CTA ("Zobrazit váš nový web")
- Include "View in browser" link
- Include unsubscribe link

```python
mailing_model_id = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'mailing.contact']]
])[0]

email_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': f'Připravili jsme pro vás náhled nového webu — {company_name}',
    'mailing_type': 'mail',
    'body_html': email_html,  # Personalized email HTML
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

### Step 6: Create SMS Template

SMS with link to email browser view:

```python
sms_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': f'SMS — {company_name}',
    'mailing_type': 'sms',
    'body_plaintext': f'Dobrý den, připravili jsme pro Vás náhled nového webu. Podívejte se: https://michalvarys.eu/mailing/{email_mailing_id}/view — Michal Varyš',
    'mailing_model_id': mailing_model_id,
    'contact_list_ids': [(6, 0, [list_id])],
    'state': 'draft',
}])
```

### Step 7: Set Up Mailing Infrastructure

```python
# Create dedicated mailing list for this prospect
list_id = models.execute_kw(DB, UID, KEY, 'mailing.list', 'create', [{
    'name': f'Prospect — {company_name}',
    'is_public': False,
}])

# Create mailing contact linked to partner
contact_id = models.execute_kw(DB, UID, KEY, 'mailing.contact', 'create', [{
    'name': contact_person_name or company_name,
    'email': company_email,
    'partner_id': partner_id,
    'company_name': company_name,
    'list_ids': [(4, list_id)],
}])
```

## Output Summary

After completing all steps, present the user with:

1. **Partner**: Name + ID + link to Odoo record
2. **CRM Opportunity**: Name + ID + link to Odoo record
3. **Web Preview**: URL of the published page
4. **Email Campaign**: ID + link to Odoo form (draft, ready to send)
5. **SMS Campaign**: ID + link to Odoo form (draft, ready to send)
6. **Mailing List**: Name + ID

Links format:
- Partner: `{ODOO_URL}/web#id={partner_id}&model=res.partner&view_type=form`
- CRM: `{ODOO_URL}/web#id={lead_id}&model=crm.lead&view_type=form`
- Web: `{ODOO_URL}/{page_slug}`
- Email: `{ODOO_URL}/web#id={email_mailing_id}&model=mailing.mailing&view_type=form`
- SMS: `{ODOO_URL}/web#id={sms_mailing_id}&model=mailing.mailing&view_type=form`

## Important Rules

1. **NEVER auto-send** emails or SMS. Always keep as draft.
2. **Web page is NOT in menu** — only accessible via direct URL.
3. **Web page SEO indexing is OFF** — it's a preview, not a permanent page.
4. **Partner comment contains the FULL analysis** — this is the sales intel.
5. **Email style matches the web preview** — consistent branding.
6. **Pricing always mentions: od 1 290 Kč/měsíc** — for web, server, design, SSL, bezpečnost a údržba.
7. **All links in email get automatic Odoo tracking** — no manual UTM needed.
