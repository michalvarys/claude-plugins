---
description: Create targeted SMS/email campaign with promo code and customer segment
allowed-tools: Read, Write, Bash, Grep
argument-hint: <type: sms|email> <code> <segment-rule>
---

Create targeted campaign: $ARGUMENTS

Read ALL skills and references in this order:

1. Sales psychology reference:
@${CLAUDE_PLUGIN_ROOT}/references/sales-psychology.md

2. Targeted campaign skill (main orchestration):
@${CLAUDE_PLUGIN_ROOT}/skills/targeted-campaign/SKILL.md

3. Customer segments skill:
@${CLAUDE_PLUGIN_ROOT}/skills/customer-segments/SKILL.md

4. Purchase analysis skill:
@${CLAUDE_PLUGIN_ROOT}/skills/purchase-analysis/SKILL.md

5. API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: campaign type (SMS/email), promo code, and segment rule
2. Segment customers using the rule (pos.order + sale.order data)
3. Filter blacklisted partners (SMS: phone blacklist, Email: email blacklist)
4. Generate campaign text using sales psychology principles:
   - SMS: no diacritics, max 2 SMS (306 chars), clear CTA with link
   - Email: QWeb HTML template, catchy subject + preview, CTA button
5. Create mailing.mailing as DRAFT targeting res.partner with domain filter
6. Return campaign summary with Odoo admin link
7. NEVER auto-send — admin reviews and sends manually
