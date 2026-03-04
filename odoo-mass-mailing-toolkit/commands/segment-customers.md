---
description: Segment customers by purchase behavior rules
allowed-tools: Read, Write, Bash, Grep
argument-hint: <rule-description>
---

Segment customers by rule: $ARGUMENTS

Read the customer-segments skill:
@${CLAUDE_PLUGIN_ROOT}/skills/customer-segments/SKILL.md

Read the purchase-analysis skill for data patterns:
@${CLAUDE_PLUGIN_ROOT}/skills/purchase-analysis/SKILL.md

Read the API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse the segmentation rule from arguments
2. Fetch relevant order data (pos.order + sale.order)
3. Apply segmentation logic
4. Filter blacklisted partners
5. Present segment results with count and example customers
6. Offer to create a campaign for this segment
