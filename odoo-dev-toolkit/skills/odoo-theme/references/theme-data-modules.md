# Odoo 18 Theme: Companion Data Modules

Companion data modules provide database-backed dynamic content (pricing tables, class schedules, service catalogs) that the theme displays via controllers + QWeb templates.

## Architecture Pattern

```
brandname_pricing/                   # Standalone installable module
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── pricing.py
├── views/
│   └── pricing_views.xml            # Backend admin views
├── controllers/
│   ├── __init__.py
│   └── main.py                      # Website routes
├── security/
│   └── ir.model.access.csv
├── data/
│   └── pricing_data.xml             # Initial data records
├── static/src/scss/
│   └── pricing.scss                 # Page-specific styles
└── views/
    └── pricing_templates.xml        # Frontend QWeb templates
```

## Model Pattern — Pricing Module

```python
# models/pricing.py
from odoo import models, fields


class BrandPriceCategory(models.Model):
    _name = 'brand.price.category'
    _description = 'Price Category'
    _order = 'sequence, id'

    name = fields.Char(required=True)
    subtitle = fields.Char()
    sequence = fields.Integer(default=10)
    studio_id = fields.Many2one('brand.studio', string='Studio')
    item_ids = fields.One2many('brand.price.item', 'category_id', string='Price Items')
    icon = fields.Char(string='Icon CSS Class', default='fa fa-tag')
    color = fields.Char(string='Color Hex', default='#7B2D5F')
    has_student_prices = fields.Boolean(default=False)


class BrandPriceItem(models.Model):
    _name = 'brand.price.item'
    _description = 'Price Item'
    _order = 'sequence, id'

    name = fields.Char(required=True)
    category_id = fields.Many2one('brand.price.category', required=True, ondelete='cascade')
    sequence = fields.Integer(default=10)
    price = fields.Float(string='Price (Kč)')
    student_price = fields.Float(string='Student Price (Kč)')
    price_per_unit = fields.Char(string='Per Unit Label')      # e.g., "/ vstup", "/ měs."
    savings = fields.Char(string='Savings Note')                # e.g., "Ušetříte 200 Kč"
    column_group = fields.Selection([
        ('single', 'Single Entry'),
        ('entries', 'Entry Packages'),
        ('monthly', 'Monthly'),
    ], default='single')
    is_highlighted = fields.Boolean(default=False)
    multisport_eligible = fields.Boolean(default=False)
    note = fields.Char()
```

## Model Pattern — Schedule Module

```python
# models/schedule.py
from odoo import models, fields


class BrandStudio(models.Model):
    _name = 'brand.studio'
    _description = 'Studio'
    _order = 'sequence, id'

    name = fields.Char(required=True)
    sequence = fields.Integer(default=10)
    color = fields.Char(string='Color Hex', default='#7B2D5F')
    supports_multisport = fields.Boolean(default=False)
    requires_reservation = fields.Boolean(default=False)
    image = fields.Image(string='Studio Image', max_width=1920, max_height=1080)
    description = fields.Html(string='Description', sanitize_style=True)
    class_ids = fields.One2many('brand.schedule.class', 'studio_id', string='Classes')


class BrandClassType(models.Model):
    _name = 'brand.class.type'
    _description = 'Class Type'
    _order = 'name'

    name = fields.Char(required=True)
    category_group = fields.Selection([
        ('kondicni', 'Kondiční'),
        ('bodymind', 'Body & Mind'),
        ('walking', 'Walking'),
        ('pilates', 'Pilates Studio'),
        ('yoga', 'Yoga'),
        ('choreo', 'Choreo'),
    ], required=True)
    color = fields.Char(string='Color Hex')
    duration_minutes = fields.Integer(default=50)
    intensity = fields.Selection([
        ('low', 'Nízká'),
        ('medium', 'Střední'),
        ('high', 'Vysoká'),
    ], default='medium')
    website_description = fields.Html(string='Website Description', sanitize_style=True)


class BrandScheduleClass(models.Model):
    _name = 'brand.schedule.class'
    _description = 'Scheduled Class'
    _order = 'day_of_week, time_start'

    class_type_id = fields.Many2one('brand.class.type', required=True, ondelete='cascade')
    studio_id = fields.Many2one('brand.studio', required=True, ondelete='cascade')
    schedule_type = fields.Selection([
        ('recurring', 'Recurring Weekly'),
        ('one_time', 'One Time'),
    ], default='recurring')
    day_of_week = fields.Selection([
        ('0', 'Pondělí'),
        ('1', 'Úterý'),
        ('2', 'Středa'),
        ('3', 'Čtvrtek'),
        ('4', 'Pátek'),
        ('5', 'Sobota'),
        ('6', 'Neděle'),
    ], required=True)
    specific_date = fields.Date(string='Specific Date')
    time_start = fields.Float(string='Start Time')   # 24h float: 9.5 = 09:30
    time_end = fields.Float(string='End Time')
    instructor = fields.Char()
    note = fields.Char()
```

## Controller Pattern

```python
# controllers/main.py
from odoo import http
from odoo.http import request


class BrandPricingController(http.Controller):

    @http.route('/pricing', type='http', auth='public', website=True, sitemap=True)
    def pricing_page(self, **kwargs):
        categories = request.env['brand.price.category'].sudo().search(
            [], order='sequence, id'
        )

        # Build color map for template
        cat_colors = {}
        for cat in categories:
            cat_colors[cat.id] = cat.color or '#7B2D5F'

        return request.render('brandname_pricing.pricing_page', {
            'categories': categories,
            'cat_colors': cat_colors,
        })


class BrandScheduleController(http.Controller):

    # Constants for Czech day names
    DAY_NAMES_CS = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle']

    CATEGORY_GROUP_COLORS = {
        'kondicni': '#E91E63',
        'bodymind': '#4CAF50',
        'walking': '#F9A825',
        'pilates': '#1976D2',
        'yoga': '#9C27B0',
        'choreo': '#00897B',
    }

    @http.route('/schedule', type='http', auth='public', website=True, sitemap=True)
    def schedule_page(self, **kwargs):
        studios = request.env['brand.studio'].sudo().search([], order='sequence')
        classes = request.env['brand.schedule.class'].sudo().search(
            [('schedule_type', '=', 'recurring')],
            order='day_of_week, time_start'
        )

        # Group classes by day and studio
        schedule_grid = {}
        for day_idx in range(7):
            schedule_grid[str(day_idx)] = {}
            for studio in studios:
                day_classes = classes.filtered(
                    lambda c: c.day_of_week == str(day_idx) and c.studio_id == studio
                )
                schedule_grid[str(day_idx)][studio.id] = day_classes

        return request.render('brandname_schedule.schedule_page', {
            'studios': studios,
            'schedule_grid': schedule_grid,
            'day_names': self.DAY_NAMES_CS,
            'category_colors': self.CATEGORY_GROUP_COLORS,
        })
```

## Template Pattern — Pricing Page

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="pricing_page" name="Pricing Page">
    <t t-call="website.layout">
        <t t-set="additional_title">Ceník | Brand Name</t>
        <t t-set="meta_description">Kompletní ceník služeb Brand Name.</t>

        <div id="wrap">
            <!-- Sub-banner -->
            <section class="brand_sub_banner o_cc o_cc5 py-5">
                <div class="container text-center text-white">
                    <h1>Ceník</h1>
                </div>
            </section>

            <!-- Pricing categories -->
            <t t-foreach="categories" t-as="category">
                <section class="py-5 o_cc o_cc1">
                    <div class="container">
                        <h3 class="mb-4" t-out="category.name"/>
                        <t t-if="category.subtitle">
                            <p class="text-muted" t-out="category.subtitle"/>
                        </t>

                        <!-- Standard pricing table -->
                        <div class="table-responsive">
                            <table class="table table-bordered text-center">
                                <thead>
                                    <tr t-att-style="'background-color: %s; color: #fff;' % cat_colors.get(category.id, '#7B2D5F')">
                                        <th class="text-start">Typ</th>
                                        <th>Cena</th>
                                        <th t-if="category.item_ids.filtered(lambda i: i.savings)">Ušetříte</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <t t-foreach="category.item_ids" t-as="item">
                                        <tr t-att-class="'table-warning' if item.is_highlighted else ''">
                                            <td class="text-start fw-bold" t-out="item.name"/>
                                            <td>
                                                <strong><t t-out="'%.0f' % item.price"/> Kč</strong>
                                                <t t-if="item.price_per_unit">
                                                    <small class="text-muted">
                                                        <t t-out="item.price_per_unit"/>
                                                    </small>
                                                </t>
                                            </td>
                                            <td t-if="category.item_ids.filtered(lambda i: i.savings)">
                                                <small class="text-success" t-out="item.savings"/>
                                            </td>
                                        </tr>
                                    </t>
                                </tbody>
                            </table>
                        </div>

                        <!-- Student pricing table (if applicable) -->
                        <t t-if="category.has_student_prices">
                            <div class="mt-4 p-3 rounded" style="background-color: #f8f9fa;">
                                <h5>Zvýhodněné ceny</h5>
                                <p class="text-muted small">
                                    Pro studenty (ISIC), do 18 let a Silver 60+
                                </p>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered text-center">
                                        <thead>
                                            <tr style="background-color: #6c757d; color: #fff;">
                                                <th class="text-start">Typ</th>
                                                <th>Zvýhodněná cena</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <t t-foreach="category.item_ids.filtered(lambda i: i.student_price > 0)" t-as="item">
                                                <tr>
                                                    <td class="text-start" t-out="item.name"/>
                                                    <td>
                                                        <strong><t t-out="'%.0f' % item.student_price"/> Kč</strong>
                                                    </td>
                                                </tr>
                                            </t>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </t>
                    </div>
                </section>
            </t>
        </div>
    </t>
</template>

</odoo>
```

## Data Records Pattern (data/pricing_data.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

<!-- Category 1 -->
<record id="price_cat_active" model="brand.price.category">
    <field name="name">Active &amp; Walking Studio</field>
    <field name="subtitle">Základní ceny vstupů a permanentek</field>
    <field name="sequence">10</field>
    <field name="icon">fa fa-bolt</field>
    <field name="color">#7B2D5F</field>
    <field name="has_student_prices" eval="True"/>
</record>

<!-- Items for Category 1 -->
<record id="price_item_active_single" model="brand.price.item">
    <field name="name">Jednorázový vstup</field>
    <field name="category_id" ref="price_cat_active"/>
    <field name="sequence">10</field>
    <field name="price">190</field>
    <field name="student_price">170</field>
    <field name="column_group">single</field>
</record>

<record id="price_item_active_10" model="brand.price.item">
    <field name="name">10 vstupů</field>
    <field name="category_id" ref="price_cat_active"/>
    <field name="sequence">20</field>
    <field name="price">1700</field>
    <field name="student_price">1500</field>
    <field name="price_per_unit">170 Kč / vstup</field>
    <field name="savings">Ušetříte 200 Kč</field>
    <field name="column_group">entries</field>
</record>

<record id="price_item_active_monthly" model="brand.price.item">
    <field name="name">1 měsíc</field>
    <field name="category_id" ref="price_cat_active"/>
    <field name="sequence">40</field>
    <field name="price">1990</field>
    <field name="student_price">1890</field>
    <field name="column_group">monthly</field>
    <field name="multisport_eligible" eval="True"/>
</record>

<!-- Category 2 -->
<record id="price_cat_pilates" model="brand.price.category">
    <field name="name">Pilates Studio (reformer)</field>
    <field name="subtitle">Cvičení na reformeru</field>
    <field name="sequence">20</field>
    <field name="icon">fa fa-heart</field>
    <field name="color">#E91E63</field>
    <field name="has_student_prices" eval="True"/>
</record>

<!-- Items for Category 2 -->
<record id="price_item_pilates_single" model="brand.price.item">
    <field name="name">Jednorázový vstup</field>
    <field name="category_id" ref="price_cat_pilates"/>
    <field name="sequence">10</field>
    <field name="price">390</field>
    <field name="student_price">370</field>
    <field name="column_group">single</field>
</record>

</data>
</odoo>
```

## Security Pattern (security/ir.model.access.csv)

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_brand_price_category_public,brand.price.category.public,model_brand_price_category,,1,0,0,0
access_brand_price_category_user,brand.price.category.user,model_brand_price_category,base.group_user,1,1,1,1
access_brand_price_item_public,brand.price.item.public,model_brand_price_item,,1,0,0,0
access_brand_price_item_user,brand.price.item.user,model_brand_price_item,base.group_user,1,1,1,1
access_brand_studio_public,brand.studio.public,model_brand_studio,,1,0,0,0
access_brand_studio_user,brand.studio.user,model_brand_studio,base.group_user,1,1,1,1
access_brand_class_type_public,brand.class.type.public,model_brand_class_type,,1,0,0,0
access_brand_class_type_user,brand.class.type.user,model_brand_class_type,base.group_user,1,1,1,1
access_brand_schedule_class_public,brand.schedule.class.public,model_brand_schedule_class,,1,0,0,0
access_brand_schedule_class_user,brand.schedule.class.user,model_brand_schedule_class,base.group_user,1,1,1,1
```

**Security rules:**
- Public users get read-only access (for website rendering)
- Internal users (`base.group_user`) get full CRUD
- Empty `group_id` = public access (no group required)
- Model ID format: `model_<model_name_with_underscores>` (dots → underscores)

## Manifest for Data Module

```python
# brandname_pricing/__manifest__.py
{
    'name': 'Brand Pricing',
    'version': '18.0.1.0.0',
    'depends': ['website'],
    'data': [
        'security/ir.model.access.csv',
        'views/pricing_views.xml',
        'views/pricing_templates.xml',
        'data/pricing_data.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'brandname_pricing/static/src/scss/pricing.scss',
        ],
    },
    'license': 'LGPL-3',
}
```

**Data module rules:**
- Depends on `website` (NOT on `theme_brandname` — the theme depends on the data module, not vice versa)
- Security CSV loaded FIRST in `data:` list
- Views before templates before data
- SCSS in `assets:` dict (data modules are NOT theme modules — no auto-conversion)
- Use standard `ir.ui.view` and `ir.asset` (NOT theme variants — only theme_* modules get auto-conversion)

## Integration: Theme ↔ Data Module

```
theme_brandname/
  depends: ['theme_common', 'website', 'brandname_pricing', 'brandname_schedule']
  ↓ creates preview snippets (s_pricing_preview, s_schedule_preview)
  ↓ snippets show STATIC sample data (not dynamic)
  ↓ link to /pricing, /schedule for full dynamic pages

brandname_pricing/
  depends: ['website']
  ↓ defines models + controllers + templates
  ↓ serves /pricing route with dynamic data from DB

brandname_schedule/
  depends: ['website']
  ↓ defines models + controllers + templates
  ↓ serves /schedule route with dynamic data from DB
```

**Key principle:** Theme snippets show STATIC preview data (hardcoded in XML). Dynamic data lives in companion modules rendered by controllers. This keeps the theme installable without data and allows data to be managed independently.

---

## In-theme dynamic content pattern (RPC widget)

For content that's tightly coupled to the theme (e.g., hero slides, gallery images), the model, controller, views, security, and JS can live **inside** the `theme_*` module itself rather than in a companion module. The snippet HTML contains an empty container, and a `publicWidget` fills it at runtime via JSON RPC.

### Model

```python
from odoo import fields, models

class GelatoGalleryImage(models.Model):
    _name = 'gelato.gallery.image'
    _description = 'Gelato Gallery Image'
    _order = 'sequence, id'

    name = fields.Char(string='Caption', required=True, translate=True)
    image = fields.Image(string='Image', required=True, max_width=1200, max_height=1200)
    sequence = fields.Integer(string='Sequence', default=10)
    active = fields.Boolean(default=True)
    website_id = fields.Many2one('website', string='Website', ondelete='cascade')
```

### Controller (JSON RPC endpoint)

```python
@http.route('/theme_<brand>/gallery_images', type='json', auth='public', website=True)
def get_gallery_images(self):
    website = request.website
    domain = [
        ('active', '=', True),
        '|', ('website_id', '=', False), ('website_id', '=', website.id),
    ]
    images = request.env['gelato.gallery.image'].sudo().search(domain, order='sequence, id')
    return [{
        'id': img.id,
        'name': img.name,
        'image_url': f'/web/image/gelato.gallery.image/{img.id}/image' if img.image else '',
    } for img in images]
```

### JS Widget (publicWidget + RPC)

```javascript
publicWidget.registry.GlGallery = publicWidget.Widget.extend({
    selector: '.gl-gallery',
    disabledInEditableMode: true,

    start() {
        this._super(...arguments);
        return this._loadImages();
    },

    async _loadImages() {
        let images;
        try {
            images = await rpc('/theme_<brand>/gallery_images', {});
        } catch { return; }
        if (!images || !images.length) return;

        const grid = this.el.querySelector('.gl-gallery-grid');
        if (!grid) return;
        grid.innerHTML = '';

        images.forEach((img) => {
            const item = document.createElement('div');
            item.className = 'gl-gallery-item';
            const imgEl = document.createElement('img');
            imgEl.src = img.image_url;
            imgEl.alt = img.name;
            imgEl.loading = 'lazy';
            item.appendChild(imgEl);
            grid.appendChild(item);
        });
    },
});
```

### Snippet XML (empty container)

```xml
<template id="s_<brand>_gallery" name="Gallery">
    <section class="s_<brand>_gallery gl-gallery o_cc o_cc4 theme_<brand>_page">
        <!-- Filled by JS via RPC -->
        <div class="gl-gallery-grid"/>
    </section>
</template>
```

### Security (ir.model.access.csv)

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_gelato_gallery_image_public,gelato.gallery.image.public,model_gelato_gallery_image,base.group_public,1,0,0,0
access_gelato_gallery_image_designer,gelato.gallery.image.designer,model_gelato_gallery_image,website.group_website_designer,1,1,1,1
```

**Two rows:** public read-only for the frontend RPC, full access for website designers in the admin.

### Seed data (noupdate)

```xml
<data noupdate="1">
    <record id="gallery_image_1" model="gelato.gallery.image">
        <field name="name">Caption here</field>
        <field name="image" type="base64" file="theme_<brand>/static/src/img/photo.webp"/>
        <field name="sequence">10</field>
    </record>
</data>
```

Use `noupdate="1"` so admin edits are preserved on module upgrade. Use `type="base64" file="..."` to load images from the static directory.

### Admin views

Place views in `views/<model>_views.xml` with:
- **List view** with `widget="handle"` on the sequence field for drag-reorder
- **Form view** with `widget="image"` for the image field
- **Menu item** under `website.menu_website_global_configuration`

### Manifest ordering

In `__manifest__.py` `data:` list:
1. `security/ir.model.access.csv`
2. `views/<model>_views.xml` (before pages)
3. Snippet files
4. `views/pages.xml`
5. `data/<model>_data.xml` (seed data, at the end)

---

## Contact form via mail.mail

For simple contact/inquiry forms that send email without creating leads:

### Controller

```python
@http.route('/gelato/contact', type='http', auth='public', website=True,
            methods=['POST'], csrf=True)
def contact_form(self, **kwargs):
    name = kwargs.get('name', '').strip()
    email = kwargs.get('email', '').strip()

    if not name or not email:
        return werkzeug.utils.redirect('/?form=error#poptavka')

    company = request.env['res.company'].sudo().browse(request.env.company.id)
    recipient = company.email or 'info@example.com'

    body = f"<h3>New inquiry</h3><p>From: {name} ({email})</p>"

    try:
        request.env['mail.mail'].sudo().create({
            'subject': f'Inquiry – {name}',
            'body_html': body,
            'email_from': email,
            'email_to': recipient,
            'auto_delete': True,
        }).send()
    except Exception:
        return werkzeug.utils.redirect('/?form=error#poptavka')

    return werkzeug.utils.redirect('/?form=ok#poptavka')
```

### Key points

- Add `'mail'` to `depends` in `__manifest__.py`
- Use `csrf=True` (Odoo injects the token automatically in QWeb forms via `<input type="hidden" name="csrf_token".../>`)
- **Redirect URL**: query params MUST come before hash fragment: `/?form=ok#section` not `/#section?form=ok` — the browser ignores everything after `#` in query parsing
- JS feedback widget reads `window.location.search` for `?form=ok|error`, shows a banner, then cleans the URL with `history.replaceState`
