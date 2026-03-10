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

## Workflow

### Krok 1: Analyza zadani
Zjisti: tema, cilova skupina, typ (training/documentation), rozsah, jazyk, video, kvizy.

### Krok 2: Research
Pouzij deep-research skill nebo uzivateluv obsah.

### Krok 3: Osnova kurzu
Navrhni strukturu a predloz ke schvaleni.

### Krok 4: Priprav JSON data soubory
Pro kazdy blok obsahu vytvor JSON s categories, deletes, slides.
Kazdy slide: name, mt (meta_title), md (meta_description), mk (keywords), ct (completion_time), html.

### Krok 5: Napis executor skripty
Heredoc pristup (cat > script.py << ENDSCRIPT). Vzor: call/call_cs funkce + JSON load + API calls.

### Krok 6: Spust s timeoutem
osascript s timeout wrapperem.

### Krok 7: Vystup
Prehled, osnova, SEO metadata, admin link, DRAFT stav, celkova doba.

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
