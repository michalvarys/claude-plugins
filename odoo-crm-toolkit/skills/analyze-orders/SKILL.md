---
name: analyze-orders
description: >
  Analyze customer orders (sale.order) in Odoo 18 via XML-RPC API. Use this skill when the user asks to
  "analyze orders", "show customer orders", "order history", "sales analysis",
  "revenue analysis", "product analysis", "analyzuj objednávky", "ukáž objednávky",
  "historie objednávek", "analýza prodejů", "analýza tržeb zákazníka",
  or any request involving analyzing, summarizing, or reporting on sale.order data in Odoo 18.
---

# Odoo 18 Order Analysis (sale.order)

Analyze customer orders, revenue trends, and product performance in Odoo 18 via XML-RPC API.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Analysis Queries

### Get Customer Orders

```python
orders = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['partner_id', '=', partner_id], ['state', 'in', ['sale', 'done']]]
], {
    'fields': ['name', 'date_order', 'amount_total', 'state', 'invoice_status'],
    'order': 'date_order DESC',
    'limit': 100,
})
```

### Get Order Lines (Products Bought)

```python
order_lines = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'search_read', [
    [['order_id', 'in', order_ids]]
], {
    'fields': ['product_id', 'product_uom_qty', 'price_unit', 'price_subtotal', 'discount', 'order_id'],
})
```

### Get All Orders in Date Range

```python
orders = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['date_order', '>=', '2025-01-01'], ['date_order', '<=', '2025-12-31'], ['state', 'in', ['sale', 'done']]]
], {
    'fields': ['name', 'partner_id', 'date_order', 'amount_total'],
    'order': 'date_order DESC',
})
```

### Revenue by Customer (aggregated)

```python
# Use read_group for aggregation
revenue = models.execute_kw(DB, UID, KEY, 'sale.order', 'read_group', [
    [['state', 'in', ['sale', 'done']]]
], {
    'fields': ['partner_id', 'amount_total'],
    'groupby': ['partner_id'],
    'orderby': 'amount_total DESC',
    'limit': 20,
})
```

### Monthly Revenue Trend

```python
monthly = models.execute_kw(DB, UID, KEY, 'sale.order', 'read_group', [
    [['state', 'in', ['sale', 'done'], ['date_order', '>=', '2025-01-01']]]
], {
    'fields': ['date_order', 'amount_total'],
    'groupby': ['date_order:month'],
    'orderby': 'date_order ASC',
})
```

### Product Performance

```python
products = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'read_group', [
    [['state', 'in', ['sale', 'done']]]
], {
    'fields': ['product_id', 'price_subtotal', 'product_uom_qty'],
    'groupby': ['product_id'],
    'orderby': 'price_subtotal DESC',
    'limit': 20,
})
```

## Analysis Output Format

Present analysis results in a clear, structured format:

### Customer Summary
- Total orders count
- Total revenue
- Average order value
- First and last order dates
- Most purchased products

### Revenue Breakdown
- By product category
- By time period (monthly/quarterly)
- Year-over-year comparison if data available

### Insights
- Buying frequency (days between orders)
- Trend direction (growing, stable, declining)
- Top products by quantity and revenue
- Discount usage patterns

## Workflow

1. Ask user which customer or date range to analyze
2. Fetch orders and order lines
3. Calculate aggregated metrics
4. Present a clear summary with key insights
5. Offer to export results or create a follow-up action
