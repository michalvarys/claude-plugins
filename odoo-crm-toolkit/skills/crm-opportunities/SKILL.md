---
name: crm-opportunities
description: >
  Create and manage CRM opportunities (crm.lead) in Odoo 18 via XML-RPC API. Use this skill when the user asks to
  "create an opportunity", "add a lead", "add to CRM", "create CRM record",
  "new sales opportunity", "přidej příležitost", "vytvoř lead",
  "přidej do CRM", "nová obchodní příležitost", "založ příležitost",
  or any request involving creating, searching, or managing CRM leads/opportunities in Odoo 18.
---

# Odoo 18 CRM Opportunity Management (crm.lead)

Create and manage CRM leads and opportunities in Odoo 18 via XML-RPC API.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup and field reference.

## Configuration

Same environment variables as other Odoo skills:
- `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky přes authenticate)

## Operations

### Create Opportunity

```python
lead_id = models.execute_kw(DB, UID, KEY, 'crm.lead', 'create', [{
    'name': 'Opportunity Title — Company Name',
    'type': 'opportunity',  # 'lead' or 'opportunity'
    'partner_id': partner_id,  # link to res.partner
    'email_from': 'contact@company.cz',
    'phone': '+420...',
    'website': 'https://company.cz',
    'expected_revenue': 15000.0,
    'probability': 30.0,
    'description': '<p>Detailed description of the opportunity</p>',
    'tag_ids': [(6, 0, tag_ids)],  # set tags
}])
```

### Get Pipeline Stages

```python
stages = models.execute_kw(DB, UID, KEY, 'crm.stage', 'search_read', [
    []
], {'fields': ['name', 'sequence'], 'order': 'sequence ASC'})
```

### Search Opportunities

```python
opportunities = models.execute_kw(DB, UID, KEY, 'crm.lead', 'search_read', [
    [['partner_id', '=', partner_id]]
], {'fields': ['name', 'stage_id', 'expected_revenue', 'probability', 'create_date']})
```

### Move to Stage

```python
models.execute_kw(DB, UID, KEY, 'crm.lead', 'write', [
    [lead_id],
    {'stage_id': target_stage_id}
])
```

### Get CRM Tags

```python
tags = models.execute_kw(DB, UID, KEY, 'crm.tag', 'search_read', [
    []
], {'fields': ['name', 'color']})
```

### Create CRM Tag

```python
tag_id = models.execute_kw(DB, UID, KEY, 'crm.tag', 'create', [{
    'name': 'Web Prospect',
    'color': 4,  # 0-11 color index
}])
```

## Description Field — Rich Content

The `description` field supports HTML. For prospect opportunities, structure it as:

```html
<div>
  <h3>Popis příležitosti</h3>
  <p>What the opportunity is about</p>

  <h3>Scope</h3>
  <ul>
    <li>Tvorba nového webu</li>
    <li>SEO optimalizace</li>
    <li>Hosting a údržba</li>
  </ul>

  <h3>Cenová nabídka</h3>
  <table>
    <tr><td>Web design</td><td>od X Kč</td></tr>
    <tr><td>Měsíční údržba</td><td>od 890 Kč/měsíc</td></tr>
  </table>

  <h3>Další kroky</h3>
  <p>Follow-up actions</p>
</div>
```

## Workflow

1. Ask user for opportunity details (or receive from prospect-website workflow)
2. Check if partner exists, create if needed (delegate to manage-partners skill)
3. Create the opportunity linked to the partner
4. Set appropriate stage and tags
5. Return the opportunity ID and summary
