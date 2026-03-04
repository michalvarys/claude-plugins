# SEO Pravidla pro Blog Články a E-Learning

## Blog Článek — SEO Struktura

### 1. Titulek (name)
- Max 60 znaků (aby se zobrazil celý ve vyhledávání)
- Obsahuje hlavní klíčové slovo co nejblíže začátku
- Poutavý, konkrétní, akční
- Vzory: "Jak...", "X tipů na...", "Kompletní průvodce...", "Proč..."

### 2. Meta Title (website_meta_title)
- Max 60 znaků
- Formát: `{Hlavní klíčové slovo} — {Doplnění} | {Brand}`
- Příklad: `Jak vybrat pizzu — Kompletní průvodce | Sidonio`

### 3. Meta Description (website_meta_description)
- Max 155 znaků (ideálně 120-155)
- Obsahuje hlavní klíčové slovo
- Jasný benefit pro čtenáře
- CTA na konci (zjistěte více, přečtěte si...)
- Příklad: `Nevíte jakou pizzu si vybrat? Náš průvodce vám pomůže najít ideální pizzu podle chuti, ingrediencí i příležitosti. Přečtěte si více.`

### 4. Meta Keywords (website_meta_keywords)
- Čárkou oddělená klíčová slova (5-10)
- Hlavní keyword + varianty + long-tail
- Příklad: `pizza, jak vybrat pizzu, nejlepší pizza, druhy pizzy, italská pizza`

### 5. SEO Name / Slug (seo_name)
- Lowercase, pomlčky místo mezer
- Bez diakritiky
- Krátký a výstižný
- Příklad: `jak-vybrat-pizzu`

### 6. Teaser (teaser_manual)
- 1-3 věty shrnující článek
- Obsahuje klíčové slovo
- Zobrazuje se v přehledu blogu

### 7. Content (html) — Struktura

```html
<!-- VŽDY použít sémantické HTML -->
<h2>Hlavní nadpis sekce (H2)</h2>
<p>Úvodní odstavec s klíčovým slovem v prvních 100 slovech.</p>

<h3>Podnadpis (H3)</h3>
<p>Detailní obsah...</p>

<h3>Další podnadpis</h3>
<ul>
    <li>Bodový seznam pro přehlednost</li>
    <li>Zvyšuje čitelnost</li>
</ul>

<blockquote>
    <p>Citát nebo zvýrazněný text</p>
</blockquote>

<!-- Obrázek s alt textem (SEO!) -->
<img src="/web/image/..." alt="Popis obrázku s klíčovým slovem"/>

<h2>Závěr</h2>
<p>Shrnutí a CTA (call-to-action).</p>
```

### Pravidla pro HTML obsah
- **H1 NIKDY** — používá se automaticky z titulku článku
- **H2** pro hlavní sekce
- **H3** pro podsekce
- Odstavce max 3-4 věty
- Klíčové slovo v prvních 100 slovech
- Interní odkazy na další články
- Alt text u všech obrázků
- Minimálně 800 slov pro SEO (ideálně 1500+)

---

## Blog Článek — Typické formáty

### How-to / Návod
```
Titulek: Jak [dosáhnout cíle] — Kompletní průvodce [rok]
Struktura: Úvod → Krok 1-N → Tipy → Závěr + CTA
```

### Listicle (seznam)
```
Titulek: [N] [nejlepších/tipů] na [téma] v [rok]
Struktura: Úvod → Bod 1-N (H2 pro každý) → Shrnutí
```

### Informační článek
```
Titulek: [Téma]: Vše co potřebujete vědět
Struktura: Úvod → Co je to → Jak to funguje → Výhody → FAQ → Závěr
```

### Srovnávací článek
```
Titulek: [A] vs [B]: Co je lepší pro [účel]?
Struktura: Úvod → A → B → Srovnávací tabulka → Verdict → CTA
```

---

## E-Learning Kurz — SEO a Struktura

### Kurz (slide.channel)
- **name**: Jasný, popisný název kurzu
- **description_short**: 1-2 věty, hook pro studenty
- **description**: Detailní popis s klíčovými slovy, co se naučí
- **website_meta_title**: `{Název kurzu} | E-Learning | {Brand}`
- **website_meta_description**: Co se student naučí, pro koho je kurz

### Lekce (slide.slide)
- **name**: Číslo + jasný název (`Lekce 1: Základy...`)
- **description**: Krátký popis obsahu lekce
- **html_content**: Strukturovaný HTML (H2, H3, seznamy, obrázky)
- **completion_time**: Realistický odhad v hodinách (0.25 = 15 min)

### Typická struktura kurzu

```
Sekce 1: Úvod (is_category=True)
  ├── Lekce 1.1: O čem je tento kurz (article)
  └── Lekce 1.2: Pro koho je kurz určen (article)

Sekce 2: Základy (is_category=True)
  ├── Lekce 2.1: Teorie (article)
  ├── Lekce 2.2: Praktická ukázka (video)
  └── Kvíz 2: Ověřte si znalosti (quiz)

Sekce 3: Pokročilé téma (is_category=True)
  ├── Lekce 3.1: Hlubší znalosti (article)
  └── Lekce 3.2: Případová studie (article)

Závěrečný kvíz (quiz)
```

---

## Pravidla pro tvorbu obsahu

1. VŽDY vytvořit jako DRAFT (`is_published: False`) — admin publikuje ručně
2. VŽDY vyplnit SEO fieldy (meta_title, meta_description, meta_keywords, seo_name)
3. HTML obsah musí být sémantický a validní
4. Obrázky vždy s alt textem
5. Minimálně 800 slov na blog článek
6. Kurzy: jasná struktura sekce → lekce → kvíz
7. Každá lekce má realistický completion_time
8. Použít interní linky kde to dává smysl
