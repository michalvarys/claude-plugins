---
name: targeted-campaign
description: >
  Vytvoření cílené SMS nebo emailové kampaně v Odoo 18 na základě nákupních dat zákazníků.
  Orchestrační skill: analýza → segmentace → mailing list → SMS/email s prodejní psychologií.
  Use this skill when the user asks to "create campaign for", "vytvoř SMS s kódem",
  "vytvoř email s kódem", "kampaň pro zákazníky kteří", "SMS pro lidi co",
  "email pro zákazníky", "pošli nabídku", "promo kampaň", "slevový kód",
  "vytvoř mi SMS", "vytvoř mi email", "kampan s kodem", "masa mailing",
  "hromadná SMS", "hromadný email", "nabídka pro segment",
  or any request to create a targeted mailing campaign based on purchase behavior.
---

# Odoo 18 Targeted Campaign Creator

Orchestrační skill: segment zákazníků → mailing list → SMS/email s prodejní psychologií.

Before executing any API calls, read these references:
- `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` — XML-RPC API patterns
- `${CLAUDE_PLUGIN_ROOT}/references/sales-psychology.md` — Prodejní psychologie a vzory

Also use these skills for data:
- `${CLAUDE_PLUGIN_ROOT}/skills/purchase-analysis/SKILL.md` — Analýza nákupních dat
- `${CLAUDE_PLUGIN_ROOT}/skills/customer-segments/SKILL.md` — Segmentace zákazníků

## Configuration

Environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## CELKOVÝ WORKFLOW

### Krok 1: Porozumění požadavku

Z příkazu uživatele extrahuj:
1. **Typ kampaně**: SMS nebo email
2. **Slevový kód**: např. HAPPY10, NAVRAT, FREENOKY
3. **Pravidlo segmentu**: kdo jsou příjemci (nenakoupili 3 měsíce, kupují pizzu, atd.)
4. **Nabídka**: co zákazník dostane (sleva %, zdarma produkt, bonus, atd.)

### Krok 2: Segmentace zákazníků

Použij customer-segments skill k nalezení matching zákazníků. Konkrétní segment závisí na pravidle:

| Pravidlo uživatele | Segment typ | Parametry |
|---|---|---|
| "nenakoupili 3 měsíce" | WIN-BACK | min_inactive_days=90 |
| "nenakoupili rok + více objednávek" | REACTIVATION | min_orders=2 |
| "nakupují ve všední dny 11-15h" | WEEKDAY-LUNCH | weekdays=0-2, hours=11-15 |
| "kupují šunkovou pizzu" | PRODUCT-LOVERS | product_name="šunková pizza" |
| "někdy nakoupili noky" | PRODUCT-LOVERS | product_name="noky", min=1 |

### Krok 3: Filtrace blacklistu

DŮLEŽITÉ — vždy odfiltruj blacklistnuté zákazníky podle typu kampaně.

Pro SMS:
```python
valid_partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['id', 'in', segment_partner_ids],
     ('is_blacklisted', '=', False),
     ('phone_sanitized_blacklisted', '=', False),
     ('phone', '!=', False)]
], {'fields': ['id', 'name', 'phone', 'mobile', 'email']})
valid_ids = [p['id'] for p in valid_partners]
```

Pro email:
```python
valid_partners = models.execute_kw(DB, UID, KEY, 'res.partner', 'search_read', [
    [['id', 'in', segment_partner_ids],
     ('is_blacklisted', '=', False),
     ('email', '!=', False)]
], {'fields': ['id', 'name', 'email', 'phone']})
valid_ids = [p['id'] for p in valid_partners]
```

### Krok 4: Vytvoření kampaně

#### Model ID pro res.partner

```python
partner_model_ids = models.execute_kw(DB, UID, KEY, 'ir.model', 'search', [
    [['model', '=', 'res.partner']]
])
partner_model_id = partner_model_ids[0]
```

#### SMS kampaň

```python
# Vytvoř domain filter s ID příjemců a blacklist podmínkami
sms_domain = str([
    "&", "&", "&",
    ("is_blacklisted", "=", False),
    ("phone_sanitized_blacklisted", "=", False),
    ("phone", "!=", False),
    ("id", "in", valid_ids)
])

mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': f'SMS — {campaign_name}',
    'mailing_type': 'sms',
    'body_plaintext': sms_text,  # BEZ diakritiky!
    'mailing_model_id': partner_model_id,
    'mailing_model_name': 'res.partner',
    'mailing_model_real': 'res.partner',
    'mailing_domain': sms_domain,
    'state': 'draft',
}])
```

#### Email kampaň

```python
email_domain = str([
    "&", "&",
    ("is_blacklisted", "=", False),
    ("email", "!=", False),
    ("id", "in", valid_ids)
])

mailing_id = models.execute_kw(DB, UID, KEY, 'mailing.mailing', 'create', [{
    'subject': email_subject,
    'preview': preview_text,
    'mailing_type': 'mail',
    'body_html': email_html,
    'mailing_model_id': partner_model_id,
    'mailing_model_name': 'res.partner',
    'mailing_model_real': 'res.partner',
    'mailing_domain': email_domain,
    'state': 'draft',
    'email_from': 'Michal Varyš <info@michalvarys.eu>',
    'reply_to': 'info@michalvarys.eu',
    'keep_archives': True,
}])
```

---

## SMS ŠABLONY — Prodejní psychologie

### Pravidla SMS:
- BEZ diakritiky (čeština bez háčků a čárek)
- Max 306 znaků (2 SMS) — ideálně do 160 znaků (1 SMS)
- Jasný CTA s odkazem
- Slevový kód velkými písmeny
- Urgence / FOMO / personalizace

### Šablony podle segmentu:

#### WIN-BACK (nenakoupili X měsíců)
```
Ahoj! Chybite nam :-) Mame pro vas slevu s kodem {CODE} na cely sortiment. Platí do nedele! Objednejte: {ODOO_URL}/shop
```

#### REACTIVATION (nenakoupili rok)
```
Uz je to davno! Mame novou nabidku a pro vas kod {CODE} na -{DISCOUNT}%. Budeme se tesit: {ODOO_URL}/shop
```

#### WEEKDAY-LUNCH (nakupují v poledne)
```
Poledni pauza? Idealni cas na objednavku s kodem {CODE}! Neco navic jen pro vas: {ODOO_URL}/shop
```

#### PRODUCT-LOVERS (kupují specifický produkt)
```
Vase oblibene {PRODUCT}? Mame pro vas kod {CODE} — {OFFER}! Jen tento tyden: {ODOO_URL}/shop
```

#### CROSS-SELL (někdy koupili produkt)
```
{PRODUCT} vam chutnaly? Kod {CODE} = {PRODUCT} ZDARMA k objednavce nad {MIN_AMOUNT} Kc! {ODOO_URL}/shop
```

### Generování SMS textu:
Agent VŽDY vytvoří SMS text bez diakritiky. Použij převodní tabulku:
- á→a, č→c, ď→d, é→e, ě→e, í→i, ň→n, ó→o, ř→r, š→s, ť→t, ú→u, ů→u, ý→y, ž→z

---

## EMAIL ŠABLONY — QWeb HTML

### Pravidla emailu:
- Inline CSS (email klienti stripují <style>)
- Table-based layout (max 600px)
- Jasný předmět (max 50 znaků)
- Náhledový text (preview, 40-90 znaků)
- Hook — první věta navazuje na předmět
- CTA button — kontrastní barva, velký
- Unsubscribe + View in browser link
- Absolutní URL pro obrázky

### Email HTML šablona

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px; background: linear-gradient(135deg, {PRIMARY_COLOR} 0%, {SECONDARY_COLOR} 100%);">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                {HEADLINE}
                            </h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">
                                {SUBHEADLINE}
                            </p>
                        </td>
                    </tr>

                    <!-- Hook / Main content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                                {HOOK_TEXT}
                            </p>

                            <!-- Offer Box -->
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 24px; background: #fff8f0; border: 2px dashed {ACCENT_COLOR}; border-radius: 12px; text-align: center;">
                                        <p style="margin: 0 0 8px; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Váš slevový kód</p>
                                        <p style="margin: 0 0 12px; color: {ACCENT_COLOR}; font-size: 32px; font-weight: 800; letter-spacing: 3px;">{CODE}</p>
                                        <p style="margin: 0; color: #666; font-size: 15px;">{OFFER_DESCRIPTION}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px auto 0;">
                                <tr>
                                    <td style="border-radius: 10px; background-color: {CTA_COLOR};">
                                        <a href="{CTA_URL}"
                                           style="display: inline-block; padding: 16px 40px;
                                                  color: #ffffff; text-decoration: none;
                                                  font-weight: 700; font-size: 17px;">
                                            {CTA_TEXT}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Urgency -->
                            <p style="margin: 24px 0 0; color: #999; font-size: 13px; text-align: center;">
                                {URGENCY_TEXT}
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center;">
                            <p style="margin: 0 0 8px; color: #999; font-size: 12px;">
                                Michal Varyš | <a href="https://michalvarys.eu" style="color: #666; text-decoration: none;">michalvarys.eu</a>
                            </p>
                            <p style="margin: 0; color: #aaa; font-size: 11px;">
                                <a href="${object.mailing_id.mailing_url_unsubscribe}" style="color: #aaa; text-decoration: underline;">Odhlásit se</a>
                                &nbsp;|&nbsp;
                                <a href="${object.mailing_id.mailing_url_view}" style="color: #aaa; text-decoration: underline;">Otevřít v prohlížeči</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Předměty a preview texty podle segmentu:

| Segment | Předmět | Preview |
|---|---|---|
| WIN-BACK | "Máme pro vás překvapení" | "Sleva jen pro vás. Platí do neděle." |
| REACTIVATION | "Dlouho jsme se neviděli..." | "Speciální nabídka pro naše věrné zákazníky." |
| WEEKDAY-LUNCH | "Polední nabídka jen pro vás" | "Objednejte teď a získejte bonus navíc." |
| PRODUCT-LOVERS | "Pro milovníky {product}" | "K vaší oblíbené volbě máme dárek." |
| CROSS-SELL | "{Product} zdarma k objednávce" | "Speciální kód jen pro vás. Tento týden." |

### Barvy podle segmentu:

| Segment | PRIMARY | SECONDARY | ACCENT | CTA |
|---|---|---|---|---|
| WIN-BACK | #e74c3c | #c0392b | #e74c3c | #e74c3c |
| REACTIVATION | #8e44ad | #6c3483 | #8e44ad | #8e44ad |
| WEEKDAY-LUNCH | #f39c12 | #e67e22 | #f39c12 | #e67e22 |
| PRODUCT-LOVERS | #27ae60 | #1e8449 | #27ae60 | #27ae60 |
| CROSS-SELL | #2980b9 | #1a5276 | #2980b9 | #2980b9 |

---

## KOMPLETNÍ PŘÍKLADY

### Příklad 1: "vytvoř mi SMS s kódem HAPPY10 kde budou všichni kteří nenakoupili poslední 3 měsíce"

1. Segmentace: WIN-BACK (min_inactive_days=90)
2. Blacklist filtr: SMS
3. SMS text:
```
Ahoj! Chybite nam :-) Mame pro vas slevu -10% s kodem HAPPY10 na cely sortiment. Platí do nedele! Objednejte: https://michalvarys.eu/shop
```
4. Vytvoř mailing.mailing jako draft s mailing_domain

### Příklad 2: "vytvoř mi SMS s kódem NAVRAT kde budou všichni co nenakoupili rok a udělali více než 1 objednávku"

1. Segmentace: REACTIVATION (min_orders=2)
2. Blacklist filtr: SMS
3. SMS text:
```
Uz je to davno co jste u nas byli! Mame novou nabidku a pro vas slevovy kod NAVRAT na -15%. Budeme se tesit: https://michalvarys.eu/shop
```

### Příklad 3: "vytvoř mi email s kódem VSEDNI kde budou všichni kteří nakupují ve všední dny mezi 11-15h"

1. Segmentace: WEEKDAY-LUNCH
2. Blacklist filtr: email
3. Email: QWeb HTML s polední tematikou, kódem VSEDNI, CTA na objednávku

### Příklad 4: "vytvoř mi email s kódem SUNKOVA kde budou ti kteří kupují nejčastěji šunkovou pizzu"

1. Segmentace: PRODUCT-LOVERS (product_name="šunková pizza", min=2 pro "nejčastěji")
2. Blacklist filtr: email
3. Email: QWeb HTML s pizza tematikou, kódem SUNKOVA, nabídka k oblíbené pizze

### Příklad 5: "vytvoř mi SMS s kódem FREENOKY pro lidi kteří někdy nakoupili noky"

1. Segmentace: PRODUCT-LOVERS (product_name="noky", min=1)
2. Blacklist filtr: SMS
3. SMS text:
```
Noky vam chutnaly? Mame pro vas kod FREENOKY — noky ZDARMA k jakekoli objednavce nad 200 Kc! Objednejte: https://michalvarys.eu/shop
```

---

## VÝSTUP

Po vytvoření kampaně vždy vrať:

```
✅ KAMPAŇ VYTVOŘENA (DRAFT)
─────────────────────────────
Typ: {SMS/Email}
Název: {subject}
Kód: {promo_code}
Segment: {segment_description}
Příjemců: {count}

{Pro SMS:}
Text SMS:
"{sms_text}"
(Znaků: {char_count}, SMS: {sms_count})

{Pro Email:}
Předmět: {subject}
Preview: {preview_text}

Odoo link: {ODOO_URL}/web#id={mailing_id}&model=mailing.mailing&view_type=form

⚠️ Kampaň je v režimu DRAFT. Zkontrolujte a odešlete ručně z Odoo.
```

## DŮLEŽITÁ PRAVIDLA

1. **NIKDY neodesílat automaticky** — vždy DRAFT, admin zkontroluje a odešle
2. **SMS vždy BEZ diakritiky** — převeď české znaky
3. **Email vždy s inline CSS** — table layout, max 600px
4. **Vždy filtrovat blacklist** — podle typu kampaně (SMS/email)
5. **Domain filter na res.partner** — ne mailing.contact
6. **mailing_model_name = res.partner** — přímé cílení na partnery
7. **Vždy zahrnout slevový kód** v textu zprávy
8. **SMS max 2 SMS** (306 znaků) — ideálně 1 SMS (160 znaků)
9. **Email musí mít** unsubscribe + view in browser linky
10. **Vždy vrátit Odoo admin link** pro kontrolu
