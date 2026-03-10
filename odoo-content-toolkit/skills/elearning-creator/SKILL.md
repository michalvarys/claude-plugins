---
description: Create e-learning courses with lessons, quizzes, and videos in Odoo 18 via XML-RPC API (slide.channel + slide.slide). Supports AI images and deep research.
triggers:
  - create course
  - elearning
  - e-learning
  - vytvor kurz
  - lekce
  - tutorial
  - slides
  - online kurz
  - update course
  - aktualizuj kurz
---

# E-Learning Creator — Kurzy a lekce pro Odoo 18

## Prehled

Tento skill vytvari kompletni e-learning kurzy v Odoo 18 pres XML-RPC API (slide.channel + slide.slide). Kurzy obsahuji sekce, clankove lekce, video lekce a kvizy. Vse jako DRAFT — admin publikuje rucne.

## Konfigurace

Environment variables: ODOO_URL, ODOO_DB, ODOO_API_KEY (UID se zjisti automaticky)

Precti VZDY tyto reference pred tvorbou:
1. references/xmlrpc-api.md — API pro slide.channel, slide.slide
2. references/seo-guidelines.md — SEO pravidla a struktura kurzu

## KRITICKE LEKCE Z PRAXE

### 1. URL musi obsahovat www
SPATNE: https://michalvarys.eu (301 redirect)
SPRAVNE: https://www.michalvarys.eu

### 2. Autentizace VYZADUJE login (email)
SPATNE: common.authenticate(DB, '', API_KEY, {})  -- vraci False!
SPRAVNE: common.authenticate(DB, 'info@varyshop.eu', API_KEY, {})
Vzdy pouzij ODOO_LOGIN env promennou.

### 3. VM disk plny (ENOSPC)
Vsechny zapisy pres osascript na Mac filesystem.
Pracovni adresar: /Users/michalvarys/projekty/startbusiness/

### 4. osascript limit delky (~2000 znaku)
Reseni: Rozdelit na vice volani nebo heredoc (cat > file << ENDSCRIPT).

### 5. JSON Data File pristup (DOPORUCENY)
Oddel obsah od exekuce:
- JSON soubory pro obsah (quiz_data.json, course_data.json)
- Python executor skript zvlast
- Executor nacte JSON a vola API

### 6. Psani skriptu pres osascript
FUNGUJE: heredoc (cat > script.py << ENDSCRIPT ... ENDSCRIPT)
NEFUNGUJE: triple double quotes uvnitr do shell script
NEFUNGUJE: *args/**kwargs pro context parameter

### 7. Ceske preklady textovych poli (name, description, meta)
Context jako kwargs dict, NE keyword argument.
```python
# SPRAVNE
def call_cs(model, method, args, kw=None):
    if kw is None: kw = {}
    kw['context'] = {'lang': 'cs_CZ'}
    return models.execute_kw(DB, UID, KEY, model, method, args, kw)

# Zapis EN jako zaklad (bez kontextu nebo s en_US)
call('slide.slide', 'write', [[sid], {'name': 'English Title'}])
# Zapis CS jako preklad
call_cs('slide.slide', 'write', [[sid], {'name': 'Český název'}])
```

### 8. KRITICKE: html_content preklady (xml_translate)
Pole `html_content` pouziva `xml_translate` — preklady funguji na urovni
TEXTOVYCH UZLU, ne celych poli!

**SPATNE** (nepouzivat — CS prepise EN zaklad!):
```python
call_en('slide.slide', 'write', [[sid], {'html_content': en_html}])
call_cs('slide.slide', 'write', [[sid], {'html_content': cs_html}])
# Vysledek: OBE jazyky ukazuji cs_html
```

**SPRAVNE** (pouzivat vzdy):
```python
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self._skip = {'script', 'style', 'code', 'pre'}
        self._in_skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in self._skip: self._in_skip += 1
    def handle_endtag(self, tag):
        if tag in self._skip and self._in_skip > 0: self._in_skip -= 1
    def handle_data(self, data):
        t = data.strip()
        if t and self._in_skip == 0: self.texts.append(t)

def extract_texts(html):
    p = TextExtractor()
    p.feed(html)
    return p.texts

# 1. Zapis EN HTML jako zaklad
call_en('slide.slide', 'write', [[slide_id], {'html_content': en_html}])

# 2. Extrahuj textove uzly a vytvor mapovani
en_texts = extract_texts(en_html)
cs_texts = extract_texts(cs_html)
mapping = {}
for i in range(min(len(en_texts), len(cs_texts))):
    if en_texts[i] != cs_texts[i]:
        mapping[en_texts[i]] = cs_texts[i]

# 3. Aplikuj CS preklady
call_en('slide.slide', 'update_field_translations',
    [[slide_id], 'html_content', {'cs_CZ': mapping}])
```

**Proc:** Odoo 18 uklada html_content jako JSONB s per-term preklady.
Primy write s jinym jazykem PREPISE cely zaklad misto pridani prekladu.
Metoda `update_field_translations` spravne nastavi preklady textovych uzlu.

### 9. Domain wrapping pro search
Spravne: call(model, search, [[[field, =, val]]])  -- triple list
Spatne: call(model, search, [[field, =, val]])  -- double list

### 10. Spravny call pattern
def call(model, method, args, kw=None) s explicitnimi parametry.
NE *args/**kwargs -- zpusobi TypeError s context.

### 11. HTML wrapper pro clanky
section.s_text_block > div.container > div.row > div.col-lg-12 > OBSAH

### 12. Quiz management
Smazat stare: call(slide.question, unlink, [id_list]) -- kaskada smaze odpovedi
Vytvorit: call(slide.question, create) + call(slide.answer, create) zvlast
CS preklady: call_cs(slide.question, write, ...) s context dict
**KAZDA otazka MUSI mit alespon 1 spravnou a 1 nespravnou odpoved (is_correct)!**

### 13. osascript timeout
with timeout of 600 seconds ... end timeout wrapper pro dlouhe skripty

### 14. JSON po castech
Velke kurzy (15+ lekci) rozdeluj do vice JSON souboru:
- course_p1.json (channel + sekce 1-2)
- course_p2.json (sekce 3-4)
- atd.
DULEZITE: channel_id z prvniho behu vloz do dalsich JSON souboru!

### 15. Ceska diakritika je POVINNA
Ceske texty MUSI mit spravnou diakritiku: háčky (č,ď,ě,ň,ř,š,ť,ž),
čárky (á,é,í,ó,ú,ý), kroužek (ů). Text bez diakritiky je NEAKCEPTOVATELNY.

### 16. Screenshoty a obrazky
Upload pres ir.attachment, pouzij URL /web/image/{att_id} v HTML.
Detaily viz references/xmlrpc-api.md sekce "Screenshoty a obrazky".

### 17. Overeni prekladu
```python
# Kontrola zda preklady funguji pro html_content
trans = call_en('slide.slide', 'get_field_translations', [[sid], 'html_content'])
# Vraci: [[{lang, source, value}, ...], {translation_type}]
```

### 18. Cover image kurzu (KRITICKE)
Thumbnail na hlavni strance /slides se bere ze `slide.channel.image_1920`, NE
z jednotlivych slide.slide! Kazdy kurz MUSI mit unikatni cover image.
Generuj pres Gemini Flash (`gemini-2.5-flash-image`) — viz skill lesson-thumbnail.
```python
# SPRAVNE: cover na channel
call_en('slide.channel', 'write', [[channel_id], {'image_1920': image_b64}])
# NENI VIDET na /slides: thumbnail na slide
call_en('slide.slide', 'write', [[slide_id], {'image_1920': image_b64}])
```
Model `gemini-2.0-flash-exp-image-generation` uz NEFUNGUJE (404).
Pouzij `gemini-2.5-flash-image` z balicku `google-genai` (NE google-generativeai).

### 19. Visual HTML Design System (POVINNE)

Lekce NESMI byt vizualne chude (holé h2/h3/p/ul). VZDY pouzij vizualne
bohatý design s inline CSS styly. Kazda lekce ma vypadat jako profesionalni
landing page.

**Vizualni komponenty (Python helpery pro generovani HTML):**

```python
def hero(title, subtitle, grad="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"):
    """Gradient hero banner — meni barvu podle sekce."""
    return (f'<div style="background:{grad};color:#fff;padding:48px 32px;'
            f'border-radius:16px;margin-bottom:32px;text-align:center;">'
            f'<h2 style="color:#fff;margin:0 0 8px 0;font-size:30px;font-weight:700;">{title}</h2>'
            f'<p style="color:rgba(255,255,255,0.9);margin:0;font-size:17px;">{subtitle}</p></div>')

def stats_row(items):
    """items = [(number, label, color), ...] — velka cisla v barevnych kartach."""
    cards = ''.join(
        f'<div style="flex:1;min-width:140px;background:{c};border-radius:12px;'
        f'padding:22px 16px;color:#fff;text-align:center;margin:6px;">'
        f'<div style="font-size:36px;font-weight:800;line-height:1.1;">{n}</div>'
        f'<div style="font-size:13px;opacity:0.85;margin-top:6px;">{l}</div></div>'
        for n, l, c in items)
    return f'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;">{cards}</div>'

def para(text):
    return f'<p style="font-size:16px;line-height:1.75;color:#333;margin-bottom:20px;">{text}</p>'

def heading(text, color="#1a237e"):
    return (f'<h2 style="color:{color};font-size:23px;margin:36px 0 16px 0;'
            f'padding-bottom:8px;border-bottom:3px solid #667eea;">{text}</h2>')

def subheading(text, color="#283593"):
    return f'<h3 style="color:{color};font-size:18px;margin:24px 0 12px 0;">{text}</h3>'

def cards_grid(items):
    """items = [(title, text, color), ...] — grid s barevnym hornim okrajem."""
    colors = ["#1565c0", "#7b1fa2", "#00897b", "#ef6c00", "#c62828", "#2e7d32"]
    cards = ''
    for i, item in enumerate(items):
        t, txt = item[0], item[1]
        c = item[2] if len(item) > 2 else colors[i % len(colors)]
        cards += (f'<div style="background:#fff;border:1px solid #e8e8e8;border-top:4px solid {c};'
                  f'border-radius:0 0 12px 12px;padding:24px;margin-bottom:12px;'
                  f'box-shadow:0 2px 8px rgba(0,0,0,0.04);">'
                  f'<h3 style="color:{c};margin:0 0 8px 0;font-size:17px;">{t}</h3>'
                  f'<p style="margin:0;color:#555;font-size:15px;line-height:1.6;">{txt}</p></div>')
    return f'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:28px;">{cards}</div>'

def cards_list(items):
    """items = [(title, text, color), ...] — vertikalni karty s levym okrajem."""
    colors = ["#1565c0", "#7b1fa2", "#00897b", "#ef6c00"]
    cards = ''
    for i, item in enumerate(items):
        t, txt = item[0], item[1]
        c = item[2] if len(item) > 2 else colors[i % len(colors)]
        cards += (f'<div style="background:#fff;border:1px solid #e8e8e8;border-left:4px solid {c};'
                  f'border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:12px;'
                  f'box-shadow:0 2px 6px rgba(0,0,0,0.04);">'
                  f'<h3 style="color:{c};margin:0 0 8px 0;font-size:17px;">{t}</h3>'
                  f'<p style="margin:0;color:#555;font-size:15px;line-height:1.6;">{txt}</p></div>')
    return cards

def tip(title, text):
    """Zeleny tip box."""
    return (f'<div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px 20px;'
            f'border-radius:0 8px 8px 0;margin:24px 0;">'
            f'<p style="margin:0 0 6px 0;font-weight:700;color:#1b5e20;">{title}</p>'
            f'<p style="margin:0;color:#2e7d32;font-size:15px;line-height:1.6;">{text}</p></div>')

def warn(title, text):
    """Oranzovy warning box."""
    return (f'<div style="background:#fff3e0;border-left:4px solid #ff9800;padding:16px 20px;'
            f'border-radius:0 8px 8px 0;margin:24px 0;">'
            f'<p style="margin:0 0 6px 0;font-weight:700;color:#e65100;">{title}</p>'
            f'<p style="margin:0;color:#bf360c;font-size:15px;line-height:1.6;">{text}</p></div>')

def err(title, text):
    """Cerveny error/mistake box."""
    return (f'<div style="background:#ffebee;border-left:4px solid #f44336;padding:16px 20px;'
            f'border-radius:0 8px 8px 0;margin:24px 0;">'
            f'<p style="margin:0 0 6px 0;font-weight:700;color:#b71c1c;">{title}</p>'
            f'<p style="margin:0;color:#c62828;font-size:15px;line-height:1.6;">{text}</p></div>')

def info(title, text):
    """Modry info box."""
    return (f'<div style="background:#e3f2fd;border-left:4px solid #1565c0;padding:16px 20px;'
            f'border-radius:0 8px 8px 0;margin:24px 0;">'
            f'<p style="margin:0 0 6px 0;font-weight:700;color:#0d47a1;">{title}</p>'
            f'<p style="margin:0;color:#1565c0;font-size:15px;line-height:1.6;">{text}</p></div>')

def table(headers, rows):
    """Stylizovana tabulka s gradient hlavickou."""
    hdr = ''.join(f'<th style="padding:14px 18px;color:#fff;text-align:center;'
                  f'font-size:14px;font-weight:600;">{h}</th>' for h in headers)
    body = ''
    for i, row in enumerate(rows):
        bg = '#f8f9fa' if i % 2 == 0 else '#fff'
        cells = ''.join(f'<td style="padding:12px 18px;text-align:center;font-size:14px;">{c}</td>' for c in row)
        body += f'<tr style="background:{bg};">{cells}</tr>'
    return (f'<div style="overflow-x:auto;margin-bottom:28px;border-radius:12px;'
            f'box-shadow:0 2px 8px rgba(0,0,0,0.06);">'
            f'<table style="width:100%;border-collapse:collapse;"><thead>'
            f'<tr style="background:linear-gradient(135deg,#1a237e,#283593);">{hdr}</tr>'
            f'</thead><tbody>{body}</tbody></table></div>')

def steps(items):
    """items = [(title, text), ...] — cislovane kroky s gradient kruznicemi."""
    out = ''
    for i, (t, txt) in enumerate(items, 1):
        out += (f'<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start;">'
                f'<div style="min-width:40px;height:40px;background:linear-gradient(135deg,#667eea,#764ba2);'
                f'color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;'
                f'font-weight:700;font-size:16px;">{i}</div>'
                f'<div style="flex:1;padding-top:4px;"><h3 style="margin:0 0 4px 0;color:#1a237e;'
                f'font-size:16px;">{t}</h3>'
                f'<p style="margin:0;color:#555;font-size:15px;line-height:1.5;">{txt}</p></div></div>')
    return f'<div style="margin-bottom:28px;">{out}</div>'

def checklist(items):
    """items = [text, ...] — zeleny checklist s fajfkami."""
    out = ''
    for item in items:
        out += (f'<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:8px;">'
                f'<span style="color:#2e7d32;font-weight:700;font-size:18px;line-height:1.4;">&#10003;</span>'
                f'<span style="color:#333;font-size:15px;line-height:1.5;">{item}</span></div>')
    return f'<div style="background:#f8faf8;border-radius:12px;padding:20px 24px;margin-bottom:24px;">{out}</div>'

def formula_box(label, formula):
    """Fialovy box pro vzorce."""
    return (f'<div style="background:#f5f0ff;border:2px solid #b39ddb;border-radius:12px;'
            f'padding:16px 24px;margin:16px 0;text-align:center;">'
            f'<div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;'
            f'color:#7e57c2;margin-bottom:4px;">{label}</div>'
            f'<div style="font-size:17px;font-weight:700;color:#4527a0;">{formula}</div></div>')

def sms_example(text, label="Example SMS"):
    """SMS bublina mockup."""
    return (f'<div style="max-width:360px;margin:20px auto;background:#e8f5e9;'
            f'border-radius:18px 18px 18px 4px;padding:16px 20px;'
            f'box-shadow:0 2px 8px rgba(0,0,0,0.08);">'
            f'<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;'
            f'color:#66bb6a;margin-bottom:6px;">{label}</div>'
            f'<p style="margin:0;color:#1b5e20;font-size:15px;line-height:1.5;">{text}</p></div>')

def divider():
    """Gradient oddelovac sekci."""
    return ('<div style="height:2px;background:linear-gradient(90deg,transparent,#667eea,'
            '#764ba2,transparent);margin:36px 0;border-radius:1px;"></div>')

def summary_box(title, text):
    """Shrnuti lekce s gradient pozadim."""
    return (f'<div style="background:linear-gradient(135deg,#f3e5f5 0%,#e8eaf6 100%);'
            f'border-radius:16px;padding:28px 32px;margin:32px 0;">'
            f'<h3 style="color:#4a148c;margin:0 0 10px 0;font-size:19px;">{title}</h3>'
            f'<p style="margin:0;color:#4a148c;font-size:15px;line-height:1.65;">{text}</p></div>')
```

**Designova pravidla:**

1. Kazda lekce ZACINA `hero()` bannerem — jina barva pro kazdou sekci
2. Statistiky/cisla v `stats_row()` — velka cisla okamzite upoutaji
3. Seznamy polozek v `cards_grid()` nebo `cards_list()` — NE v holych `<ul>`
4. Tipy v `tip()`, varovani v `warn()`, chyby v `err()`, info v `info()`
5. Porovnani v `table()` se stylizovanou hlavickou
6. Procesy/postupy v `steps()` s cislovanyma kruznicema
7. Kontrolni seznamy v `checklist()` se zelenymi fajfkami
8. Vzorce v `formula_box()` s fialovym zvyraznenim
9. Kazda lekce KONCI `summary_box()` se shrnutim
10. Sekce oddeluj `divider()` pro vizualni rytmus
11. Holé `<p>` jen pro uvodni odstavce — jinak strukturuj do karet
12. Helpery musi generovat STEJNOU HTML strukturu pro EN i CS (pro preklady)

**Barevna paleta gradientu pro hero po sekcich:**
- Sekce 1: `#667eea → #764ba2` (modro-fialova)
- Sekce 2: `#1565c0 → #0d47a1` (tmave modra)
- Sekce 3: `#ef6c00 → #e65100` (oranzova)
- Sekce 4: `#2e7d32 → #1b5e20` (zelena)
- Sekce 5: `#4a148c → #7b1fa2` (fialova)
- Sekce 6: `#00897b → #00695c` (teal)

## Workflow

### Krok 1: Analyza zadani
Zjisti: tema, cilova skupina, typ (training/documentation), rozsah, jazyk, video, kvizy.

### Krok 2: Research
Pouzij deep-research skill nebo uzivateluv obsah.

### Krok 3: Osnova kurzu
Navrhni strukturu a predloz ke schvaleni.

### Krok 4: Priprav obsah a executor
Pro kazdy blok obsahu vytvor Python skript s call/call_cs funkcemi + HTML obsahem.
Kazdy slide: name, mt (meta_title), md (meta_description), mk (keywords), ct (completion_time), html.

### Krok 5: Vytvor thumbnail (POVINNE)
Viz skill `lesson-thumbnail` pro detaily. Thumbnail se vytvari do adresare kurzu:

1. **Navrhni `thumbnail.html`** — HTML/CSS design (1920x1080) s:
   - Zive gradient orby (opacity 0.3-0.5, filter: blur(80px))
   - Badge s typem kurzu
   - 2-3 radkovy title (bily + gradient text)
   - Vizualni mockup relevantni k tematu (editor, terminal, diagram)
   - Workflow pills nebo feature highlights dole
   - Sparkle/glow dekorace
2. **Pridej `render_thumbnail.js`** — Puppeteer renderer s lokalnim Chrome
3. **Renderuj a nahraj** — `node render_thumbnail.js` + upload pres exec.py

Thumbnail upload pridej PRIMO do exec.py (za channel create, pred sections):
```python
import subprocess, base64
subprocess.run(['node', os.path.join(os.path.dirname(__file__), 'render_thumbnail.js')], check=True)
with open(os.path.join(os.path.dirname(__file__), 'thumbnail.png'), 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')
call('slide.channel', 'write', [[channel_id], {'image_1920': image_b64}])
```

### Krok 6: Spust executor
Spust exec.py s nactenyma env promennymi z /Users/michalvarys/projekty/startbusiness/.env

### Krok 7: Vystup
Prehled, osnova, SEO metadata, admin link, DRAFT stav, celkova doba, nahled thumbnaiilu.

## Dulezita pravidla

1. NIKDY nepublikuj automaticky -- vzdy is_published: False
2. VZDY vypln SEO -- meta_title, meta_description, meta_keywords
3. Strukturovany obsah -- sekce -> lekce -> kvizy
4. Realisticke casy -- completion_time odpovida delce
5. HTML musi byt validni -- zadne neuzavrene tagy
6. Sequence je dulezity -- zajistuje spravne poradi
7. Kvizy testuji porozumeni -- ne memorovani
8. Minimum 500 slov na lekci
9. JSON data file pristup -- oddel obsah od exekuce
10. Ceske preklady pres context dict -- ne keyword arg
11. URL s www -- vzdy https://www.michalvarys.eu
12. call() s explicitnimi args/kw -- ne *args/**kwargs
13. VZDY generuj thumbnail -- HTML/CSS + Puppeteer, viz skill lesson-thumbnail
14. Thumbnail NESMI byt vizualne chaby -- zive barvy, hloubka, dekorace, mockupy
15. VZDY pouzij visual design system -- hero, cards, tip/warn boxy, tabulky (viz sekce 19)
16. NIKDY hole h2/h3/p/ul -- vzdy vizualne bohate lekce jako landing pages

## Bulk Publishing Workflow

After all content is created and reviewed, publish slides in bulk.
Use slide.slide search to get all IDs for a channel, then write
is_published=True on all of them at once.

Always publish ALL slides at once (sections, intros, lessons, quizzes)
to avoid partial visibility issues.

## Video Lesson Integration

To embed videos in lessons:
1. Generate animated HTML videos per lesson (see create-animated-video skill)
2. Render HTML to MP4 via Puppeteer + ffmpeg
3. Upload MP4 to YouTube
4. Update slide.slide record: set slide_type to video, url to YouTube link

The video appears at the top of the lesson page automatically.
Set completion_time to 0.5 (hours) for ~30 second videos.

## Slide ID Reference (Channel 3 - Claude Plugins Course)

Section 1: cat=50, intro=92, lessons=51,52,53,54, quiz=56
Section 2: cat=57, intro=93, lessons=58,59,60,61,62, quiz=64
Section 3: cat=65, intro=94, lessons=66,67,68,69, quiz=70
Section 4: cat=71, intro=95, lessons=72,73,74,75,76, quiz=77
Section 5: cat=78, intro=96, lessons=79,80,81,82,83, quiz=85
Section 6: cat=86, intro=97, lessons=87,88,89,90, quiz=91

## JSON Data File Approach

For large courses (20+ lessons), always separate content from execution:
1. Generate course_data.json with all lesson content, translations, quizzes
2. Write a small exec.py that reads JSON and calls XML-RPC
3. Split into batches if needed (course_data_p1.json, course_data_p2.json)

This avoids hitting context limits and makes content reviewable before upload.

## Czech Translations

Ceske preklady maji DVA ruzne mechanismy podle typu pole:

### Textova pole (name, description, meta_title, meta_description)
Pouzivaji `translate=True` — obycejny write s context funguje:
```python
# EN jako zaklad
call('slide.slide', 'write', [[sid], {'name': 'English Name'}])
# CS jako preklad
call_cs('slide.slide', 'write', [[sid], {'name': 'Český název'}])
```

### HTML pole (html_content)
Pouziva `xml_translate` — MUSI se pouzit `update_field_translations`:
```python
# 1. Zapis EN HTML (zaklad)
call_en('slide.slide', 'write', [[sid], {'html_content': en_html}])
# 2. Extrahuj texty z EN a CS HTML
# 3. Vytvor mapovani {en_text: cs_text}
# 4. call_en('slide.slide', 'update_field_translations',
#     [[sid], 'html_content', {'cs_CZ': mapping}])
```
Detaily viz sekce "8. KRITICKE: html_content preklady" vyse.

### Co prekladat
- slide.channel: name, description, description_short, meta fields
- slide.slide: name, description, meta fields + html_content (xml_translate!)
- slide.slide (is_category): name
- slide.question: question
- slide.answer: text_value

### Ceska diakritika
VZDY pouzivej spravnou diakritiku v ceskych textech:
- háčky: č, ď, ě, ň, ř, š, ť, ž
- čárky: á, é, í, ó, ú, ý
- kroužek: ů
Text BEZ diakritiky je chybny a neprijatelny.

## Slide ID Reference (Channel 5 - Docker + Varyshop Course)

Sections: s1=113, s2=114, s3=125, s4=126, s5=134, s6=135, s7=141, s8=145
Slides: 1.1=115, 1.2=116, 2.1=117, 2.2=118, 3.1=127, 3.2=128,
        4.1=130, 4.2=131, 4.3=132, 5.1=136, 5.2=137, 6.1=139,
        7.1=142, 7.2=143, 7.3=144, 7.4=146, 7.5=147, 8.1=149
Screenshot attachments: login=3554, apps-menu=3555, crm-pipeline=3556,
                       website-builder=3557, website-frontend=3558, contact-form=3559

## Slide ID Reference (Channel 4 - MCP Server Course)

Sections: s1=98, s2=103, s3=108
Intros: 1.0=99, 2.0=104, 3.0=109
Slides: 1.1=100, 1.2=101, 2.1=105, 2.2=106, 3.1=110, 3.2=111
Quizzes: q1=102, q2=107, q3=112
