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

### 2. VM disk plny (ENOSPC)
Vsechny zapisy pres osascript na Mac filesystem.
Pracovni adresar: /Users/michalvarys/projekty/startbusiness/

### 3. osascript limit delky (~2000 znaku)
Reseni: Rozdelit na vice volani nebo heredoc (cat > file << ENDSCRIPT).

### 4. JSON Data File pristup (DOPORUCENY)
Oddel obsah od exekuce:
- JSON soubory pro obsah (quiz_data.json, course_data.json)
- Python executor skript zvlast
- Executor nacte JSON a vola API

### 5. Psani skriptu pres osascript
FUNGUJE: heredoc (cat > script.py << ENDSCRIPT ... ENDSCRIPT)
NEFUNGUJE: triple double quotes uvnitr do shell script
NEFUNGUJE: *args/**kwargs pro context parameter

### 6. Ceske preklady (JSONB)
Context jako kwargs dict, NE keyword argument.
Spravne: kw[chr(39)context chr(39)] = {chr(39)lang chr(39): chr(39)cs_CZ chr(39)}
Spatne: models.execute_kw(..., context={...}) jako Python kwarg

### 7. Domain wrapping pro search
Spravne: call(model, search, [[[field, =, val]]])  -- triple list
Spatne: call(model, search, [[field, =, val]])  -- double list

### 8. Spravny call pattern
def call(model, method, args, kw=None) s explicitnimi parametry.
NE *args/**kwargs -- zpusobi TypeError s context.

### 9. HTML wrapper pro clanky
section.s_text_block > div.container > div.row > div.col-lg-12 > OBSAH

### 10. Quiz management
Smazat stare: call(slide.question, unlink, [id_list]) -- kaskada smaze odpovedi
Vytvorit: call(slide.question, create) + call(slide.answer, create) zvlast
CS preklady: call_cs(slide.question, write, ...) s context dict

### 11. osascript timeout
with timeout of 600 seconds ... end timeout wrapper pro dlouhe skripty

### 12. JSON po castech
Velke HTML obsahy pridavej do JSON po jednom slide pres osascript.

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

For Czech translations, use context dict with lang=cs_CZ in XML-RPC calls.
Always provide translations for: name, description, html_content.
Translate section categories and quizzes too.
Use the context keyword argument (not positional) in execute_kw calls.
