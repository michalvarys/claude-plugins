---
description: Analyze customer orders in Odoo
allowed-tools: Read, Write, Bash, Grep
argument-hint: <customer-name-or-id>
---

Analyze orders for customer: $ARGUMENTS

Read the analyze-orders skill:
@${CLAUDE_PLUGIN_ROOT}/skills/analyze-orders/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Find the partner by name or ID
2. Fetch all their orders and order lines
3. Calculate revenue metrics, product breakdown, and trends
4. Present a clear analysis summary
