# Odoo Content Toolkit

Odoo 18 content creation plugin pro SEO blog články, hloubkový research a e-learning kurzy přes XML-RPC API.

## Koncept

Plugin vytváří obsah pro Odoo website — blog články optimalizované pro SEO, kurzy s lekcemi a kvízy, a podpůrný deep research z více zdrojů. Vše se vytváří jako DRAFT — admin publikuje ručně.

## Setup

### Environment Variables (required)

- `ODOO_URL`: Odoo instance URL (default: `https://michalvarys.eu`)
- `ODOO_DB`: Database name (default: `varyshop`)
- `ODOO_API_KEY`: API key from Odoo user profile

UID is automatically determined via `common.authenticate()`.

### Požadované Odoo moduly

- `website_blog` — pro blog.blog, blog.post, blog.tag
- `website_slides` — pro slide.channel, slide.slide

### Závislosti

Pracuje společně s **odoo-crm-toolkit** a **odoo-mass-mailing-toolkit** — sdílí XML-RPC referenci.

## Skills

### blog-writer
SEO-optimalizované blog články — research, psaní, metadata, publikace do Odoo.
- Formáty: how-to, listicle, informační, srovnávací
- Automatické SEO: meta title, description, keywords, slug
- HTML obsah se sémantickou strukturou
- Tagy: automatická tvorba a přiřazení

### deep-research
Hloubkový průzkum jakéhokoli tématu z více zdrojů.
- Multi-source web research (5+ zdrojů)
- Strukturovaný výstup: report, blog brief, osnova kurzu
- Citace a ověření z více zdrojů
- Může být podkladem pro blog-writer nebo elearning-creator

### elearning-creator
Kompletní e-learning kurzy s lekcemi, kvízy a videi.
- Typy kurzů: training (certifikát), documentation (znalostní báze)
- Strukturované sekce → lekce → kvízy
- Článkové lekce (HTML), video lekce (YouTube), kvízy s odpověďmi
- SEO metadata pro kurz i jednotlivé lekce

## Commands

- `/write-blog <topic>` — Napíše SEO blog článek a publikuje do Odoo
- `/deep-research <topic>` — Hloubkový research s strukturovaným výstupem
- `/create-course <topic>` — Vytvoří e-learning kurz s lekcemi a kvízy

## Příklady použití

```
napiš mi blog článek o trendech v gastro 2025
vytvoř SEO článek o tom jak vybrat správnou pizzu
udělej deep research na téma food safety v restauracích
vytvoř e-learning kurz o hygieně v gastro provozu
napiš how-to článek o přípravě pizzového těsta
vytvoř dokumentaci o našich produktech jako kurz
```

## Odoo modely

| Model | Popis |
|-------|-------|
| blog.blog | Blog (kontejner pro články) |
| blog.post | Blog článek |
| blog.tag | Blog tag |
| slide.channel | E-learning kurz |
| slide.slide | Lekce / obsah kurzu |
| slide.channel.tag | Tag pro kurzy |
