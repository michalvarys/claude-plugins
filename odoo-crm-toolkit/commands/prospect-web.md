---
description: Analyze company & create prospect web, CRM, email + SMS
allowed-tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch
argument-hint: <company-name-or-url>
---

Execute the full prospect-website workflow for the company: $ARGUMENTS

Read the prospect-website skill from this plugin first:
@${CLAUDE_PLUGIN_ROOT}/skills/prospect-website/SKILL.md

Also read the QWeb page creation patterns:
@${CLAUDE_PLUGIN_ROOT}/../odoo-dev-toolkit/skills/odoo-qweb-page/SKILL.md

Then follow these steps in order:

1. **Research the company** using web search and their website. Gather company info, contacts, digital footprint, selling arguments, and pain points.

2. **Create res.partner** in Odoo with the full analysis in the comment field (HTML formatted). Use the manage-partners skill patterns.

3. **Create CRM opportunity** linked to the partner. Use the crm-opportunities skill patterns.

4. **Create a QWeb web preview page** in Odoo via API. The page must be:
   - Beautiful, modern, SEO-optimized landing page showcasing a web redesign
   - Created via ir.ui.view + website.page API calls
   - Published but NOT in navigation menu
   - NOT indexed by search engines (website_indexed: False)
   - Following ALL QWeb patterns (no XML declaration, no odoo/data/template wrappers, oe_structure, o_colored_level, etc.)

5. **Create email mailing** as draft:
   - Personalized for the company
   - Matching the web preview style
   - Explaining what was created
   - Including link to web preview
   - Pricing: web, server, design, SSL, bezpečnost a údržba od 1 290 Kč/měsíc
   - Sender: Michal Varyš <info@michalvarys.eu>

6. **Create SMS mailing** as draft:
   - Short message with link to email browser view
   - Sender: Michal Varyš

7. **Set up mailing list and contact** linked to the partner.

8. **Present summary** with all created record IDs and links.

IMPORTANT: All mailings stay as DRAFT. Never auto-send.
