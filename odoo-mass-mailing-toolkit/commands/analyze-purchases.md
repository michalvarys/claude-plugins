---
description: Analyze customer purchase history (pos.order + sale.order)
allowed-tools: Read, Write, Bash, Grep
argument-hint: <customer-name-or-id>
---

Analyze purchase history for: $ARGUMENTS

Read the purchase-analysis skill:
@${CLAUDE_PLUGIN_ROOT}/skills/purchase-analysis/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Find the partner by name or ID
2. Fetch all their POS orders (pos.order) and Sale orders (sale.order)
3. Fetch order lines for product breakdown
4. Calculate RFM metrics (Recency, Frequency, Monetary)
5. Analyze product preferences and time patterns
6. Present a clear analysis with top products, buying patterns, and insights
7. Offer to create a segment or campaign based on findings
