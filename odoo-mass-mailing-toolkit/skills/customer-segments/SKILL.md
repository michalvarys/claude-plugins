---
name: customer-segments
description: >
  Segmentace zákazníků v Odoo 18 podle nákupních pravidel (pos.order + sale.order) přes XML-RPC API.
  Use this skill when the user asks to "segment customers", "group customers", "find customers who",
  "segmentuj zákazníky", "najdi zákazníky kteří", "zákazníci kteří nenakoupili",
  "zákazníci kteří nakupují", "zákazníci kteří kupují", "RFM segmentace",
  "customer segmentation", "customer groups", "cílová skupina",
  "nenakoupili 3 měsíce", "nenakoupili rok", "nakupují ve všední dny",
  "kupují šunkovou pizzu", "kupují noky", "zákazníci s více objednávkami",
  or any request involving grouping/filtering customers by purchase behavior.
---

# Odoo 18 Customer Segmentation (pos.order + sale.order)

Segmentace zákazníků podle nákupních pravidel — recency, frequency, produkty, čas.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` for connection setup.

Also read the purchase-analysis skill for data fetching patterns:
`${CLAUDE_PLUGIN_ROOT}/skills/purchase-analysis/SKILL.md`

## Configuration

Environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY`, `ORDER_URL` (UID se zjistí automaticky)

## Předdefinované segmenty

### 1. WIN-BACK — Nenakoupili X měsíců ale nakoupili v posledním roce

**Pravidlo:** Poslední objednávka je starší než X měsíců, ale ne starší než Y měsíců.

```python
from datetime import datetime, timedelta

# Parametry
min_inactive_days = 90   # nenakoupili alespoň 3 měsíce
max_inactive_days = 365  # ale nakoupili v posledním roce

cutoff_recent = (datetime.now() - timedelta(days=min_inactive_days)).strftime('%Y-%m-%d')
cutoff_old = (datetime.now() - timedelta(days=max_inactive_days)).strftime('%Y-%m-%d')

# POS: zákazníci co nakoupili za posledních 12 měsíců
pos_recent = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['date_order', '>=', cutoff_old],
     ['state', 'in', ['paid', 'done', 'invoiced']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

# Sale: stejný dotaz
sale_recent = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['date_order', '>=', cutoff_old],
     ['state', 'in', ['sale', 'done']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

# Najdi poslední objednávku každého zákazníka
from collections import defaultdict
last_order = defaultdict(lambda: None)

for order in pos_recent + sale_recent:
    pid = order['partner_id'][0]
    dt = order['date_order']
    if last_order[pid] is None or dt > last_order[pid]:
        last_order[pid] = dt

# Filtruj: poslední nákup starší než cutoff_recent
winback_partners = []
for pid, last_dt in last_order.items():
    last = datetime.fromisoformat(last_dt.replace(' ', 'T'))
    if last < datetime.fromisoformat(cutoff_recent + 'T00:00:00'):
        winback_partners.append(pid)

print(f"Win-back segment: {len(winback_partners)} zákazníků")
```

### 2. REACTIVATION — Nenakoupili rok + mají více než 1 objednávku

**Pravidlo:** Poslední objednávka starší než rok, ale celkem udělali 2+ objednávek.

```python
cutoff_year = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')

# Všechny objednávky (neomezené časem)
all_pos = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['state', 'in', ['paid', 'done', 'invoiced']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

all_sales = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['state', 'in', ['sale', 'done']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

# Agregace per zákazník
customer_orders = defaultdict(list)
for order in all_pos + all_sales:
    pid = order['partner_id'][0]
    customer_orders[pid].append(order['date_order'])

# Filtruj: poslední objednávka > rok + počet objednávek >= 2
cutoff_dt = datetime.fromisoformat(cutoff_year + 'T00:00:00')
reactivation_partners = []
for pid, dates in customer_orders.items():
    dates_sorted = sorted(dates, reverse=True)
    last = datetime.fromisoformat(dates_sorted[0].replace(' ', 'T'))
    if last < cutoff_dt and len(dates_sorted) >= 2:
        reactivation_partners.append(pid)

print(f"Reactivation segment: {len(reactivation_partners)} zákazníků")
```

### 3. WEEKDAY-LUNCH — Nakupují ve všední dny 11-15h

**Pravidlo:** Zákazník má alespoň 2 objednávky v pondělí-středa mezi 11:00-15:00 a alespoň 30% jeho objednávek je v tomto čase.

```python
all_pos = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['state', 'in', ['paid', 'done', 'invoiced']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

# Doplň i sale.order
all_sales = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['state', 'in', ['sale', 'done']],
     ['partner_id', '!=', False]]
], {'fields': ['partner_id', 'date_order']})

weekday_lunch = defaultdict(int)
total_orders = defaultdict(int)

for order in all_pos + all_sales:
    pid = order['partner_id'][0]
    dt = datetime.fromisoformat(order['date_order'].replace(' ', 'T'))
    total_orders[pid] += 1
    # pondělí=0, úterý=1, středa=2 a hodiny 11-15
    if dt.weekday() <= 2 and 11 <= dt.hour < 15:
        weekday_lunch[pid] += 1

# Filtr: min 2 nákupy v čase, min 30% podíl
lunch_partners = [
    pid for pid, count in weekday_lunch.items()
    if count >= 2 and (count / total_orders[pid]) >= 0.3
]

print(f"Weekday-lunch segment: {len(lunch_partners)} zákazníků")
```

### 4. PRODUCT-LOVERS — Zákazníci kupující konkrétní produkt

**Pravidlo:** Zákazník koupil produkt X alespoň N-krát (default N=1).

```python
def find_product_lovers(product_name, min_purchases=1):
    """Najdi zákazníky kteří kupují produkt s daným názvem."""

    # Hledej produkty (částečná shoda)
    products = models.execute_kw(DB, UID, KEY, 'product.product', 'search_read', [
        [['name', 'ilike', product_name]]
    ], {'fields': ['id', 'name']})
    product_ids = [p['id'] for p in products]

    if not product_ids:
        print(f"Produkt '{product_name}' nenalezen")
        return []

    print(f"Nalezené produkty: {[p['name'] for p in products]}")

    # POS řádky s produktem
    pos_lines = models.execute_kw(DB, UID, KEY, 'pos.order.line', 'search_read', [
        [['product_id', 'in', product_ids],
         ['order_id.state', 'in', ['paid', 'done', 'invoiced']]]
    ], {'fields': ['order_id']})

    pos_order_ids = list(set([l['order_id'][0] for l in pos_lines]))

    # Sale řádky s produktem
    sale_lines = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'search_read', [
        [['product_id', 'in', product_ids],
         ['order_id.state', 'in', ['sale', 'done']]]
    ], {'fields': ['order_id']})

    sale_order_ids = list(set([l['order_id'][0] for l in sale_lines]))

    # Získej partnery z objednávek
    partner_purchase_count = defaultdict(int)

    if pos_order_ids:
        pos_orders = models.execute_kw(DB, UID, KEY, 'pos.order', 'read', [
            pos_order_ids
        ], {'fields': ['partner_id']})
        for o in pos_orders:
            if o['partner_id']:
                partner_purchase_count[o['partner_id'][0]] += 1

    if sale_order_ids:
        sale_orders = models.execute_kw(DB, UID, KEY, 'sale.order', 'read', [
            sale_order_ids
        ], {'fields': ['partner_id']})
        for o in sale_orders:
            if o['partner_id']:
                partner_purchase_count[o['partner_id'][0]] += 1

    # Filtr: minimální počet nákupů
    result = [pid for pid, count in partner_purchase_count.items() if count >= min_purchases]
    print(f"Product-lovers '{product_name}': {len(result)} zákazníků (min {min_purchases} nákupů)")
    return result
```

**Příklady volání:**
```python
# Zákazníci co někdy koupili noky
noky_lovers = find_product_lovers('noky', min_purchases=1)

# Zákazníci co koupili šunkovou pizzu alespoň 2x
sunkova_fans = find_product_lovers('šunková pizza', min_purchases=2)

# Zákazníci co koupili jakoukoliv pizzu
pizza_fans = find_product_lovers('pizza', min_purchases=1)
```

### 5. HIGH-VALUE — Zákazníci s vysokou útratou

```python
# Průměrná útrata per zákazník
customer_totals = defaultdict(float)
for order in all_pos + all_sales:
    pid = order['partner_id'][0]
    customer_totals[pid] += order['amount_total']

# Top 20% zákazníků
sorted_customers = sorted(customer_totals.items(), key=lambda x: x[1], reverse=True)
top_20_percent = sorted_customers[:max(1, len(sorted_customers) // 5)]
high_value_partners = [pid for pid, total in top_20_percent]
```

## Kombinování segmentů

Segmenty lze kombinovat:

```python
# Zákazníci co nenakoupili 3 měsíce A koupili šunkovou pizzu
combined = set(winback_partners) & set(find_product_lovers('šunková pizza'))

# Zákazníci co nenakoupili rok NEBO jsou high-value
combined_or = set(reactivation_partners) | set(high_value_partners)
```

## Filtrace blacklistu

VŽDY po segmentaci odfiltruj blacklistnuté zákazníky:

### Pro SMS kampaně:
```python
# Získej partner data a filtruj blacklist
valid_partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['id', 'in', segment_partner_ids],
     ('is_blacklisted', '=', False),
     ('phone_sanitized_blacklisted', '=', False),
     ('phone', '!=', False)]
], {'fields': ['id', 'name', 'phone', 'mobile', 'email']})
```

### Pro email kampaně:
```python
valid_partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['id', 'in', segment_partner_ids],
     ('is_blacklisted', '=', False),
     ('email', '!=', False)]
], {'fields': ['id', 'name', 'email', 'phone']})
```

## Výstup segmentu

Po segmentaci vždy vrať:

```
📋 SEGMENT: {segment_name}
─────────────────────────────
Pravidlo: {rule_description}
Zákazníků celkem: {total_count}
Po filtraci blacklistu: {valid_count}

Příklady zákazníků:
1. {name1} — {email1} / {phone1}
2. {name2} — {email2} / {phone2}
3. {name3} — {email3} / {phone3}
... a dalších {remaining}

Partner IDs: [{id1}, {id2}, {id3}, ...]
```

## Workflow

1. Zjisti jaký segment uživatel chce (pravidlo, produkty, čas, recency...)
2. Stáhni relevantní objednávky z pos.order + sale.order
3. Aplikuj pravidla segmentace
4. Odfiltruj blacklistnuté zákazníky (podle typu kampaně SMS/email)
5. Prezentuj výsledek se souhrnem a příklady
6. Vrať partner_ids pro použití v targeted-campaign skillu
7. Nabídni vytvoření kampaně na tento segment
