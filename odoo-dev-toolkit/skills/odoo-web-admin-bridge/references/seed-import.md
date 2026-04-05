# Seed Import

Loading seed data from the source web application (JSON dump) into Odoo records. Two approaches: XML for small seeds, Python script for large ones.

## Producing the JSON seed

The `web-to-static` skill leaves a `data/products.json` in the static bundle when the source was a Next.js + Prisma app. Example format:

```json
[
    {
        "id": "clxyz123abc",
        "name": "Cohiba Robusto",
        "description": "Classic Cuban cigar",
        "price": "450",
        "image": "https://blob.vercel-storage.com/products/cohiba-robusto-xyz.jpg",
        "category": "Cigars",
        "subcategory": "Cuban",
        "badge": "PREMIUM",
        "stock": 12,
        "active": true,
        "createdAt": "2025-01-15T10:30:00Z",
        "updatedAt": "2025-11-20T14:22:00Z"
    }
]
```

If the source is NOT Next.js + Prisma, produce an equivalent JSON by querying the source database directly. Keep field names stable — the Python import script reads them.

## XML approach (small seeds ≤ 50 records)

Generate one `<record>` per product in `data/seed_products.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <!-- Categories first — products reference them -->
    <record id="seed_category_cigars" model="product.public.category">
        <field name="name">Cigars</field>
    </record>
    <record id="seed_category_cuban" model="product.public.category">
        <field name="name">Cuban</field>
        <field name="parent_id" ref="seed_category_cigars"/>
    </record>

    <!-- Ribbons (badges) -->
    <record id="seed_ribbon_premium" model="product.ribbon">
        <field name="name">PREMIUM</field>
        <field name="bg_color">#d4af37</field>
        <field name="text_color">#000000</field>
    </record>

    <!-- Products -->
    <record id="seed_product_cohiba_robusto" model="product.template">
        <field name="name">Cohiba Robusto</field>
        <field name="list_price">450.00</field>
        <field name="description_sale">Classic Cuban cigar</field>
        <field name="sale_ok" eval="True"/>
        <field name="is_published" eval="True"/>
        <field name="active" eval="True"/>
        <field name="website_ribbon_id" ref="seed_ribbon_premium"/>
        <field name="public_categ_ids" eval="[(6, 0, [
            ref('seed_category_cigars'),
            ref('seed_category_cuban'),
        ])]"/>
        <field name="image_1920" type="base64" file="<brand>_web_catalog/static/src/img/products/cohiba-robusto.jpg"/>
    </record>

    <!-- ... one record per product ... -->

</data>
</odoo>
```

### XML field syntax reference

| Pattern | Meaning |
|---|---|
| `<field name="x">literal</field>` | Plain string or number |
| `<field name="x" eval="True"/>` | Python expression (booleans, math) |
| `<field name="x" ref="other_xml_id"/>` | Many2one reference to another record |
| `<field name="x" eval="[(6, 0, [ref('a'), ref('b')])]"/>` | Many2many set (replace all) |
| `<field name="x" eval="[(4, ref('a'))]"/>` | Many2many add |
| `<field name="x" type="base64" file="module/path/to/file.jpg"/>` | Binary image from file in module |

### Image handling in XML

Images must be placed inside the module's static folder:

```
<brand>_web_catalog/
└── static/
    └── src/
        └── img/
            └── products/
                ├── cohiba-robusto.jpg
                └── montecristo-no4.jpg
```

Then reference with `file="<brand>_web_catalog/static/src/img/products/cohiba-robusto.jpg"`. Odoo reads the file at install time and base64-encodes it into the `image_1920` field.

**Important:** the module must be installed when the seed loads, so static files must be copied BEFORE manifest `data:` is processed. Odoo handles this automatically — just make sure the files exist in your module directory before running `odoo -i <module>`.

If the original images are URLs (from Vercel Blob, S3, etc.), download them first:

```bash
#!/bin/bash
# Run once before installing the module
SEED_FILE=./data/seed-products.json
IMG_DIR=./static/src/img/products
mkdir -p "$IMG_DIR"

jq -c '.[]' "$SEED_FILE" | while read -r row; do
    id=$(echo "$row" | jq -r '.id')
    url=$(echo "$row" | jq -r '.image')
    name=$(echo "$row" | jq -r '.name' | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    [ -z "$url" ] && continue
    [ "$url" = "null" ] && continue
    curl -sSL "$url" -o "$IMG_DIR/${name}.jpg"
done
```

## Python approach (large seeds or complex logic)

For seeds with hundreds of records, conditional logic, or many-to-many resolution, use a one-off script executed via `odoo shell`:

```python
# scripts/import_seed.py — run with: docker compose exec web odoo shell -d <db> < scripts/import_seed.py
import json
import base64
import logging
import requests
from pathlib import Path

_logger = logging.getLogger(__name__)

SEED_PATH = '/app/elite_themes/<brand>_web_catalog/data/seed-products.json'


def slugify(name):
    return name.lower().replace(' ', '-').replace('/', '-')


def get_or_create_category(env, name, parent_id=None):
    """Find an existing public category by name, or create it."""
    domain = [('name', '=', name)]
    if parent_id:
        domain.append(('parent_id', '=', parent_id))
    cat = env['product.public.category'].search(domain, limit=1)
    if not cat:
        cat = env['product.public.category'].create({
            'name': name,
            'parent_id': parent_id,
        })
    return cat


def get_or_create_ribbon(env, name, bg='#ff6a00', fg='#ffffff'):
    ribbon = env['product.ribbon'].search([('name', '=', name)], limit=1)
    if not ribbon:
        ribbon = env['product.ribbon'].create({
            'name': name,
            'bg_color': bg,
            'text_color': fg,
        })
    return ribbon


def download_image_base64(url):
    """Fetch an image URL and return base64-encoded bytes."""
    try:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return base64.b64encode(r.content)
    except Exception as e:
        _logger.warning("Failed to download %s: %s", url, e)
        return False


def import_products(env):
    with open(SEED_PATH) as f:
        seed = json.load(f)

    stats = {'created': 0, 'updated': 0, 'skipped': 0}

    for item in seed:
        # Map category string to category record
        category = get_or_create_category(env, item['category'])
        categ_ids = [category.id]

        if item.get('subcategory'):
            sub = get_or_create_category(env, item['subcategory'], parent_id=category.id)
            categ_ids.append(sub.id)

        # Map badge to ribbon
        ribbon_id = False
        if item.get('badge'):
            ribbon_id = get_or_create_ribbon(env, item['badge']).id

        # Download image
        image_b64 = False
        if item.get('image'):
            if item['image'].startswith('http'):
                image_b64 = download_image_base64(item['image'])
            else:
                # Local path in seed
                local = Path('/app/elite_themes/<brand>_web_catalog/static/src/img/products') / Path(item['image']).name
                if local.exists():
                    image_b64 = base64.b64encode(local.read_bytes())

        # Prepare values
        values = {
            'name': item['name'],
            'description_sale': item.get('description', ''),
            'list_price': float(item.get('price', 0)),
            'sale_ok': True,
            'is_published': bool(item.get('active', True)),
            'active': True,
            'public_categ_ids': [(6, 0, categ_ids)],
        }
        if ribbon_id:
            values['website_ribbon_id'] = ribbon_id
        if image_b64:
            values['image_1920'] = image_b64

        # Idempotent upsert — find by name (or better: by a stable external ID if available)
        existing = env['product.template'].search([('name', '=', item['name'])], limit=1)
        if existing:
            existing.write(values)
            stats['updated'] += 1
            _logger.info("Updated: %s", item['name'])
        else:
            env['product.template'].create(values)
            stats['created'] += 1
            _logger.info("Created: %s", item['name'])

    env.cr.commit()
    _logger.info("Import done: %s", stats)
    print("Import done:", stats)


# Execute when loaded via odoo shell
import_products(env)
```

Run:

```bash
docker compose exec web odoo shell -d <db> < scripts/import_seed.py
```

### Idempotency

The upsert pattern `search → write OR create` makes the script safe to re-run. Re-running won't duplicate records — it updates existing ones in place.

**Better idempotency via external ID:** if the source data has stable UUIDs, use them:

```python
ext_id = f"web_catalog_seed.product_{item['id']}"
existing = env.ref(ext_id, raise_if_not_found=False)

if existing:
    existing.write(values)
else:
    record = env['product.template'].create(values)
    env['ir.model.data'].create({
        'name': f"product_{item['id']}",
        'module': 'web_catalog_seed',
        'model': 'product.template',
        'res_id': record.id,
        'noupdate': True,
    })
```

External IDs give you `env.ref()` lookups and survive database exports/imports.

## Triggering the import

Three options:

### 1. Manifest data list (XML only, install time)

```python
'data': [
    # ...
    'data/seed_products.xml',
],
```

Runs automatically when the module installs. Best for small, static seeds.

### 2. Post-install hook (Python, install time)

```python
# __manifest__.py
{
    # ...
    'post_init_hook': '_post_init',
}

# __init__.py
from . import models

def _post_init(env):
    from . import scripts
    scripts.import_seed.import_products(env)
```

Runs after all module data is loaded. Best when the import logic is complex or depends on other modules being installed.

### 3. Manual via odoo shell (ad-hoc)

```bash
docker compose exec web odoo shell -d <db> < scripts/import_seed.py
```

Best for one-off migrations where you want to control timing and re-run manually.

## Handling relationships

### Many2one (categories, ribbon, currency)

```python
'categ_id': env.ref('product.product_category_all').id,
# or
'categ_id': env['product.category'].search([('name', '=', 'All')], limit=1).id,
```

### Many2many (public categories, tags)

Odoo uses special tuple commands:

| Tuple | Meaning |
|---|---|
| `(0, 0, {values})` | Create a new related record with `values` |
| `(1, id, {values})` | Update existing related record `id` with `values` |
| `(2, id, 0)` | Delete related record `id` |
| `(3, id, 0)` | Remove link to related record `id` (don't delete) |
| `(4, id, 0)` | Add existing record `id` to the link |
| `(5, 0, 0)` | Remove all links (but don't delete records) |
| `(6, 0, [ids])` | Replace all links with exactly `[ids]` |

For the common "set these categories, replacing whatever was there":

```python
'public_categ_ids': [(6, 0, [cat1.id, cat2.id])]
```

For "add these without removing existing":

```python
'public_categ_ids': [(4, cat1.id), (4, cat2.id)]
```

### One2many (gallery images on products)

```python
'product_template_image_ids': [
    (0, 0, {
        'name': 'Gallery 1',
        'image_1920': download_image_base64('https://.../gallery-1.jpg'),
    }),
    (0, 0, {
        'name': 'Gallery 2',
        'image_1920': download_image_base64('https://.../gallery-2.jpg'),
    }),
],
```

## Verification

After import, verify in Odoo shell:

```python
>>> env['product.template'].search_count([])
147  # Should match len(seed)

>>> p = env['product.template'].search([('name', '=', 'Cohiba Robusto')])
>>> p.list_price
450.0
>>> p.public_categ_ids.mapped('name')
['Cigars', 'Cuban']
>>> p.website_ribbon_id.name
'PREMIUM'
>>> bool(p.image_1920)
True
```

Navigate to Website → open the product URL → verify it renders with image and ribbon.

## Common failures

| Failure | Cause | Fix |
|---|---|---|
| `psycopg2.errors.UniqueViolation` on second run | Not using idempotent upsert | Switch to `search → write OR create` pattern |
| `ValueError: Expected singleton` | Searching without `limit=1` when expecting one result | Add `limit=1` to the search |
| Images missing after import | URL download failed silently | Check `_logger.warning` output, verify seed URLs are reachable |
| `AccessError` during import | Running as a user without write permission | Use `env.sudo()` or run the script as admin UID |
| Images too large | Base64 encoding of 10MB+ JPEGs blows up the database | Resize before encoding: `Pillow` or `ImageMagick` to ≤1920px |
| Ribbon or category fields silent-ignore | Dependency on `website_sale` not declared | Add `website_sale` to `depends` in manifest |
