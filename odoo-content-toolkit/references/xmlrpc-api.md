# Odoo 18 XML-RPC API Reference — Blog & E-Learning

## Connection Setup

```python
import xmlrpc.client
import os

ODOO_URL = os.environ.get('ODOO_URL', 'https://www.michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')
ODOO_LOGIN = os.environ.get('ODOO_LOGIN', 'info@varyshop.eu')

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object', allow_none=True)

# KRITICKE: authenticate VYZADUJE login parametr (email), ne prazdny string
ODOO_UID = common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})
if not ODOO_UID:
    raise Exception("Authentication failed — check ODOO_LOGIN, ODOO_API_KEY and ODOO_DB")
```

**POZOR:** Druhy parametr `authenticate()` MUSI byt login (email), ne prazdny string.
Bez loginu vraci `False` i s platnym API klicem.

## Shorthand

```python
DB = ODOO_DB
UID = ODOO_UID
KEY = ODOO_API_KEY
```

---

## blog.blog — Blog (kontejner pro články)

### Klíčové fieldy

- `name` (char) **REQ** — název blogu
- `subtitle` (char) — podtitulek
- `active` (boolean) — aktivní
- `content` (html) — popis blogu
- `blog_post_ids` (one2many → blog.post) — články
- `blog_post_count` (integer) RO — počet článků
- `website_id` (many2one → website) — web
- `seo_name` (char) — SEO slug
- `website_meta_title` (char) — meta title
- `website_meta_description` (text) — meta description
- `website_meta_keywords` (char) — meta keywords

### Najít nebo vytvořit blog

```python
# Najít existující blog
blog_ids = models.execute_kw(DB, UID, KEY, 'blog.blog', 'search_read', [
    [['active', '=', True]]
], {'fields': ['id', 'name', 'subtitle', 'blog_post_count']})

# Vytvořit nový blog
blog_id = models.execute_kw(DB, UID, KEY, 'blog.blog', 'create', [{
    'name': 'Název blogu',
    'subtitle': 'Podtitulek',
}])
```

---

## blog.post — Blog článek

### Klíčové fieldy

- `name` (char) **REQ** — titulek článku
- `subtitle` (char) — podtitulek
- `blog_id` (many2one → blog.blog) **REQ** — nadřazený blog
- `content` (html) — obsah článku (HTML)
- `author_id` (many2one → res.partner) — autor
- `tag_ids` (many2many → blog.tag) — tagy
- `is_published` (boolean) — publikovaný
- `website_published` (boolean) — viditelný na webu
- `post_date` (datetime) — datum publikace
- `teaser` (text) RO — automatický teaser
- `teaser_manual` (text) — manuální teaser
- `visits` (integer) RO — počet zobrazení
- `seo_name` (char) — SEO slug
- `website_meta_title` (char) — meta title
- `website_meta_description` (text) — meta description
- `website_meta_keywords` (char) — meta keywords
- `website_meta_og_img` (char) — OpenGraph obrázek
- `cover_properties` (text) — cover JSON (obrázek, pozice, resize_class)
- `website_url` (char) RO — URL článku

### Vytvořit blog článek

```python
post_id = models.execute_kw(DB, UID, KEY, 'blog.post', 'create', [{
    'name': 'Titulek článku',
    'subtitle': 'Podtitulek',
    'blog_id': blog_id,
    'content': '<p>HTML obsah článku...</p>',
    'author_id': author_partner_id,
    'tag_ids': [(6, 0, tag_id_list)],
    'teaser_manual': 'Krátký popis pro náhled...',
    'website_meta_title': 'SEO Title | Brand',
    'website_meta_description': 'Meta description pro vyhledávače (max 160 znaků)',
    'website_meta_keywords': 'klíčové, slovo, seo',
    'is_published': False,  # VŽDY draft — admin publikuje ručně
}])
```

### Přečíst existující články

```python
posts = models.execute_kw(DB, UID, KEY, 'blog.post', 'search_read', [
    [['blog_id', '=', blog_id], ['is_published', '=', True]]
], {
    'fields': ['name', 'subtitle', 'content', 'author_id', 'tag_ids',
               'post_date', 'visits', 'website_url', 'teaser_manual'],
    'order': 'post_date DESC',
    'limit': 20,
})
```

### Aktualizovat článek

```python
models.execute_kw(DB, UID, KEY, 'blog.post', 'write', [[post_id], {
    'content': '<p>Aktualizovaný HTML obsah...</p>',
    'website_meta_description': 'Nový meta description',
}])
```

### Cover properties (obrázek článku)

```python
import json

# Nastavit cover obrázek (cover_properties je JSON string)
cover = json.dumps({
    "background-image": "url('/web/image/blog.post/{post_id}/cover_properties')",
    "background_color_class": "o_cc3",
    "opacity": "0",
    "resize_class": "o_record_has_cover o_half_screen_height"
})
models.execute_kw(DB, UID, KEY, 'blog.post', 'write', [[post_id], {
    'cover_properties': cover,
}])
```

---

## blog.tag — Blog tagy

### Klíčové fieldy

- `name` (char) **REQ** — název tagu
- `category_id` (many2one → blog.tag.category) — kategorie tagu
- `post_ids` (many2many → blog.post) — články s tímto tagem
- `seo_name` (char) — SEO slug

### Najít nebo vytvořit tag

```python
# Najít existující tag
tag_ids = models.execute_kw(DB, UID, KEY, 'blog.tag', 'search', [
    [['name', 'ilike', 'SEO']]
])

# Vytvořit nový tag
tag_id = models.execute_kw(DB, UID, KEY, 'blog.tag', 'create', [{
    'name': 'SEO',
}])

# Najít nebo vytvořit (pattern)
def get_or_create_tag(name):
    ids = models.execute_kw(DB, UID, KEY, 'blog.tag', 'search', [
        [['name', '=ilike', name]]
    ])
    if ids:
        return ids[0]
    return models.execute_kw(DB, UID, KEY, 'blog.tag', 'create', [{'name': name}])
```

---

## slide.channel — E-Learning kurz (kanál)

### Klíčové fieldy

- `name` (char) **REQ** — název kurzu
- `description` (html) — popis
- `description_short` (html) — krátký popis
- `description_html` (html) — detailní popis
- `channel_type` (selection) **REQ** — `'training'` nebo `'documentation'`
- `enroll` (selection) **REQ** — `'public'` nebo `'invite'`
- `visibility` (selection) **REQ** — `'public'`, `'connected'`, `'members'`
- `tag_ids` (many2many → slide.channel.tag) — tagy
- `slide_ids` (one2many → slide.slide) — obsah (lekce)
- `user_id` (many2one → res.users) — zodpovědná osoba
- `image_1920` (binary) — obrázek kurzu (base64)
- `is_published` (boolean) — publikovaný
- `website_published` (boolean) — viditelný na webu
- `total_slides` (integer) RO — celkový počet lekcí
- `total_time` (float) RO — celková doba
- `total_views` (integer) RO — celkový počet zobrazení
- `website_url` (char) RO — URL kurzu
- `seo_name` (char) — SEO slug
- `website_meta_title` (char) — meta title
- `website_meta_description` (text) — meta description
- `website_meta_keywords` (char) — meta keywords
- `sequence` (integer) — pořadí

### Vytvořit kurz

```python
channel_id = models.execute_kw(DB, UID, KEY, 'slide.channel', 'create', [{
    'name': 'Název kurzu',
    'description': '<p>Popis kurzu v HTML</p>',
    'description_short': '<p>Krátký popis</p>',
    'channel_type': 'training',       # nebo 'documentation'
    'enroll': 'public',               # nebo 'invite'
    'visibility': 'public',           # nebo 'connected', 'members'
    'website_meta_title': 'Kurz: Název | Brand',
    'website_meta_description': 'Meta description kurzu',
    'website_meta_keywords': 'elearning, kurz, klíčové slovo',
    'is_published': False,  # VŽDY draft
}])
```

### Přečíst existující kurzy

```python
channels = models.execute_kw(DB, UID, KEY, 'slide.channel', 'search_read', [
    [['active', '=', True]]
], {
    'fields': ['name', 'description_short', 'channel_type', 'total_slides',
               'total_time', 'total_views', 'is_published', 'website_url'],
    'order': 'sequence',
})
```

---

## slide.slide — Lekce / Slide (obsah kurzu)

### Klíčové fieldy

- `name` (char) **REQ** — titulek lekce
- `channel_id` (many2one → slide.channel) **REQ** — nadřazený kurz
- `description` (html) — popis lekce
- `slide_category` (selection) **REQ** — `'article'`, `'document'`, `'video'`, `'infographic'`, `'quiz'`
- `source_type` (selection) **REQ** — `'local_file'` nebo `'external'`
- `html_content` (html) — HTML obsah (pro type article)
- `binary_content` (binary) — soubor (PDF, obrázek)
- `document_binary_content` (binary) — PDF obsah
- `image_1920` (binary) — obrázek lekce (base64)
- `url` (char) — externí URL (YouTube, Vimeo, Google Drive)
- `video_url` (char) — Video link
- `completion_time` (float) — doba v hodinách
- `sequence` (integer) — pořadí v kurzu
- `is_category` (boolean) — je to sekce/kategorie (nadpis)
- `is_preview` (boolean) — povolený náhled (pro nepřihlášené)
- `is_published` (boolean) — publikovaný
- `slide_resource_downloadable` (boolean) — ke stažení
- `question_ids` (one2many → slide.question) — kvízové otázky
- `tag_ids` (many2many → slide.tag) — tagy
- `website_url` (char) RO — URL lekce
- `seo_name` (char) — SEO slug
- `website_meta_title` (char) — meta title
- `website_meta_description` (text) — meta description

### Slide types a jejich source_type

| slide_category | source_type   | Povinný field        |
|---------------|---------------|----------------------|
| article       | local_file    | html_content         |
| document      | local_file    | document_binary_content (base64 PDF) |
| video         | external      | url (YouTube/Vimeo)  |
| infographic   | local_file    | image_binary_content (base64) |
| quiz          | local_file    | question_ids         |

### Vytvořit sekci (kategorii/nadpis)

```python
section_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [{
    'name': 'Sekce 1: Úvod',
    'channel_id': channel_id,
    'is_category': True,
    'is_published': False,
    'slide_category': 'article',
    'source_type': 'local_file',
    'sequence': 1,
}])
```

### Vytvořit článkovou lekci (HTML content)

```python
slide_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [{
    'name': 'Lekce 1: Základy',
    'channel_id': channel_id,
    'slide_category': 'article',
    'source_type': 'local_file',
    'html_content': '<p>Obsah lekce v HTML...</p>',
    'description': '<p>Krátký popis lekce</p>',
    'completion_time': 0.25,  # 15 minut
    'sequence': 2,
    'is_preview': False,
    'is_published': False,
    'website_meta_title': 'Lekce 1: Základy',
    'website_meta_description': 'Naučte se základy...',
}])
```

### Vytvořit video lekci (YouTube)

```python
video_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [{
    'name': 'Video: Praktická ukázka',
    'channel_id': channel_id,
    'slide_category': 'video',
    'source_type': 'external',
    'url': 'https://www.youtube.com/watch?v=VIDEO_ID',
    'description': '<p>Video ukázka</p>',
    'completion_time': 0.5,
    'sequence': 3,
    'is_published': False,
}])
```

### Vytvořit kvíz

```python
quiz_id = models.execute_kw(DB, UID, KEY, 'slide.slide', 'create', [{
    'name': 'Kvíz: Ověřte si znalosti',
    'channel_id': channel_id,
    'slide_category': 'quiz',
    'source_type': 'local_file',
    'html_content': '<p>Zodpovězte následující otázky</p>',
    'completion_time': 0.1,
    'sequence': 10,
    'is_published': False,
    'question_ids': [
        (0, 0, {
            'question': 'Jaká je správná odpověď?',
            'answer_ids': [
                (0, 0, {'text_value': 'Odpověď A', 'is_correct': True, 'sequence': 1}),
                (0, 0, {'text_value': 'Odpověď B', 'is_correct': False, 'sequence': 2}),
                (0, 0, {'text_value': 'Odpověď C', 'is_correct': False, 'sequence': 3}),
            ]
        }),
    ]
}])
```

### Přečíst lekce kurzu

```python
slides = models.execute_kw(DB, UID, KEY, 'slide.slide', 'search_read', [
    [['channel_id', '=', channel_id], ['is_category', '=', False]]
], {
    'fields': ['name', 'slide_category', 'html_content', 'description',
               'completion_time', 'sequence', 'is_published', 'total_views', 'website_url'],
    'order': 'sequence',
})
```

---

## slide.channel.tag — Tag pro kurzy

### Klíčové fieldy

- `name` (char) **REQ** — název
- `group_id` (many2one → slide.channel.tag.group) **REQ** — skupina tagů
- `sequence` (integer) **REQ** — pořadí

```python
# Najít existující tagy
tags = models.execute_kw(DB, UID, KEY, 'slide.channel.tag', 'search_read', [
    []
], {'fields': ['name', 'group_id']})
```

---

## Nahrání obrázku přes binary field

```python
import base64

# Ze souboru
with open('cover.png', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')

# Nastavit na blog post
models.execute_kw(DB, UID, KEY, 'blog.post', 'write', [[post_id], {
    'cover_properties': json.dumps({
        "background-image": "url('/web/image/blog.post/" + str(post_id) + "/cover_properties')",
        "resize_class": "o_record_has_cover o_half_screen_height",
        "opacity": "0"
    })
}])

# Nastavit na slide.channel (cover image)
models.execute_kw(DB, UID, KEY, 'slide.channel', 'write', [[channel_id], {
    'image_1920': image_b64,
}])

# Nastavit na slide.slide (thumbnail)
models.execute_kw(DB, UID, KEY, 'slide.slide', 'write', [[slide_id], {
    'image_1920': image_b64,
}])
```

---

## Odoo admin link

```
{ODOO_URL}/web#id={record_id}&model={model_name}&view_type=form
```

Příklady:
- Blog post: `{ODOO_URL}/web#id={post_id}&model=blog.post&view_type=form`
- Kurz: `{ODOO_URL}/web#id={channel_id}&model=slide.channel&view_type=form`
- Lekce: `{ODOO_URL}/web#id={slide_id}&model=slide.slide&view_type=form`

## Website frontend link

- Blog post: `{ODOO_URL}/blog/{blog_seo_name}/{post_seo_name}-{post_id}`
- Kurz: `{ODOO_URL}/slides/{channel_seo_name}`
- Lekce: `{ODOO_URL}/slides/{channel_seo_name}/{slide_seo_name}`

Nebo použij field `website_url` z objektu (RO field).

## Error Handling

```python
try:
    result = models.execute_kw(DB, UID, KEY, 'model', 'method', [args])
except xmlrpc.client.Fault as e:
    print(f"Odoo Error: {e.faultString}")
except Exception as e:
    print(f"Connection Error: {e}")
```

---

## KRITICKE POZNAMKY Z PRAXE

### Spravny call pattern (POUZIVEJ VZDY)

```python
def call(model, method, args, kw=None):
    if kw is None: kw = {}
    return models.execute_kw(DB, UID, KEY, model, method, args, kw)

def call_cs(model, method, args, kw=None):
    if kw is None: kw = {}
    kw['context'] = {'lang': 'cs_CZ'}
    return models.execute_kw(DB, UID, KEY, model, method, args, kw)
```

NIKDY nepouzivej *args/**kwargs — zpusobi TypeError s context parametrem.

### Domain wrapping
- search: call('model', 'search', [[['field', '=', val]]])
- Tri urovne listu: args_list > domain_list > leaf_tuple

### URL
- VZDY: https://www.michalvarys.eu (s www)
- BEZ www zpusobi 301 redirect a XML-RPC selze

### Ceske preklady
- context jde do kwargs dict, NE jako Python keyword
- Funguje pro vsechny modely: slide.slide, slide.question, slide.answer
- Cesky text MUSI mit diakritiku (hacky, carky, krouzek) — VZDY

### HTML obsah clanku
- VZDY obal: section.s_text_block > container > row > col-lg-12
- Bez wrapperu se obsah nezobrazuje spravne na webu

### Quiz otazky a odpovedi
- Smazani: call('slide.question', 'unlink', [ids]) — kaskadove maze odpovedi
- Tvorba: zvlast slide.question create + slide.answer create
- Preklady: call_cs pro question i answer
- KAZDA otazka MUSI mit alespon 1 spravnou (is_correct=True) a 1 nespravnou odpoved

### Screenshoty a obrazky jako ir.attachment

```python
import base64

# Upload obrazku
with open('screenshot.png', 'rb') as f:
    data = base64.b64encode(f.read()).decode()

att_id = call('ir.attachment', 'create', [{
    'name': 'course-screenshot.png',
    'type': 'binary',
    'datas': data,
    'res_model': 'slide.slide',
    'public': True,
}])
img_url = f'/web/image/{att_id}'
# Pouzij v HTML: <img src="/web/image/{att_id}" alt="Popis" loading="lazy"/>
```

---

## PREKLADY html_content — KRITICKE (xml_translate)

### Problem
Pole `html_content` na `slide.slide` pouziva `xml_translate`, coz znamena ze preklady
funguji na urovni TEXTOVYCH UZLU, ne celych poli. Pokud zavolate `write` s cs_CZ
kontextem a jinym HTML, PREPISE se zakladni (EN) HTML — NE prida preklad!

### SPATNY pristup (nepouzivat!)
```python
# TOTO NEFUNGUJE — CS write prepise EN zaklad!
call_en('slide.slide', 'write', [[sid], {'html_content': en_html}])
call_cs('slide.slide', 'write', [[sid], {'html_content': cs_html}])
# Vysledek: OBE jazyky ukazuji cs_html (posledni zapis)
```

### SPRAVNY pristup pro html_content preklady
```python
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    """Extrahuje textove uzly z HTML."""
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

# 1. Zapis EN HTML jako zaklad (en_US kontext)
call_en('slide.slide', 'write', [[slide_id], {'html_content': en_html}])

# 2. Extrahuj textove uzly z obou verzi
en_texts = extract_texts(en_html)
cs_texts = extract_texts(cs_html)

# 3. Vytvor mapovani {EN_text: CS_text} dle pozice
mapping = {}
for i in range(min(len(en_texts), len(cs_texts))):
    if en_texts[i] != cs_texts[i]:
        mapping[en_texts[i]] = cs_texts[i]

# 4. Aplikuj CS preklady pres update_field_translations
call_en('slide.slide', 'update_field_translations',
    [[slide_id], 'html_content', {'cs_CZ': mapping}])
```

### Proc to funguje
- `update_field_translations` nastavuje preklady pro jednotlive textove uzly
- Odoo pri cteni v cs_CZ nahradi textove uzly prelozenymy verzemi
- HTML struktura (tagy) zustava stejna, meni se jen text uvnitr

### Typy poli a jejich prekladovy mechanismus

| Typ pole | translate | Jak prekladat |
|----------|-----------|---------------|
| name, description, meta_* | `translate=True` | Obycejny `write` s context={'lang': 'cs_CZ'} |
| html_content | `translate=xml_translate` | `update_field_translations` s per-term mapovanim |
| content (blog.post) | `translate=True` | Obycejny `write` s context={'lang': 'cs_CZ'} |

### Overeni prekladu
```python
# Kontrola zda preklady funguji
trans = call_en('slide.slide', 'get_field_translations', [[slide_id], 'html_content'])
# Vraci: [[{lang, source, value}, ...], {translation_type, translation_show_source}]
```

### Pridani obsahu (screenshoty, CTA bloky) s preklady
Pokud pridavate novy HTML obsah (napr. screenshoty) do existujiciho slidu:
```python
# 1. Prectete soucasny EN HTML
en_html = call_en('slide.slide', 'read', [[sid], ['html_content']])[0]['html_content']

# 2. Pridejte novy obsah
new_html = en_html.replace('</section>', inject_html + '</section>', 1)

# 3. Zapiste zpet do EN zakladu
call_en('slide.slide', 'write', [[sid], {'html_content': new_html}])

# 4. Pridejte CS preklady pro NOVE textove uzly
call_en('slide.slide', 'update_field_translations',
    [[sid], 'html_content', {'cs_CZ': {
        'English caption': 'Český popisek',
        'Tip:': 'Tip:',
        'English tip text': 'Český text tipu',
    }}])
```
