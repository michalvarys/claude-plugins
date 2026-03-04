---
description: Create a CRM opportunity in Odoo
allowed-tools: Read, Write, Bash, Grep
argument-hint: <opportunity-title>
---

Create a CRM opportunity (crm.lead) in Odoo: $ARGUMENTS

Read the crm-opportunities skill:
@${CLAUDE_PLUGIN_ROOT}/skills/crm-opportunities/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Ask the user for opportunity details if not provided
2. Find or create the related partner
3. Create the CRM opportunity linked to the partner
4. Return the opportunity ID and Odoo link
