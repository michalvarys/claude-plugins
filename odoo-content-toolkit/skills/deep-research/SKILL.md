---
description: Deep research on any topic using web search, synthesis, and structured output. Can feed into blog-writer or elearning-creator skills.
triggers:
  - "deep research"
  - "research topic"
  - "průzkum tématu"
  - "hloubkový research"
  - "zjisti vše o"
  - "rešerše"
---

# Deep Research — Hloubkový průzkum tématu

## Přehled

Tento skill provádí hloubkový research na jakékoli téma pomocí web search, syntézy z více zdrojů, a strukturovaného výstupu. Výsledek může sloužit jako podklad pro blog článek (blog-writer) nebo e-learning kurz (elearning-creator).

## Konfigurace

Tento skill **nepotřebuje Odoo API** — pracuje čistě s web search a syntézou informací. Výstup je strukturovaný dokument, který může být:
- Samostatný výstup (Markdown/HTML soubor)
- Podklad pro blog-writer (automatické předání)
- Podklad pro elearning-creator (automatické předání)

## Workflow

### Krok 1: Definice výzkumné otázky

Zjisti od uživatele:
- **Téma / otázka** — co přesně zkoumat
- **Hloubka** — přehledový (5 min), standardní (15 min), hloubkový (30+ min)
- **Účel** — samostatný výstup, podklad pro blog, podklad pro kurz
- **Jazyk** — český nebo anglický (default: český)
- **Formát výstupu** — markdown report, blog draft, kurz osnova

### Krok 2: Multi-source Research

Proveď systematický průzkum:

#### 2a. Primární průzkum (3-5 queries)
```
Query strategie:
1. Hlavní téma: "[téma] overview 2025"
2. Specifika: "[téma] best practices"
3. Data/statistiky: "[téma] statistics data 2025"
4. Trendy: "[téma] trends future"
5. Problémy: "[téma] challenges problems"
```

Použij `WebSearch` pro každý query. Pro každý výsledek:
- Zaznamenej zdroj (URL, název)
- Extrahuj klíčové informace
- Ověř důvěryhodnost zdroje

#### 2b. Hloubkový průzkum (pro důležité zdroje)
Použij `WebFetch` na 3-5 nejrelevantnějších zdrojů:
- Extrahuj detailní informace
- Zaznamenej citace a data
- Identifikuj protichůdné názory

#### 2c. Syntéza
- Seřaď informace podle relevance
- Identifikuj shody a rozpory mezi zdroji
- Vytvoř strukturovaný přehled

### Krok 3: Strukturovaný výstup

Formát výstupu závisí na účelu:

#### A) Samostatný Research Report (Markdown)

```markdown
# Research Report: {Téma}

**Datum:** {datum}
**Hloubka:** {přehledový/standardní/hloubkový}
**Počet zdrojů:** {N}

## Executive Summary
{2-3 odstavce — klíčové zjištění}

## 1. Kontext a pozadí
{Co je téma, proč je důležité}

## 2. Klíčová zjištění

### 2.1 {Oblast 1}
{Detaily, data, citace}

### 2.2 {Oblast 2}
{Detaily, data, citace}

### 2.3 {Oblast 3}
{Detaily, data, citace}

## 3. Data a statistiky
{Konkrétní čísla, trendy, grafy}

## 4. Výzvy a problémy
{Identifikované problémy, rizika}

## 5. Trendy a budoucnost
{Kam se téma vyvíjí}

## 6. Závěry a doporučení
{Shrnutí, actionable insights}

## Zdroje
1. [{Název}]({URL}) — {krátký popis}
2. [{Název}]({URL}) — {krátký popis}
...
```

#### B) Podklad pro Blog (strukturovaný brief)

```markdown
# Blog Brief: {Téma}

## SEO analýza
- Hlavní keyword: {keyword}
- Sekundární keywords: {kw1, kw2, kw3}
- Search intent: {informační/transakční/navigační}

## Navrhovaná struktura článku
1. {Úvod — hook}
2. {Hlavní sekce 1}
3. {Hlavní sekce 2}
4. ...
N. {Závěr + CTA}

## Klíčová fakta k použití
- {Fakt 1 + zdroj}
- {Fakt 2 + zdroj}
- ...

## Zajímavé citáty / statistiky
- "{Citát}" — {Zdroj}
- {Statistika} — {Zdroj}

## Competitive content analýza
- {Konkurenční článek 1}: {co dělají dobře / špatně}
- {Konkurenční článek 2}: {co dělají dobře / špatně}

## Doporučení pro autora
- {Tip 1}
- {Tip 2}
```

#### C) Podklad pro E-Learning (osnova kurzu)

```markdown
# Osnova kurzu: {Téma}

## Cílová skupina
{Pro koho je kurz}

## Cíle kurzu
Po absolvování student bude umět:
1. {Cíl 1}
2. {Cíl 2}
3. {Cíl 3}

## Navrhovaná struktura

### Sekce 1: {Název}
- Lekce 1.1: {Téma} (article, ~X min)
  - Klíčové body: {bod1, bod2, bod3}
- Lekce 1.2: {Téma} (article, ~X min)
  - Klíčové body: {bod1, bod2, bod3}
- Kvíz 1: {popis} (3-5 otázek)

### Sekce 2: {Název}
...

## Zdroje a reference
1. [{Název}]({URL})
2. ...
```

### Krok 4: Uložení a předání

1. **Samostatný report:** Ulož jako `.md` soubor do workspace
2. **Pro blog:** Předej výstup blog-writer skillu (nebo ulož brief)
3. **Pro kurz:** Předej výstup elearning-creator skillu (nebo ulož osnovu)

## Pravidla

1. **VŽDY cituj zdroje** — žádné informace bez reference
2. **Ověřuj fakta** — hledej potvrzení z více zdrojů
3. **Aktuální data** — preferuj zdroje z posledního roku
4. **Objektivita** — prezentuj různé pohledy
5. **Struktura** — vždy strukturovaný výstup, nikdy raw dump
6. **Copyright** — nikdy nekopíruj celé odstavce ze zdrojů, vždy přeformuluj
7. **Jazyk** — piš v jazyce, který uživatel preferuje

## Kombinace s dalšími skilly

### deep-research → blog-writer
```
Uživatel: "Napiš mi článek o trendech v gastro 2025"
1. deep-research: průzkum trendů (standardní hloubka)
2. Výstup: blog brief s SEO analýzou + fakta
3. blog-writer: napíše SEO článek na základě briefu
4. Publikace do Odoo jako draft
```

### deep-research → elearning-creator
```
Uživatel: "Vytvoř kurz o food safety"
1. deep-research: průzkum tématu (hloubkový)
2. Výstup: osnova kurzu s obsahem lekcí
3. elearning-creator: vytvoří kurz + lekce v Odoo
4. Publikace do Odoo jako draft
```
