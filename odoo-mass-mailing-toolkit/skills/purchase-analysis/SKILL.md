---
name: purchase-analysis
description: >
  Hloubková analýza nákupních dat zákazníků v Odoo 18 (pos.order + sale.order) přes XML-RPC API.
  Use this skill when the user asks to "analyze purchases", "purchase history", "what did customer buy",
  "nákupní historie", "analýza nákupů", "co zákazník nakupoval", "kdy nakupoval",
  "nákupní vzorce", "purchase patterns", "RFM analysis", "customer behavior",
  "produktové preference", "product preferences", "nakupní chování zákazníka",
  "analyzuj prodeje", "kdo kupuje", "nejčastější produkty", "top produkty",
  or any request involving analyzing pos.order or sale.order purchase data.
---

# Odoo 18 Purchase Analysis (pos.order + sale.order)

Hloubková analýza nákupních dat zákazníků — produktové preference, časování, frekvence, RFM metriky.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup.

## Configuration

Environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY`, `ORDER_URL` (UID se zjistí automaticky)

## DŮLEŽITÉ — Spojení POS a Sale dat

Zákazník může nakupovat přes POS (kamenná prodejna) i přes e-shop (sale.order). Analýza MUSÍ zahrnout OBĚ datové sady a spojit je přes `partner_id`.

## 1. Získání kompletní nákupní historie zákazníka

### POS objednávky

```python
pos_orders = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['partner_id', '=', partner_id], ['state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['name', 'date_order', 'amount_total', 'state'],
    'order': 'date_order DESC',
})

# Řádky POS objednávek
if pos_orders:
    pos_order_ids = [o['id'] for o in pos_orders]
    pos_lines = models.execute_kw(DB, UID, KEY, 'pos.order.line', 'search_read', [
        [['order_id', 'in', pos_order_ids]]
    ], {
        'fields': ['product_id', 'full_product_name', 'qty', 'price_subtotal_incl', 'discount', 'order_id'],
    })
```

### Sale objednávky

```python
sale_orders = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['partner_id', '=', partner_id], ['state', 'in', ['sale', 'done']]]
], {
    'fields': ['name', 'date_order', 'amount_total', 'state'],
    'order': 'date_order DESC',
})

# Řádky sale objednávek
if sale_orders:
    sale_order_ids = [o['id'] for o in sale_orders]
    sale_lines = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'search_read', [
        [['order_id', 'in', sale_order_ids]]
    ], {
        'fields': ['product_id', 'product_uom_qty', 'price_subtotal', 'discount', 'order_id'],
    })
```

## 2. Analýza všech zákazníků (hromadná)

### Všechny POS objednávky s partnerem

```python
from datetime import datetime, timedelta

# Všechny POS objednávky za posledních 12 měsíců
date_from = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
all_pos = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['date_order', '>=', date_from],
     ['state', 'in', ['paid', 'done', 'invoiced']],
     ['partner_id', '!=', False]]
], {
    'fields': ['partner_id', 'date_order', 'amount_total', 'id'],
    'order': 'date_order DESC',
})
```

### Všechny Sale objednávky s partnerem

```python
all_sales = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['date_order', '>=', date_from],
     ['state', 'in', ['sale', 'done']],
     ['partner_id', '!=', False]]
], {
    'fields': ['partner_id', 'date_order', 'amount_total', 'id'],
    'order': 'date_order DESC',
})
```

## 3. RFM Analýza (Recency, Frequency, Monetary)

Pro každého zákazníka vypočítej:

```python
from collections import defaultdict
from datetime import datetime

customer_data = defaultdict(lambda: {'orders': [], 'total_spent': 0, 'products': defaultdict(int)})

# Zpracování POS
for order in all_pos:
    pid = order['partner_id'][0]  # partner_id is [id, name]
    customer_data[pid]['orders'].append(order['date_order'])
    customer_data[pid]['total_spent'] += order['amount_total']

# Zpracování Sale
for order in all_sales:
    pid = order['partner_id'][0]
    customer_data[pid]['orders'].append(order['date_order'])
    customer_data[pid]['total_spent'] += order['amount_total']

now = datetime.now()
for pid, data in customer_data.items():
    dates = sorted(data['orders'], reverse=True)
    last_order = datetime.fromisoformat(dates[0].replace(' ', 'T'))
    data['recency_days'] = (now - last_order).days
    data['frequency'] = len(dates)
    data['monetary'] = data['total_spent']
    data['avg_order_value'] = data['total_spent'] / len(dates)

    # Časový vzorec — hodina a den v týdnu
    order_hours = [datetime.fromisoformat(d.replace(' ', 'T')).hour for d in dates]
    order_weekdays = [datetime.fromisoformat(d.replace(' ', 'T')).weekday() for d in dates]
    data['typical_hour'] = max(set(order_hours), key=order_hours.count) if order_hours else None
    data['typical_weekday'] = max(set(order_weekdays), key=order_weekdays.count) if order_weekdays else None
```

## 4. Produktová analýza

### Top produkty zákazníka (POS)

```python
# Získej řádky pro všechny objednávky zákazníka
pos_lines = models.execute_kw(DB, UID, KEY, 'pos.order.line', 'search_read', [
    [['order_id.partner_id', '=', partner_id],
     ['order_id.state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['full_product_name', 'product_id', 'qty', 'price_subtotal_incl'],
})

# Agregace produktů
product_stats = defaultdict(lambda: {'qty': 0, 'revenue': 0, 'count': 0})
for line in pos_lines:
    pname = line['full_product_name'] or line['product_id'][1]
    product_stats[pname]['qty'] += line['qty']
    product_stats[pname]['revenue'] += line['price_subtotal_incl']
    product_stats[pname]['count'] += 1

# Seřaď podle počtu nákupů
top_products = sorted(product_stats.items(), key=lambda x: x[1]['count'], reverse=True)
```

### Hledání zákazníků kteří kupují konkrétní produkt

```python
# Najdi produkt podle názvu (částečná shoda)
products = models.execute_kw(DB, UID, KEY, 'product.product', 'search_read', [
    [['name', 'ilike', 'šunková pizza']]
], {'fields': ['id', 'name']})
product_ids = [p['id'] for p in products]

# Najdi POS objednávky obsahující tento produkt
pos_lines_with_product = models.execute_kw(DB, UID, KEY, 'pos.order.line', 'search_read', [
    [['product_id', 'in', product_ids],
     ['order_id.state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['order_id'],
})

# Získej unikátní objednávky a z nich partnery
order_ids = list(set([l['order_id'][0] for l in pos_lines_with_product]))
orders_with_partners = models.execute_kw(DB, UID, KEY, 'pos.order', 'read', [
    order_ids
], {'fields': ['partner_id']})
partner_ids = list(set([o['partner_id'][0] for o in orders_with_partners if o['partner_id']]))

# Stejně pro sale.order.line
sale_lines_with_product = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'search_read', [
    [['product_id', 'in', product_ids],
     ['order_id.state', 'in', ['sale', 'done']]]
], {
    'fields': ['order_id'],
})
sale_order_ids = list(set([l['order_id'][0] for l in sale_lines_with_product]))
if sale_order_ids:
    sale_orders_partners = models.execute_kw(DB, UID, KEY, 'sale.order', 'read', [
        sale_order_ids
    ], {'fields': ['partner_id']})
    partner_ids.extend([o['partner_id'][0] for o in sale_orders_partners if o['partner_id']])
    partner_ids = list(set(partner_ids))
```

## 5. Časové vzorce

### Zákazníci nakupující v konkrétní čas

```python
# Všechny POS objednávky s časovým údajem
all_pos_orders = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['state', 'in', ['paid', 'done', 'invoiced']],
     ['partner_id', '!=', False]]
], {
    'fields': ['partner_id', 'date_order'],
})

# Filtruj zákazníky co nakupují ve všední dny 11-15h
from collections import defaultdict
weekday_lunch = defaultdict(int)  # partner_id -> počet nákupů v čase
total_orders = defaultdict(int)    # partner_id -> celkový počet

for order in all_pos_orders:
    pid = order['partner_id'][0]
    dt = datetime.fromisoformat(order['date_order'].replace(' ', 'T'))
    total_orders[pid] += 1
    # pondělí=0 až pátek=4, hodiny 11-15
    if dt.weekday() <= 2 and 11 <= dt.hour < 15:  # po-st, 11-15h
        weekday_lunch[pid] += 1

# Zákazníci kde >50% nákupů je v daném čase (nebo absolutní minimum)
matching_partners = [
    pid for pid, count in weekday_lunch.items()
    if count >= 2 and count / total_orders[pid] >= 0.3
]
```

## Output Format

### Pro jednotlivého zákazníka:
```
📊 NÁKUPNÍ PROFIL: {jméno zákazníka}
─────────────────────────────
Celkem objednávek: {count} (POS: {pos_count}, E-shop: {sale_count})
Celková útrata: {total} Kč
Průměrná objednávka: {avg} Kč
První nákup: {first_date}
Poslední nákup: {last_date}
Recency: {days} dní od posledního nákupu
Frekvence: cca 1x za {avg_days_between} dní

TOP PRODUKTY:
1. {product1} — {qty1}x ({revenue1} Kč)
2. {product2} — {qty2}x ({revenue2} Kč)
3. {product3} — {qty3}x ({revenue3} Kč)

ČASOVÝ VZOREC:
Nejčastější den: {day_name}
Nejčastější hodina: {hour}:00
Vzorec: {pattern_description}
```

### Pro hromadnou analýzu:
```
📊 SOUHRN SEGMENTU: {segment_name}
─────────────────────────────
Zákazníků v segmentu: {count}
Celková útrata segmentu: {total} Kč
Průměrná útrata/zákazník: {avg} Kč
```

## Workflow

1. Zjisti co uživatel chce analyzovat (zákazník / segment / celá databáze)
2. Stáhni relevantní data z pos.order + sale.order + řádků
3. Spočítej RFM metriky a produktové preference
4. Analyzuj časové vzorce
5. Prezentuj výsledky ve strukturovaném formátu
6. Nabídni vytvoření segmentu nebo kampaně na základě výsledků
