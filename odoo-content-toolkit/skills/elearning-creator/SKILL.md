---
description: Create e-learning courses with lessons, quizzes, and videos in Odoo 18 via XML-RPC API (slide.channel + slide.slide). Supports AI images and deep research.
triggers:
  - "create course"
  - "elearning"
  - "e-learning"
  - "vytvoř kurz"
  - "lekce"
  - "návod"
  - "tutorial"
  - "slides"
  - "online kurz"
---

# E-Learning Creator — Kurzy a lekce pro Odoo 18

## Přehled

Tento skill vytváří kompletní e-learning kurzy v Odoo 18 přes XML-RPC API (`slide.channel` + `slide.slide`). Kurzy obsahují sekce, článkové lekce, video lekce a kvízy. Vše vytvořeno jako DRAFT — admin publikuje ručně.

## Konfigurace

Environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

Přečti VŽDY tyto reference před tvorbou:
1. `@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` — API pro slide.channel, slide.slide
2. `@${CLAUDE_PLUGIN_ROOT}/references/seo-guidelines.md` — SEO pravidla a struktura kurzu

## Workflow

### Krok 1: Analýza zadání

Zjisti od uživatele:
- **Téma kurzu** — o čem bude kurz
- **Cílová skupina** — pro koho je kurz
- **Typ** — training (kurz s certifikátem) nebo documentation (znalostní báze)
- **Rozsah** — krátký (3-5 lekcí), střední (8-12 lekcí), rozsáhlý (15+ lekcí)
- **Jazyk** — český nebo anglický (default: český)
- **Video** — mají být video lekce? (YouTube odkazy)
- **Kvízy** — přidat kvízy na konci sekcí?

### Krok 2: Research (deep-research)

Pro kvalitní obsah kurzu:
1. Použij deep-research skill pro průzkum tématu
2. Získej osnovu kurzu s obsahem lekcí
3. Ověř informace z více zdrojů

Nebo pokud uživatel poskytne vlastní obsah, přeskoč research.

### Krok 3: Vytvořit osnovu kurzu

Navrhni strukturu a předlož uživateli ke schválení:

```
Kurz: {Název kurzu}
Typ: training / documentation
Cílová skupina: {kdo}

Sekce 1: {Název sekce}
  ├── Lekce 1.1: {Název} (article, ~15 min)
  ├── Lekce 1.2: {Název} (article, ~20 min)
  └── Kvíz 1 (5 otázek)

Sekce 2: {Název sekce}
  ├── Lekce 2.1: {Název} (article, ~15 min)
  ├── Lekce 2.2: {Název} (video, ~10 min)
  └── Kvíz 2 (5 otázek)

Sekce 3: {Název sekce}
  ├── Lekce 3.1: {Název} (article, ~20 min)
  └── Lekce 3.2: {Název} (article, ~15 min)

Závěrečný kvíz (10 otázek)
```

### Krok 4: Napsat obsah lekcí

Pro každou článkovou lekci napíš HTML obsah:

```html
<section class="s_text_block">
<div class="container">
<div class="row">
<div class="col-lg-12">

<h2>Cíle lekce</h2>
<p>Po této lekci budete umět:</p>
<ul>
    <li>Cíl 1</li>
    <li>Cíl 2</li>
    <li>Cíl 3</li>
</ul>

<h2>Teorie</h2>
<p>Hlavní obsah lekce...</p>

<h3>Klíčový koncept 1</h3>
<p>Vysvětlení...</p>

<h3>Klíčový koncept 2</h3>
<p>Vysvětlení...</p>

<div class="alert alert-info">
    <strong>Tip:</strong> Praktický tip nebo poznámka...
</div>

<h2>Praktický příklad</h2>
<p>Ukázka aplikace...</p>

<div class="alert alert-warning">
    <strong>Pozor:</strong> Důležité upozornění...
</div>

<h2>Shrnutí</h2>
<p>Klíčové body lekce:</p>
<ol>
    <li>Bod 1</li>
    <li>Bod 2</li>
    <li>Bod 3</li>
</ol>

</div>
</div>
</div>
</section>
```

**Pravidla pro obsah lekcí:**
- Struktura: Cíle → Teorie → Příklady → Shrnutí
- Odstavce max 3-4 věty
- Alert boxy pro tipy (alert-info) a upozornění (alert-warning)
- Obrázky s alt textem
- Číslované seznamy pro kroky/postupy
- Odrážkové seznamy pro přehledy
- Minimálně 500 slov na lekci

### Krok 5: Vytvořit kvízy

Pro každý kvíz připrav otázky:

```python
quiz_questions = [
    {
        'question': 'Otázka 1?',
        'answers': [
            {'text': 'Správná odpověď', 'correct': True},
            {'text': 'Špatná odpověď A', 'correct': False},
            {'text': 'Špatná odpověď B', 'correct': False},
        ]
    },
    # ... další otázky
]
```

**Pravidla pro kvízy:**
- 3-5 otázek na sekční kvíz
- 8-10 otázek na závěrečný kvíz
- Vždy 1 správná + 2-3 špatné odpovědi
- Otázky testují porozumění, ne memorování
- Mix typů: faktické, aplikační, analytické

### Krok 6: Publikovat do Odoo

Napíš Python skript a spusť přes osascript:

```python
import xmlrpc.client, os

# --- Connection ---
ODOO_URL = os.environ.get('ODOO_URL', 'https://michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

UID = common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})
if not UID:
    for test_uid in [int(os.environ.get('ODOO_UID', 2)), 2]:
        try:
            models.execute_kw(ODOO_DB, test_uid, ODOO_API_KEY,
                              'res.partner', 'search_count', [[]])
            UID = test_uid
            break
        except Exception:
            continue
    if not UID:
        raise Exception("Authentication failed")

DB = ODOO_DB
KEY = ODOO_API_KEY

# --- 1. Vytvořit kurz ---
channel_id = models.execute_kw(DB, UID, KEY, 'slide.channel', 'create', [{
    'name': COURSE_NAME,
    'description': COURSE_DESCRIPTION_HTML,
    'description_short': COURSE_SHORT_DESC_HTML,
    'channel_type': 'training',  # nebo 'documentation'
    'enroll': 'public',
    'visibility': 'public',
    'website_meta_title': META_TITLE,
    'website_meta_description': META_DESCRIPTION,
    'website_meta_keywords': META_KEYWORDS,
    'is_published': False,  # VŽDY DRAFT!
}])
print(f"Kurz vytvořen: {COURSE_NAME} (ID: {channel_id})")

seq = 1

# --- 2. Vytvořit sekce a lekce ---
for section in SECTIONS:
    # Sekce (kategorie)
    section_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [{
        'name': section['name'],
        'channel_id': channel_id,
        'is_category': True,
        'slide_category': 'article',
        'source_type': 'local_file',
        'sequence': seq,
        'is_published': False,
    }])
    seq += 1
    print(f"  Sekce: {section['name']}")

    # Lekce v sekci
    for lesson in section['lessons']:
        slide_data = {
            'name': lesson['name'],
            'channel_id': channel_id,
            'slide_category': lesson.get('type', 'article'),
            'source_type': lesson.get('source_type', 'local_file'),
            'description': lesson.get('description', ''),
            'completion_time': lesson.get('duration', 0.25),
            'sequence': seq,
            'is_published': False,
            'website_meta_title': lesson['name'],
        }

        if lesson.get('type') == 'article':
            slide_data['html_content'] = lesson['html_content']
        elif lesson.get('type') == 'video':
            slide_data['source_type'] = 'external'
            slide_data['url'] = lesson['video_url']
        elif lesson.get('type') == 'quiz':
            slide_data['question_ids'] = [
                (0, 0, {
                    'question': q['question'],
                    'answer_ids': [
                        (0, 0, {
                            'text_value': a['text'],
                            'is_correct': a['correct'],
                            'sequence': i + 1,
                        }) for i, a in enumerate(q['answers'])
                    ]
                }) for q in lesson['questions']
            ]

        slide_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [slide_data])
        seq += 1
        print(f"    Lekce: {lesson['name']} (ID: {slide_id})")

# --- 3. Výstup ---
channel_info = models.execute_kw(DB, UID, KEY, 'slide.channel', 'read', [[channel_id]], {
    'fields': ['name', 'total_slides', 'website_url']
})
print(f"\n=== Kurz vytvořen ===")
print(f"Název: {channel_info[0]['name']}")
print(f"Počet lekcí: {channel_info[0]['total_slides']}")
print(f"Admin: {ODOO_URL}/web#id={channel_id}&model=slide.channel&view_type=form")
```

### Krok 7: Výstup

Vrať uživateli:
1. **Přehled kurzu** — název, typ, počet sekcí a lekcí
2. **Osnova** — kompletní struktura (sekce → lekce → kvízy)
3. **SEO metadata** — meta title, description, keywords
4. **Odoo admin link** — pro review a publikaci
5. **Stav: DRAFT** — připomínka že admin musí publikovat
6. **Celková doba** — součet completion_time všech lekcí

## Důležitá pravidla

1. **NIKDY nepublikuj automaticky** — vždy `is_published: False`
2. **VŽDY vyplň SEO** — meta_title, meta_description, meta_keywords
3. **Strukturovaný obsah** — sekce → lekce → kvízy
4. **Realistické časy** — completion_time odpovídá délce obsahu
5. **HTML musí být validní** — žádné neuzavřené tagy
6. **Sequence je důležitý** — zajišťuje správné pořadí
7. **Kvízy testují porozumění** — ne memorování
8. **Minimum 500 slov na lekci** — kvalitní vzdělávací obsah

## Spuštění skriptu

Kvůli ENOSPC na VM použij `mcp__Control_your_Mac__osascript`:

```
do shell script "cd /Users/michalvarys/projekty/sidonio && export $(grep -v '^#' .env | xargs) && python3 /Users/michalvarys/projekty/sidonio/script_name.py"
```

Nebo zapiš skript do souboru a spusť:
1. Write tool → `/sessions/brave-focused-clarke/mnt/sidonio/script_name.py`
2. osascript → spusť skript z Mac cesty `/Users/michalvarys/projekty/sidonio/script_name.py`
