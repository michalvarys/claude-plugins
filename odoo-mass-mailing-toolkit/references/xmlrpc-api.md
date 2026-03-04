# Odoo 18 XML-RPC API Reference — Mass-Mailing

## Connection Setup

```python
import xmlrpc.client
import os

ODOO_URL = os.environ.get('ODOO_URL', 'https://michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

ODOO_UID = common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})
if not ODOO_UID:
    raise Exception("Authentication failed — check ODOO_API_KEY and ODOO_DB")
```

## Shorthand — použij v celém skriptu

```python
DB = ODOO_DB
UID = ODOO_UID
KEY = ODOO_API_KEY
```

## pos.order — POS Objednávky

### Klíčové fieldy

- `name` (str) — číslo objednávky (auto)
- `partner_id` (int) — zákazník
- `date_order` (datetime) — datum objednávky
- `amount_total` (float) — celková částka
- `amount_tax` (float) — DPH
- `amount_paid` (float) — zaplaceno
- `state` (str) — 'draft', 'paid', 'done', 'invoiced', 'cancel'
- `session_id` (int) — POS session
- `lines` (one2many) — řádky objednávky
- `pos_reference` (str) — POS reference

### Všechny POS objednávky zákazníka

```python
pos_orders = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['partner_id', '=', partner_id], ['state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['name', 'date_order', 'amount_total', 'state', 'partner_id'],
    'order': 'date_order DESC',
})
```

### POS objednávky v období

```python
pos_orders = models.execute_kw(DB, UID, KEY, 'pos.order', 'search_read', [
    [['date_order', '>=', '2025-01-01'], ['date_order', '<=', '2025-12-31'],
     ['state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['name', 'partner_id', 'date_order', 'amount_total'],
    'order': 'date_order DESC',
})
```

## pos.order.line — Řádky POS objednávky

### Klíčové fieldy

- `order_id` (int) — nadřazená objednávka
- `product_id` (int) — produkt
- `qty` (float) — množství
- `price_unit` (float) — jednotková cena
- `price_subtotal` (float) — mezisoučet bez DPH
- `price_subtotal_incl` (float) — mezisoučet s DPH
- `full_product_name` (str) — plný název produktu
- `discount` (float) — sleva v %

### Řádky objednávek

```python
pos_lines = models.execute_kw(DB, UID, KEY, 'pos.order.line', 'search_read', [
    [['order_id', 'in', pos_order_ids]]
], {
    'fields': ['product_id', 'full_product_name', 'qty', 'price_unit',
               'price_subtotal', 'price_subtotal_incl', 'discount', 'order_id'],
})
```

## sale.order — E-shop / Sale objednávky

### Klíčové fieldy

- `name` (str) — reference (auto)
- `partner_id` (int) — zákazník
- `date_order` (datetime) — datum objednávky
- `amount_total` (float) — celková částka
- `state` (str) — 'draft', 'sent', 'sale', 'done', 'cancel'
- `order_line` (one2many) — řádky

### Všechny sale objednávky zákazníka

```python
sale_orders = models.execute_kw(DB, UID, KEY, 'sale.order', 'search_read', [
    [['partner_id', '=', partner_id], ['state', 'in', ['sale', 'done']]]
], {
    'fields': ['name', 'date_order', 'amount_total', 'state'],
    'order': 'date_order DESC',
})
```

## sale.order.line — Řádky sale objednávky

### Klíčové fieldy

- `order_id` (int) — nadřazená objednávka
- `product_id` (int) — produkt
- `product_uom_qty` (float) — množství
- `price_unit` (float) — jednotková cena
- `price_subtotal` (float) — mezisoučet
- `discount` (float) — sleva %

```python
sale_lines = models.execute_kw(DB, UID, KEY, 'sale.order.line', 'search_read', [
    [['order_id', 'in', sale_order_ids]]
], {
    'fields': ['product_id', 'product_uom_qty', 'price_unit', 'price_subtotal', 'discount', 'order_id'],
})
```

## res.partner — Zákazníci

### Klíčové fieldy pro mass-mailing

- `name` (str) — jméno
- `email` (str) — email
- `phone` (str) — telefon
- `mobile` (str) — mobil
- `is_blacklisted` (bool) — na blacklistu
- `phone_sanitized_blacklisted` (bool) — telefon na blacklistu
- `customer_rank` (int) — >0 = zákazník

### Vyhledání zákazníků s filtrováním blacklistu

SMS:
```python
partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    ["&", "&",
     ("is_blacklisted", "=", False),
     ("phone_sanitized_blacklisted", "=", False),
     ("phone", "!=", False)]
], {'fields': ['id', 'name', 'email', 'phone', 'mobile']})
```

Email:
```python
partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    ["&", ("is_blacklisted", "=", False), ("email", "!=", False)]
], {'fields': ['id', 'name', 'email', 'phone']})
```

## mailing.mailing — Kampaně

### Důležité: mailing_model = res.partner

Pro tento plugin cílíme přímo na res.partner (ne mailing.contact):

```python
# Najdi model ID pro res.partner
partner_model_ids = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'res.partner']]
])
partner_model_id = partner_model_ids[0]
```

### Vytvoření email kampaně cílené na res.partner

```python
mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Předmět emailu',
    'preview': 'Náhledový text v inboxu',
    'mailing_type': 'mail',
    'body_html': '<div>HTML obsah</div>',
    'mailing_model_id': partner_model_id,
    'mailing_model_name': 'res.partner',
    'mailing_model_real': 'res.partner',
    'mailing_domain': '[["&", ("is_blacklisted", "=", False), ("email", "!=", False), ("id", "in", [1,2,3])]]',
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

### Vytvoření SMS kampaně cílené na res.partner

```python
mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': 'Název SMS kampaně',
    'mailing_type': 'sms',
    'body_plaintext': 'Text SMS zpravy bez diakritiky. Odkaz: https://michalvarys.eu/page',
    'mailing_model_id': partner_model_id,
    'mailing_model_name': 'res.partner',
    'mailing_model_real': 'res.partner',
    'mailing_domain': '[["&", "&", ("is_blacklisted", "=", False), ("phone_sanitized_blacklisted", "=", False), ("id", "in", [1,2,3])]]',
    'state': 'draft',
}])
```

### Odoo admin link

```
{ODOO_URL}/web#id={mailing_id}&model=mailing.mailing&view_type=form
```

## Aggregace — read_group

```python
# Revenue per customer
revenue = models.execute_kw(DB, UID, KEY, 'pos.order', 'read_group', [
    [['state', 'in', ['paid', 'done', 'invoiced']]]
], {
    'fields': ['partner_id', 'amount_total'],
    'groupby': ['partner_id'],
    'orderby': 'amount_total DESC',
    'limit': 50,
})
```

## Error Handling

```python
try:
    result = models.execute_kw(DB, UID, KEY, 'model', 'method', [args])
except xmlrpc.client.Fault as e:
    print(f"Odoo Error: {e.faultString}")
except Exception as e:
    print(f"Connection Error: {e}")
```
