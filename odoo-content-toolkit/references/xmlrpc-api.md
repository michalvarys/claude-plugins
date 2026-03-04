# Odoo 18 XML-RPC API Reference — Blog & E-Learning

## Connection Setup

```python
import xmlrpc.client
import os

ODOO_URL = os.environ.get('ODOO_URL', 'https://michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

ODOO_UID = common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})
if not ODOO_UID:
    raise Exception("Authentication failed — check ODOO_API_KEY and ODOO_DB")
```

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
