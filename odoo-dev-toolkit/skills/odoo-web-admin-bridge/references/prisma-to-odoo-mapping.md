# Prisma → Odoo Field Mapping

Common Prisma schemas mapped to standard Odoo 18 fields. Use this as the starting point — always verify the field exists in the installed Odoo version with `env['product.template']._fields.keys()` via `odoo shell` if uncertain.

## Product models

### Basic e-commerce product

```prisma
model Product {
    id          String   @id @default(cuid())
    name        String
    description String
    price       Float
    image       String              // URL
    category    String
    stock       Int      @default(0)
    active      Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
}
```

| Prisma field | Odoo target | Model | Type | Notes |
|---|---|---|---|---|
| `id` | `id` | `product.template` | Integer (auto) | Don't try to preserve Prisma cuid — map by name on import |
| `name` | `name` | `product.template` | Char | `translate=True` |
| `description` | `description_sale` | `product.template` | Text | Short description; use `website_description` if HTML |
| `price` | `list_price` | `product.template` | Float | Currency-aware |
| `image` | `image_1920` | `product.template` | Binary | Fetch URL → base64 on import |
| `category` | `public_categ_ids` | `product.template` → `product.public.category` | Many2many | `website_sale` dependency |
| `stock` | `qty_available` | `product.template` | Float (computed) | Read-only unless `stock` installed |
| `active` | `active` | `product.template` | Boolean | Archive field (standard Odoo) |
| `active` | `is_published` | `product.template` | Boolean | Website visibility (`website_sale`) |
| `createdAt` | `create_date` | all | Datetime | Auto-set |
| `updatedAt` | `write_date` | all | Datetime | Auto-set |

**Where `active` splits into two Odoo fields:** `active=false` in Prisma usually means "not shown anywhere". In Odoo this is two orthogonal concepts:

- `active=False` archives the record (hides from all views)
- `is_published=False` keeps it visible in the backend but hides it from the website

Ask the user which semantics they want. Most migrations set `is_published = prisma.active` and leave Odoo's `active = True` so content editors can still edit unpublished products.

### With variants

```prisma
model Product {
    id       String    @id
    name     String
    variants Variant[]
}
model Variant {
    id       String @id
    color    String
    size     String
    sku      String
    price    Float
    stock    Int
    product  Product @relation(...)
}
```

Map to Odoo's attribute system:

- `Product` → `product.template`
- `Variant` → `product.product`
- `Variant.color`, `Variant.size` → `product.attribute` + `product.attribute.value` + `product.template.attribute.line`

This is significantly more complex. The `odoo-web-admin-bridge` skill does NOT auto-generate variant setups — it flags to the user that variants were detected and recommends using the standard Odoo Sales → Products flow for variant configuration, while the simplified <Brand> menu handles only the template-level fields.

### With tags/badges

```prisma
model Product {
    badge String?   // "NEW", "SALE", "LIMITED"
}
```

Map to `website_ribbon_id`:

```python
# On import
badge_to_ribbon = {}
for prisma_product in seed:
    if prisma_product['badge']:
        ribbon = env['product.ribbon'].search([('name', '=', prisma_product['badge'])], limit=1)
        if not ribbon:
            ribbon = env['product.ribbon'].create({
                'name': prisma_product['badge'],
                'bg_color': '#ff6a00' if prisma_product['badge'] == 'NEW' else '#dc2626',
                'text_color': '#ffffff',
            })
        badge_to_ribbon[prisma_product['badge']] = ribbon.id
```

## Category models

### Simple string category

```prisma
model Product {
    category String
}
```

Create `product.public.category` records on-the-fly during import:

```python
categories_map = {}
for p in seed:
    if p['category'] not in categories_map:
        cat = env['product.public.category'].search([('name', '=', p['category'])], limit=1)
        if not cat:
            cat = env['product.public.category'].create({'name': p['category']})
        categories_map[p['category']] = cat.id
```

### Hierarchical categories

```prisma
model Category {
    id        String     @id
    name      String
    parentId  String?
    parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
    children  Category[] @relation("CategoryTree")
    products  Product[]
}
```

`product.public.category` has a `parent_id` field — direct mapping:

```python
# Two-pass: create all categories first without parents, then set parents
id_to_odoo = {}
for prisma_cat in categories:
    odoo_cat = env['product.public.category'].create({'name': prisma_cat['name']})
    id_to_odoo[prisma_cat['id']] = odoo_cat.id

for prisma_cat in categories:
    if prisma_cat['parentId']:
        env['product.public.category'].browse(id_to_odoo[prisma_cat['id']]).write({
            'parent_id': id_to_odoo[prisma_cat['parentId']],
        })
```

## User / authentication models

```prisma
model User {
    id       String @id
    email    String @unique
    password String
    role     String   // "admin", "editor"
}
```

Map to `res.users`:

| Prisma | Odoo |
|---|---|
| `email` | `login` and `email` |
| `password` | `password` (handled by Odoo's auth module) |
| `role = "admin"` | `groups_id` includes `base.group_system` |
| `role = "editor"` | `groups_id` includes `<brand>_web_catalog.group_content_editor` |

**Never import hashed passwords from Prisma.** Generate temporary passwords via `res.users._cr_uid_password = ...` or use the password reset flow. Odoo uses its own hash scheme (pbkdf2 by default).

## Media / file models

```prisma
model Media {
    id       String @id
    url      String   // Vercel Blob URL or S3 URL
    filename String
    mimetype String
    productId String?
}
```

Two options:

1. **Attach to product** directly via `image_1920` (primary image) + `product_template_image_ids` (gallery):

   ```python
   # Primary image
   product.image_1920 = base64.b64encode(requests.get(media['url']).content)

   # Gallery images
   for m in gallery_media:
       env['product.image'].create({
           'name': m['filename'],
           'product_tmpl_id': product.id,
           'image_1920': base64.b64encode(requests.get(m['url']).content),
       })
   ```

2. **Upload to ir.attachment** if the media is generic and not product-bound:

   ```python
   env['ir.attachment'].create({
       'name': media['filename'],
       'datas': base64.b64encode(requests.get(media['url']).content),
       'mimetype': media['mimetype'],
       'public': True,
   })
   ```

## Content models (blog posts, pages)

```prisma
model Post {
    id        String   @id
    slug      String   @unique
    title     String
    content   String   // Markdown or HTML
    published Boolean
    author    User
    category  String?
}
```

Map to `website.blog.post` if the user wants a blog (requires `website_blog` dependency):

| Prisma | Odoo |
|---|---|
| `slug` | `website_url` (auto-generated from `name`) or manual `name` cleanup |
| `title` | `name` |
| `content` | `content` (HTML field) |
| `published` | `is_published` |
| `author` | `author_id` (`res.partner`) |
| `category` | `tag_ids` → `website.blog.tag` |

If the user doesn't want `website_blog`, create a custom `<brand>.web.post` model instead — but that's usually overkill.

## Verifying field existence

Before finalizing any mapping, verify the Odoo field exists in the installed version:

```bash
docker compose exec web odoo shell -d <db>
```

```python
>>> env['product.template']._fields.keys()
# dict_keys(['id', 'name', 'sequence', 'description', 'description_sale', ...])

# Check a specific field's definition
>>> env['product.template']._fields['is_published']
<odoo.fields.Boolean object>

# Confirm the dependency chain
>>> env['ir.module.module'].search([('name', '=', 'website_sale')]).state
'installed'
```

If `is_published` is missing, `website_sale` isn't installed — add it to `depends` or pick an alternative mapping.

## Fields to NEVER re-add

These fields already exist on `product.template` in a stock Odoo 18 install. If a mapping sends you looking for them, use the existing field — do NOT create a duplicate.

```
name, description, description_sale, description_purchase, description_pickingin,
description_pickingout, description_picking, list_price, standard_price,
categ_id, default_code, barcode, active, sale_ok, purchase_ok, type,
image_1920, image_1024, image_512, image_256, image_128, can_image_1024_be_zoomed,
public_categ_ids, is_published, website_ribbon_id, website_sequence, website_url,
website_id, website_meta_title, website_meta_description, website_meta_keywords,
website_meta_og_img, website_description, alternative_product_ids,
accessory_product_ids, product_template_image_ids, currency_id, qty_available,
virtual_available, company_id, create_date, create_uid, write_date, write_uid
```

Run `env['product.template']._fields.keys()` in any doubt.
