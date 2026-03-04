---
description: Write SEO-optimized blog articles and publish to Odoo 18 via XML-RPC API. Supports research, AI images, and full SEO metadata.
triggers:
  - "write blog"
  - "create article"
  - "blog post"
  - "SEO article"
  - "napiš článek"
  - "vytvoř blog"
  - "napsat blog"
  - "seo článek"
---

# Blog Writer — SEO články pro Odoo 18

## Přehled

Tento skill vytváří SEO-optimalizované blog články a publikuje je do Odoo 18 přes XML-RPC API (`blog.post`). Články jsou vždy vytvořeny jako DRAFT — admin publikuje ručně.

## Konfigurace

Environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

Přečti VŽDY tyto reference před psaním:
1. `@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md` — API pro blog.blog, blog.post, blog.tag
2. `@${CLAUDE_PLUGIN_ROOT}/references/seo-guidelines.md` — SEO pravidla a struktura článků

## Workflow

### Krok 1: Analýza zadání

Zjisti od uživatele:
- **Téma** — o čem má být článek
- **Cílová skupina** — pro koho píšeme
- **Formát** — how-to, listicle, informační, srovnávací (default: informační)
- **Jazyk** — český nebo anglický (default: český)
- **Délka** — krátký (~800 slov), střední (~1500 slov), dlouhý (~2500+ slov) (default: střední)

### Krok 2: Research (pokud potřeba)

Pokud téma vyžaduje aktuální informace:
1. Použij `WebSearch` pro průzkum tématu
2. Sesbírej fakta, statistiky, trendy
3. Identifikuj klíčová slova (hlavní + long-tail)
4. Zjisti co píše konkurence (pro inspiraci struktury)

### Krok 3: SEO příprava

Před psaním připrav:

```
Hlavní klíčové slovo: [keyword]
Sekundární klíčová slova: [kw1, kw2, kw3]
Long-tail keywords: [long-tail-1, long-tail-2]

Titulek (name): max 60 znaků, obsahuje hlavní keyword
Meta title: {keyword} — {doplnění} | {Brand}
Meta description: max 155 znaků, keyword + benefit + CTA
Meta keywords: čárkami oddělená (5-10)
SEO slug: lowercase-bez-diakritiky
Teaser: 1-3 věty, hook pro čtenáře
```

### Krok 4: Napsat článek

Piš v HTML formátu pro Odoo `blog.post.content`:

```html
<section class="s_text_block">
    <div class="container">
        <div class="row">
            <div class="col-lg-12">

<h2>Úvodní sekce</h2>
<p>Úvodní odstavec — hook, kontext, proč by měl čtenář pokračovat.
Klíčové slovo v prvních 100 slovech.</p>

<h2>Hlavní sekce 1</h2>
<p>Obsah...</p>

<h3>Podsekce</h3>
<p>Detaily...</p>

<h2>Hlavní sekce 2</h2>
<ul>
    <li><strong>Bod 1:</strong> Popis...</li>
    <li><strong>Bod 2:</strong> Popis...</li>
</ul>

<!-- Pokud máme AI obrázek -->
<figure>
    <img src="{image_url}" alt="Popisný alt text s klíčovým slovem" class="img-fluid"/>
    <figcaption>Popis obrázku</figcaption>
</figure>

<h2>Závěr</h2>
<p>Shrnutí hlavních bodů a CTA.</p>

            </div>
        </div>
    </div>
</section>
```

**Pravidla HTML:**
- NIKDY nepoužívej H1 (to je automaticky z titulku)
- H2 pro hlavní sekce, H3 pro podsekce
- Odstavce max 3-4 věty
- Seznamy pro přehlednost
- Vše zabalené v Odoo section/container/row/col strukturu
- Inline CSS jen pokud nutné
- Obrázky s alt textem

### Krok 5: AI Cover Image (volitelné)

Pokud uživatel chce cover obrázek:

1. Vytvoř obrázek pomocí dostupných nástrojů (social-media-creator, Canva, nebo jiný)
2. Obrázek by měl být 1200x630px (blog cover) nebo 1920x1080px
3. Nahraj jako base64 do Odoo přes `image_1920` field nebo cover_properties

### Krok 6: Publikovat do Odoo

Napíš Python skript a spusť přes osascript (VM Bash nefunguje kvůli ENOSPC):

```python
import xmlrpc.client, os, json

# --- Connection ---
ODOO_URL = os.environ.get('ODOO_URL', 'https://michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

UID = common.authenticate(ODOO_DB, '', ODOO_API_KEY, {})
if not UID:
    # Fallback — vyzkoušej známé UID
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

# --- Najdi nebo vytvoř blog ---
blogs = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY, 'blog.blog', 'search_read', [
    [['active', '=', True]]
], {'fields': ['id', 'name'], 'limit': 5})

if blogs:
    blog_id = blogs[0]['id']  # Použij první blog
    print(f"Použiji blog: {blogs[0]['name']} (ID: {blog_id})")
else:
    blog_id = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY, 'blog.blog', 'create', [{
        'name': 'Blog',
    }])
    print(f"Vytvořen nový blog (ID: {blog_id})")

# --- Vytvoř nebo najdi tagy ---
def get_or_create_tag(name):
    ids = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY, 'blog.tag', 'search', [
        [['name', '=ilike', name]]
    ])
    if ids:
        return ids[0]
    return models.execute_kw(ODOO_DB, UID, ODOO_API_KEY, 'blog.tag', 'create', [{'name': name}])

tag_ids = [get_or_create_tag(t) for t in TAG_NAMES]

# --- Vytvoř článek ---
post_id = models.execute_kw(ODOO_DB, UID, ODOO_API_KEY, 'blog.post', 'create', [{
    'name': TITLE,
    'subtitle': SUBTITLE,
    'blog_id': blog_id,
    'content': HTML_CONTENT,
    'tag_ids': [(6, 0, tag_ids)],
    'teaser_manual': TEASER,
    'website_meta_title': META_TITLE,
    'website_meta_description': META_DESCRIPTION,
    'website_meta_keywords': META_KEYWORDS,
    'seo_name': SEO_SLUG,
    'is_published': False,  # VŽDY DRAFT!
}])

print(f"\n=== Blog článek vytvořen ===")
print(f"ID: {post_id}")
print(f"Titulek: {TITLE}")
print(f"Admin: {ODOO_URL}/web#id={post_id}&model=blog.post&view_type=form")
```

### Krok 7: Výstup

Vrať uživateli:
1. **Shrnutí článku** — titulek, teaser, počet slov
2. **SEO metadata** — meta title, description, keywords
3. **Odoo admin link** — pro review a publikaci
4. **Tagy** — seznam přiřazených tagů
5. **Stav: DRAFT** — připomínka že admin musí publikovat

## Důležitá pravidla

1. **NIKDY nepublikuj automaticky** — vždy `is_published: False`
2. **VŽDY vyplň SEO** — meta_title, meta_description, meta_keywords, seo_name
3. **HTML musí být validní** — žádné neuzavřené tagy
4. **Obrázky s alt textem** — pro SEO i přístupnost
5. **Minimum 800 slov** — pro SEO ranking (ideálně 1500+)
6. **Klíčové slovo v H2** — alespoň 1x v podnadpisu
7. **Interní linky** — pokud existují relevantní články, odkaž na ně

## Spuštění skriptu

Kvůli ENOSPC na VM použij `mcp__Control_your_Mac__osascript` pro spuštění Python skriptu:

```
do shell script "cd /Users/michalvarys/projekty/sidonio && export $(grep -v '^#' .env | xargs) && python3 /Users/michalvarys/projekty/sidonio/script_name.py"
```

Nebo zapiš skript do souboru a spusť:
1. Write tool → `/sessions/brave-focused-clarke/mnt/sidonio/script_name.py`
2. osascript → spusť skript z Mac cesty `/Users/michalvarys/projekty/sidonio/script_name.py`
