# Prodejní psychologie pro SMS a Email kampaně

## Principy maximalizace konverze

### 1. FOMO (Fear of Missing Out) — Strach z promeškání
- Časově omezené nabídky: "Pouze do nedele", "Posledni 3 dny"
- Omezené množství: "Jen pro prvnich 50 zakazniku"
- Exkluzivita: "Jen pro verne zakazniky"

### 2. Personalizace a rozpoznání
- Oslovení jménem (pokud dostupné)
- Reference na předchozí nákup: "Naposledy jste u nas nakoupili..."
- Produktová relevance: "Pro milovníky [produkt]"

### 3. Reciprocita
- Dárek zdarma: "Máme pro vás dárek..."
- Bonus navíc: "K objednávce zdarma..."
- Slevu bez podmínky: "Jako poděkování za vaši věrnost"

### 4. Sociální důkaz
- "Naši zákazníci se k nám vracejí"
- "Nejoblíbenější volba"
- Čísla: "Již 2000+ spokojených zákazníků"

### 5. Urgence + jasná výhoda
- Konkrétní sleva: "-10% s kódem ABC"
- Jasná hodnota: "Ušetřete 150 Kč"
- Časový rámec: "Platí do pátku"

---

## SMS — Pravidla a vzory

### Formální pravidla
- MAX 160 znaků = 1 SMS, MAX 306 znaků = 2 SMS (ideálně vejít se do 2 SMS)
- BEZ diakritiky (čeština bez háčků a čárek)
- Krátká URL (nebo Odoo trackovaný link)
- Jasný CTA (call-to-action)
- Identifikace odesílatele

### SMS vzory podle segmentu

#### Zákazník co nenakoupil 3 měsíce (win-back)
```
Ahoj! Chybite nam :-) Jako omluvu mame pro vas slevu -10% s kodem HAPPY10 na cely sortiment. Platí do nedele! {link}
```

#### Zákazník co nenakoupil rok (reactivation)
```
Uz je to davno co jste u nas byli! Mame novou nabidku a pro vas slevovy kod NAVRAT na -15%. Zkuste nas znovu: {link}
```

#### Zákazník nakupující v konkrétní čas (behavioral)
```
Poledni pauza? Idealni cas na objednavku! Dnes s kodem VSEDNI dostanete neco navic. Objednejte ted: {link}
```

#### Zákazník kupující konkrétní produkt
```
Vite co je dneska skvele? Vase oblibena sunkova pizza a k ni ZDARMA noky s kodem SUNKOVA. Jen dnes! {link}
```

#### Zákazník co někdy koupil specifický produkt (cross-sell)
```
Noky vam chutnaly? Mame pro vas kod FREENOKY — noky ZDARMA k jakekoli objednavce nad 200 Kc! {link}
```

### SMS — Klíčové metriky
- Ideální délka: 140-160 znaků (1 SMS) nebo do 306 znaků (2 SMS)
- Míra otevření SMS: 95%+ (téměř vždy přečteno)
- Klíčové je CTR (click-through rate) — optimalizujeme text pro kliknutí na odkaz
- Odesílej v čas kdy zákazník obvykle nakupuje (z analýzy dat)

---

## Email — Pravidla a vzory

### Struktura pro max míru otevření
1. **Předmět (Subject)** — max 50 znaků, osobní, zvědavost/urgence
2. **Náhledový text (Preview)** — rozšíření předmětu, 40-90 znaků
3. **Hook** — první věta v emailu, navazuje na předmět

### Předměty podle segmentu

#### Win-back (3 měsíce)
- Předmět: "Máme pro vás překvapení"
- Preview: "Sleva -10% jen pro vás. Platí do neděle."

#### Reactivation (1 rok)
- Předmět: "Dlouho jsme se neviděli..."
- Preview: "Speciální nabídka pro naše věrné zákazníky."

#### Behavioral (čas nákupu)
- Předmět: "Polední nabídka jen pro vás"
- Preview: "Objednejte teď a získejte bonus navíc."

#### Product-based
- Předmět: "Pro milovníky šunkové pizzy"
- Preview: "K vaší oblíbené pizze máme dárek zdarma."

#### Cross-sell
- Předmět: "Noky zdarma k objednávce"
- Preview: "Speciální kód jen pro vás. Platí tento týden."

### Email Design principy
- Hero sekce s jasným CTA tlačítkem
- Jedna hlavní nabídka (ne více)
- Vizuální hierarchie: nadpis → nabídka → CTA → podmínky
- CTA button: kontrastní barva, velký, jasný text ("Objednat nyní", "Využít slevu")
- Footer: odhlášení + otevřít v prohlížeči
- Inline CSS (email klienti stripují <style>)
- Tabulkový layout (max 600px)
- Absolutní URL pro obrázky

### Email — Klíčové metriky
- Míra otevření: optimalizujeme předmět + preview
- CTR: optimalizujeme CTA a obsah
- Konverze: optimalizujeme nabídku a urgenci

---

## Pravidla pro tvorbu kampaně

1. VŽDY vytvořit jako DRAFT — nikdy neodesílat automaticky
2. SMS BEZ diakritiky
3. Email s QWeb HTML templatem (inline CSS, table layout)
4. Vždy zahrnout slevový kód přímo v textu
5. Vždy zahrnout odkaz (trackovaný přes Odoo)
6. Vždy respektovat blacklist
7. Admin zkontroluje a odešle ručně
