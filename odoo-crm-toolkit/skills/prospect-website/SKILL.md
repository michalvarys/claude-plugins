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

### Step 3.5: Deep Research (MANDATORY before creating web preview)

Before creating the web page, perform thorough research to gather ALL personalization data. This step is CRITICAL for conversion — a generic page won't sell.

**Research Sources (check ALL of them):**

1. **apetee.com** — primary source for Czech restaurants
   - URL patterns: `https://www.apetee.com/{Name}-Karlovy-Vary` or `https://www.apetee.com/Restaurace-{Name}-Karlovy-Vary`
   - Extract: photos (both `/img/` and `/storage/` URL formats), address, phone, hours, description, cuisine type, amenities

2. **restaurantguru.com** — reviews, photos, menu
   - Search: `"{company_name}" Karlovy Vary site:restaurantguru.com`
   - Extract: real customer reviews (translate to Czech if needed), food photos, menu photos

3. **Google search** — general info, social profiles
   - Search: `"{company_name}" Karlovy Vary`
   - Search: `"{company_name}" Karlovy Vary facebook`
   - Search: `"{company_name}" Karlovy Vary instagram`
   - Search: `"{company_name}" Karlovy Vary recenze`

4. **Company's own website** — if they have one, analyze it for content to reuse
   - Menu/services, about text, contact info, photos
   - Note: this is also useful for identifying weaknesses (selling arguments)

5. **TripAdvisor / Google Reviews** — real reviews to use as social proof

**Data to collect for EACH restaurant/business:**

| Data | Required | Source Priority |
|------|----------|----------------|
| Real photos (min 4) | YES | apetee > restaurantguru > own site > Google |
| Address | YES | apetee > Google |
| Phone | YES | apetee > own site > Google |
| Opening hours | YES | apetee > own site |
| Description/about | YES | apetee > own site (rewrite in engaging tone) |
| Cuisine type | YES | apetee > menu analysis |
| Menu items (min 4) | YES | restaurantguru > own site > estimate from cuisine |
| Real reviews (min 3) | YES | Google > TripAdvisor > restaurantguru |
| Facebook URL | NICE | Google search |
| Instagram URL | NICE | Google search |
| Website URL | NICE | apetee > Google |
| Email | NICE | own site > apetee |
| Amenities (WiFi, parking, garden...) | NICE | apetee |

**Rules for personalization:**
- Menu items MUST match the actual cuisine type (don't put pizza in a Czech pub)
- Reviews MUST sound authentic and mention specific dishes/features of that restaurant
- Description MUST be unique and highlight what makes THIS place special
- Photo captions are NOT used (photos speak for themselves)
- If real menu prices aren't available, estimate realistic prices for the cuisine type and market
- Each design MUST be visually unique — different color palette, typography, layout variations
- Use gradient overlays on hero images that match the restaurant's mood

### Step 4: Create QWeb Web Preview Page

Use the `odoo-qweb-page` skill patterns from `odoo-dev-toolkit` to create a professional landing page.

**The page MUST:**
- Use `website.layout` with `page.layout` structure
- Be published (`website_published: True`)
- NOT be in menu (don't create `website.menu` entry)
- Match the company's industry and style (see Industry-Specific Design below)
- Include ALL sections: Hero (with gradient overlay), About, Photo Gallery (2x2 grid), Sample Menu, Reviews, Contact (with map + social links), CTA Pricing
- Have full SEO meta tags and JSON-LD
- Be visually impressive — this IS the sales pitch
- Contain REAL photos of the business (see Photo Sourcing below)
- Use scroll animations (IntersectionObserver + fade-in classes)
- Hide Odoo header/footer via CSS (`header.o_header, footer.o_footer { display:none !important; }`)
- Include embedded Google Maps iframe for the address
- Show real social media links (Facebook, Instagram) if available
- Display sample menu items with realistic prices
- Show customer reviews/testimonials

#### Industry-Specific Design Guidelines

The web preview style MUST match the target company's industry. Analyze the company type and select appropriate design:

**Restaurants / Cafes / Bars:**
- Colors: UNIQUE per restaurant — choose from: warm earth tones, deep wine, Mediterranean terracotta, modern sage, bold amber, elegant navy, rich burgundy. NEVER reuse the same palette across restaurants.
- Fonts: Mix from: Playfair Display, DM Serif Display, Libre Baskerville, Merriweather, Oswald (display) + Inter, DM Sans, Source Sans 3, Nunito Sans, Barlow (body). Each restaurant gets a unique pair.
- Required sections (in order):
  1. **Hero** — full-screen with real photo, gradient overlay matching brand colors, restaurant name, cuisine badge, CTA button, scroll indicator
  2. **About** — split layout (text + photo), address with map pin icon, description highlighting unique selling points
  3. **Gallery** — 2x2 symmetric grid, real photos, NO text captions (photos speak for themselves), hover zoom effect
  4. **Sample Menu** — 4 items minimum, item name + description + price, dotted line separator, note about seasonal changes
  5. **Reviews** — 3 reviews in grid, star ratings (SVG), quoted text, author name, must feel authentic and mention specific dishes
  6. **Contact** — split layout: left = address/phone/hours/email/social links, right = embedded Google Maps iframe
  7. **CTA Pricing** — centered card, 890 Kč/měsíc, list of included features (from prospect-offer-details), gradient CTA button
- Style: Modern, clean, visually unique per restaurant, use gradient overlays, smooth scroll animations
- NEVER use emoji — only inline SVG icons

**Tech / SaaS / IT:**
- Colors: Dark (#0a0a0f), electric blue (#3B82F6), accent (#60a5fa), text-muted (#a0aec0)
- Fonts: Inter (headings + body)
- Sections: Hero with product mockup, Features grid, Stats/metrics, Integrations, Pricing tiers, CTA
- Style: Modern, dark theme, clean lines, tech feel

**Hotels / Accommodation:**
- Colors: Dark navy (#1A1A22), warm red (#E06060), gold accent, cream
- Fonts: Playfair Display + DM Sans
- Sections: Hero slider, Rooms gallery, Amenities, Location map, Reviews, Booking CTA
- Style: Luxurious, photo-heavy, sophisticated

**Retail / E-commerce:**
- Colors: Clean white, brand accent color, soft gray backgrounds
- Fonts: Modern sans-serif
- Sections: Hero with product showcase, Categories, Featured products, Reviews, Why shop with us
- Style: Clean, product-focused, trustworthy

**Services / Consulting:**
- Colors: Professional blue/navy, white, subtle accents
- Fonts: Clean sans-serif
- Sections: Hero, Services list, Process/How it works, Team, Testimonials, Contact
- Style: Professional, trust-building, expertise-focused

**Healthcare / Medical:**
- Colors: Calming blue/green, white, clean
- Sections: Hero, Services, Team/doctors, Certifications, Location, Contact
- Style: Clean, trustworthy, calming

#### Photo Sourcing for Web Preview

Search for REAL photos of the business from these sources (in priority order):

1. **Google Maps** — business profile photos, street view
2. **restaurantguru.com** — for restaurants (high quality food/interior photos)
3. **firmy.cz** — Czech business directory with photos
4. **Facebook/Instagram** — business page photos (public only)
5. **TripAdvisor** — for hospitality/restaurants
6. **Company's own website** — existing images

**Search strategy:**
```
# Web search for photos
"{company_name}" site:restaurantguru.com  # for restaurants
"{company_name}" site:firmy.cz           # for any Czech business
"{company_name}" photos interior food     # general search
```

Use found image URLs directly in the template (hotlinking). Place photos in:
- Hero background (interior/exterior shot)
- Photo gallery grids (food/products/services)
- Section backgrounds with overlay

If no real photos found, use **Unsplash mockup photos** matching the industry (hotel rooms, restaurant interiors, bar atmosphere, outdoor terraces, building exteriors). Unsplash photos are free for commercial use. Use direct image URLs: `https://images.unsplash.com/photo-{ID}?w=800&q=80`. Note the use of mockups in the output summary.

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
- NO `<odoo>`, `<data>` wrappers
- **NEVER use `<template>` tag in arch_db** — use `<t t-name="...">` instead. `<template>` is only for XML data files, `arch_db` needs `<t t-name>` as root element.
- Start with `<t t-name="website.{page_slug}">`
- Use `<t t-call="website.layout">`
- `<div id="wrap" class="oe_structure oe_empty">`
- Every `<section>` has `o_colored_level`
- CSS in `<style>` tag inside the `<t t-call="website.layout">` block (inline in template)
- All CSS classes namespaced (prefix with `rp-`, `pv-`, etc. for "preview")

**CRITICAL — Duplicate Views Warning:**
When updating an `ir.ui.view`, Odoo may have created a **website-specific copy** (with `website_id` set). Odoo always serves the website-specific view over the generic one. When updating `arch_db`, you MUST:
1. Search for ALL views with the same `key`: `models.execute_kw(DB, UID, KEY, 'ir.ui.view', 'search_read', [[['key', '=', view_key]]], {'fields': ['id', 'website_id', 'active']})`
2. Update ALL matching views (both generic and website-specific)
3. If only updating the generic view (no `website_id`), the change will NOT be visible on the website

### Step 5: Create Personalized Email Template

Create an email matching the web preview style. Read the `email-templates` SKILL for Odoo mailing editor block structure.

**The email MUST:**
- Use Odoo mailing editor block structure (see email-templates SKILL for `o_mail_snippet_general` classes)
- Use `o_layout` wrapper → `o_mail_wrapper` container → `oe_structure` column
- Every content block needs `o_mail_snippet_general` class for editability in Odoo
- Match the same color scheme as the web preview (industry-specific)
- Start with "View Online" block (`o_snippet_view_in_browser`)
- Explain what was done ("Připravili jsme pro vás náhled nového webu")
- Include link to the web preview page
- Show pricing (web, server, design, SSL, bezpečnost, údržba od 490 Kč/měsíc)
- Have a clear CTA ("Zobrazit váš nový web")
- Include unsubscribe link in footer
- Set BOTH `body_arch` AND `body_html` to the same HTML

```python
partner_model_id = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'res.partner']]])[0]

email_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': f'Připravili jsme pro vás náhled nového webu — {company_name}',
    'mailing_type': 'mail',
    'body_arch': email_html,  # QWeb editable template with o_mail_snippet_general blocks
    'body_html': email_html,  # Same HTML for sending
    'mailing_model_id': partner_model_id,
    'mailing_domain': f'["&", ("is_blacklisted", "=", False), ("id", "=", {partner_id})]',
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

### Step 6: Create SMS Template

Short catchy SMS (max 1-2 SMS = 320 chars, ideally under 160 for 1 SMS) with link to email browser view.

**SMS format:** Catchy hook + link to email view (not web preview) + sender signature.
**Link:** Use `/mailing/{email_mailing_id}/view` to show the full email with web preview link.

```python
sms_mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': f'SMS — {company_name}',
    'mailing_type': 'sms',
    'body_plaintext': f'Dobry den, pripravili jsme ukazku noveho webu pro vasi restauraci ZDARMA. Podivejte se: https://www.michalvarys.eu/mailing/{email_mailing_id}/view - Michal, varyshop.eu',
    'mailing_model_id': partner_model_id,
    'mailing_domain': f'["&", ("phone_sanitized_blacklisted", "=", False), ("id", "=", {partner_id})]',
    'state': 'draft',
}])
```

### Step 7: Set Up Mailing Infrastructure (OPTIONAL)

> **Note:** When targeting res.partner directly (Steps 5-6 above), mailing lists are NOT needed.
> Only create mailing list infrastructure if you want to use list-based targeting instead.


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

### Step 8: Set Up UTM Campaign & Link Tracking

Create a shared UTM campaign for all touchpoints (web, email, SMS) so clicks are tracked consistently.

```python
# 1. Use or create UTM campaign
campaign_id = 3  # "Web zdarma" - or create new:
# campaign_id = models.execute_kw(DB, UID, KEY, 'utm.campaign', 'create', [{'name': 'Web zdarma', 'title': 'Web zdarma'}])

# 2. Create UTM source for this prospect
source_id = models.execute_kw(DB, UID, KEY, 'utm.source', 'create', [{
    'name': f'Prospect {company_name}'
}])

# 3. Create tracked links for web preview CTA buttons
tracker_cta_id = models.execute_kw(DB, UID, KEY, 'link.tracker', 'create', [{
    'url': f'https://www.michalvarys.eu/contactus?partner={company_slug}',
    'title': f'Mam zajem - {company_name}',
    'campaign_id': campaign_id,
    'source_id': source_id,
    'medium_id': 1,  # Website
    'label': 'Mam zajem',
}])
tracker_data = models.execute_kw(DB, UID, KEY, 'link.tracker', 'read', [[tracker_cta_id]], {
    'fields': ['short_url', 'code']
})
cta_short_url = tracker_data[0]['short_url']  # e.g. https://www.michalvarys.eu/r/bPY

# 4. Use short URLs in web preview template (replace mailto: links)
# All CTA buttons on web preview should use tracked short URLs

# 5. Assign UTM campaign to email mailing
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'write', [[email_mailing_id], {
    'campaign_id': campaign_id,
    'source_id': source_id,
    'medium_id': 4,  # Email
}])

# 6. Assign UTM campaign to SMS mailing
models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'write', [[sms_mailing_id], {
    'campaign_id': campaign_id,
    'source_id': source_id,
    'medium_id': 11,  # SMS
}])
```

**Key link.tracker fields:**
- `url` — target URL the user lands on
- `short_url` — generated trackable URL (e.g. `/r/bPY`)
- `campaign_id` — UTM campaign (shared across web/email/SMS)
- `source_id` — UTM source (prospect-specific)
- `medium_id` — UTM medium (1=Website, 4=Email, 11=SMS)
- `count` — click count (auto-updated)
- `link_click_ids` — individual click records with IP/timestamp

**All CTA buttons on web preview MUST use tracked short URLs**, not mailto: links. This way every click is recorded in Odoo under the campaign.

## Important Rules

1. **NEVER auto-send** emails or SMS. Always keep as draft.
2. **Web page is NOT in menu** — only accessible via direct URL.
3. **Web page SEO indexing is OFF** — it's a preview, not a permanent page.
4. **Partner comment contains the FULL analysis** — this is the sales intel.
5. **Email style matches the web preview** — consistent branding.
6. **Pricing always mentions: od 890 Kč/měsíc** — for web, server, design, SSL, bezpečnost a údržba.
7. **All links in email get automatic Odoo tracking** — no manual UTM needed.
8. **All CTA links on web preview use link.tracker short URLs** — for click tracking under the UTM campaign.
9. **Same UTM campaign is assigned to web, email, and SMS** — unified analytics.

## Design Rules (CRITICAL)

### Photos are MANDATORY
Every web preview page MUST contain photos. A page without photos looks empty and unconvincing.

**Photo sourcing priority:**
1. Real photos from the business (their website uploads, Google Maps, Restaurant Guru, firmy.cz, Facebook)
2. If real photos are unavailable (JS rendering, no photos online), use **Unsplash mockup photos** matching the industry
3. Unsplash URL format: `https://images.unsplash.com/photo-{ID}?w=800&q=80`

**Where to place photos:**
- Hero section: fullscreen background image with dark overlay
- Pillar/feature cards: photo on top, text below (card pattern)
- Content sections: large photo alongside text (split layout)
- Fullscreen photo sections with overlay for atmosphere (e.g. restaurant)
- Gallery section: grid of 4-6 photos with hover zoom effect

**When using mockups, note it in the output summary** — real photos will replace mockups after client approval.

### Color Palette Must Match Industry
- **Restaurants / Penziony / Hotely:** ALWAYS use warm, cozy, hospitality-appropriate colors — cream (#FDF8F0), warm beige (#F5EDE0), browns (#5B3A1E, #3D2B1F), gold (#C4943A, #D4A853), dark wood (#1A1510). Use Playfair Display + DM Sans fonts.
- **NEVER use tech/startup aesthetics** (purple, neon, electric blue, dark futuristic themes) for restaurants, pensions, or hotels. These businesses need warmth, not Silicon Valley vibes.

### Email Preview Text (Preheader)
Every prospect email MUST include a preview/preheader text that appears in the inbox before opening:
- Add a hidden div at the top of email HTML: `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Preview text here</div>`
- Also set the `preview` field on mailing.mailing if available
- Example: "Mrkněte na hotový návrh zdarma — žádný risk, žádné závazky."

### Contact Info in Materials
- In prospect emails, SMS, and web preview CTA sections, provide ONLY **info@michalvarys.eu** as contact
- Do NOT include a phone number for callbacks
- The prospect's own contact info (phone, email) is fine to display on their web preview page
