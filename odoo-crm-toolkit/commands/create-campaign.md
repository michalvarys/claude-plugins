---
description: Create an email or SMS mailing campaign in Odoo
allowed-tools: Read, Write, Bash, Grep
argument-hint: <campaign-type: email|sms> <subject>
---

Create a mailing campaign in Odoo: $ARGUMENTS

Read the mailing-campaigns skill:
@${CLAUDE_PLUGIN_ROOT}/skills/mailing-campaigns/SKILL.md

Read the email-templates skill:
@${CLAUDE_PLUGIN_ROOT}/skills/email-templates/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Determine campaign type (email or SMS) from arguments
2. Ask for subject, content, and target list
3. Create email/SMS body following the template patterns
4. Create the mailing as DRAFT
5. Return the campaign ID and Odoo admin link for review
