# Odoo Mass-Mailing Toolkit

Odoo 18 mass-mailing plugin pro personalizované SMS a emailové kampaně založené na analýze nákupních dat zákazníků (pos.order + sale.order).

## Koncept

Plugin analyzuje nákupní historii zákazníků, segmentuje je podle chování a vytváří cílené SMS/email kampaně s textem optimalizovaným pro maximální míru otevření a prokliknutí.

## Setup

### Environment Variables (required)

- `ODOO_URL`: Odoo instance URL (default: `https://michalvarys.eu`)
- `ODOO_DB`: Database name (default: `varyshop`)
- `ODOO_API_KEY`: API key from Odoo user profile
- `ORDER_URL`: Odkaz na objednávkovou stránku (default: `https://new.pizzasidonio.cz/objednat`)

UID is automatically determined via `common.authenticate()`.

`ORDER_URL` se používá ve všech SMS a email šablonách jako dynamický odkaz. Při migraci na novou aplikaci stačí změnit na `https://app.pizzasidonio.cz/`.

### Závislosti

Pracuje společně s **odoo-crm-toolkit** — sdílí XML-RPC referenci a vzory pro mailing.

## Skills

### purchase-analysis
Hloubková analýza nákupních dat zákazníka — pos.order + sale.order. Produktové preference, časování nákupů, frekvence, RFM metriky (Recency, Frequency, Monetary).

### customer-segments
Segmentace zákazníků podle pravidel:
- Recency (kdy naposledy nakoupili)
- Frequency (jak často)
- Monetary (kolik utratili)
- Produktové preference (co nakupují)
- Časové vzorce (kdy nakupují — den v týdnu, hodina)
- Vlastní filtry (kombinace výše)

### targeted-campaign
Orchestrační skill: segment → mailing list → SMS/email s prodejní psychologií.
- SMS: 1-2 SMS bez diakritiky, maximalizace prokliknutí
- Email: QWeb HTML template s hookem, předmětem a náhledovým textem pro max míru otevření

## Commands

- `/analyze-purchases <customer>` — Analýza nákupní historie zákazníka
- `/segment-customers <rule>` — Segmentace zákazníků podle pravidla
- `/create-campaign <type> <code> <rule>` — Vytvoř SMS/email kampaň s kódem a pravidlem

## Příklady použití

```
vytvoř mi SMS s kódem HAPPY10 kde budou všichni příjemci kteří nenakoupili poslední 3 měsíce
vytvoř mi SMS s kódem NAVRAT kde budou všichni co nenakoupili rok a udělali více než 1 objednávku
vytvoř mi email s kódem VSEDNI kde budou všichni kteří nakupují ve všední dny mezi 11-15h
vytvoř mi email s kódem SUNKOVA kde budou ti kteří kupují nejčastěji šunkovou pizzu
vytvoř mi SMS s kódem FREENOKY pro lidi kteří někdy nakoupili noky
```
