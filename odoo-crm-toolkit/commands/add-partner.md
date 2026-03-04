---
description: Create or update a contact/company in Odoo
allowed-tools: Read, Write, Bash, Grep
argument-hint: <partner-name>
---

Create or update a res.partner record in Odoo for: $ARGUMENTS

Read the manage-partners skill:
@${CLAUDE_PLUGIN_ROOT}/skills/manage-partners/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Ask the user for partner details if not provided (name, email, phone, company/person, address)
2. Search if partner already exists by name or email
3. If exists, ask user if they want to update
4. Create or update the partner
5. Return the partner ID and Odoo link
