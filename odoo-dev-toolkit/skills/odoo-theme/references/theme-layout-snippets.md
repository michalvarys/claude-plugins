# Odoo 18 Theme: Layout, Snippets & Pages

## Header Inheritance (views/layout.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<!-- Custom Header -->
<template id="brand_header" inherit_id="website.layout"
          name="Brand Header" active="True" customize_show="True">
    <xpath expr="//header//nav" position="replace">
        <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #1B1B1B;">
            <div class="container">
                <!-- Logo -->
                <a class="navbar-brand" href="/">
                    <img t-att-src="'/theme_brandname/static/src/img/logo.svg'"
                         alt="Brand Name" height="45"/>
                </a>

                <!-- Mobile toggle -->
                <button class="navbar-toggler" type="button"
                        data-bs-toggle="offcanvas" data-bs-target="#brand_mobile_menu">
                    <span class="navbar-toggler-icon"/>
                </button>

                <!-- Desktop menu -->
                <div class="collapse navbar-collapse justify-content-end d-none d-lg-flex">
                    <ul class="navbar-nav">
                        <t t-foreach="website.menu_id.child_id" t-as="submenu">
                            <li class="nav-item">
                                <a class="nav-link brand_nav_link"
                                   t-att-href="submenu.clean_url()"
                                   t-out="submenu.name"/>
                            </li>
                        </t>
                    </ul>
                </div>

                <!-- Mobile offcanvas menu -->
                <div class="offcanvas offcanvas-end brand_mobile_menu d-lg-none"
                     id="brand_mobile_menu" tabindex="-1"
                     style="background-color: #1B1B1B;">
                    <div class="offcanvas-header">
                        <img t-att-src="'/theme_brandname/static/src/img/logo.svg'"
                             alt="Brand" height="35"/>
                        <button type="button" class="btn-close btn-close-white"
                                data-bs-dismiss="offcanvas"/>
                    </div>
                    <div class="offcanvas-body">
                        <ul class="navbar-nav">
                            <t t-foreach="website.menu_id.child_id" t-as="submenu">
                                <li class="nav-item">
                                    <a class="nav-link"
                                       t-att-href="submenu.clean_url()"
                                       t-out="submenu.name"/>
                                </li>
                            </t>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    </xpath>
</template>

<!-- Optional: Top Bar (desktop only) -->
<template id="brand_topbar" inherit_id="website.layout"
          name="Brand Top Bar" active="True" customize_show="True">
    <xpath expr="//header//nav" position="before">
        <div class="brand_topbar d-none d-md-block">
            <div class="container d-flex justify-content-between">
                <div>
                    <i class="fa fa-map-marker me-1"/>
                    <span>Adresa 123, Praha</span>
                    <span class="mx-2">|</span>
                    <i class="fa fa-phone me-1"/>
                    <a href="tel:+420123456789">+420 123 456 789</a>
                </div>
                <div>
                    <a href="#" class="me-3"><i class="fa fa-facebook"/></a>
                    <a href="#" class="me-3"><i class="fa fa-instagram"/></a>
                    <a href="#"><i class="fa fa-youtube-play"/></a>
                </div>
            </div>
        </div>
    </xpath>
</template>

<!-- Custom Footer -->
<template id="brand_footer" inherit_id="website.layout"
          name="Brand Footer" active="True" customize_show="True">
    <xpath expr="//div[@id='footer']" position="replace">
        <div id="footer" class="brand_footer o_cc o_cc5 py-5">
            <div class="container">
                <div class="row">
                    <!-- About column -->
                    <div class="col-lg-3 col-md-6 mb-4">
                        <img t-att-src="'/theme_brandname/static/src/img/logo.svg'"
                             alt="Brand" height="40" class="mb-3"/>
                        <p class="small" style="color: rgba(255,255,255,0.7);">
                            Short description of the business.
                        </p>
                    </div>

                    <!-- Quick links -->
                    <div class="col-lg-3 col-md-6 mb-4">
                        <h6 class="text-uppercase mb-3">Menu</h6>
                        <ul class="brand_footer_links">
                            <t t-foreach="website.menu_id.child_id" t-as="submenu">
                                <li class="mb-2">
                                    <a t-att-href="submenu.clean_url()"
                                       t-out="submenu.name"/>
                                </li>
                            </t>
                        </ul>
                    </div>

                    <!-- Contact info -->
                    <div class="col-lg-3 col-md-6 mb-4">
                        <h6 class="text-uppercase mb-3">Kontakt</h6>
                        <ul class="brand_contact_list">
                            <li>
                                <i class="fa fa-map-marker"/>
                                <span>Adresa 123<br/>Praha</span>
                            </li>
                            <li>
                                <i class="fa fa-phone"/>
                                <a href="tel:+420123456789">+420 123 456 789</a>
                            </li>
                            <li>
                                <i class="fa fa-envelope"/>
                                <a href="mailto:info@brand.cz">info@brand.cz</a>
                            </li>
                        </ul>
                    </div>

                    <!-- Social / Map -->
                    <div class="col-lg-3 col-md-6 mb-4">
                        <h6 class="text-uppercase mb-3">Sledujte nás</h6>
                        <div class="brand_social_icons">
                            <a href="#"><i class="fa fa-facebook"/></a>
                            <a href="#"><i class="fa fa-instagram"/></a>
                            <a href="#"><i class="fa fa-youtube-play"/></a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Copyright bar -->
            <div class="o_footer_copyright py-3 mt-4"
                 style="border-top: 1px solid rgba(255,255,255,0.1);">
                <div class="container text-center small"
                     style="color: rgba(255,255,255,0.5);">
                    © <t t-esc="datetime.date.today().year"/> Brand Name.
                    Všechna práva vyhrazena.
                </div>
            </div>
        </div>
    </xpath>
</template>

</odoo>
```

**Header/Footer gotchas:**
- Odoo JS strips custom classes from `header#top` — never rely on inline classes, use SCSS
- Mobile offcanvas should be moved to body via JS to avoid z-index/transform conflicts
- Use `t-foreach="website.menu_id.child_id"` for menu iteration (NOT hardcoded links)
- Footer must keep `id="footer"` and copyright must keep `class="o_footer_copyright"`

## Mobile Menu JS (static/src/js/mobile_menu.js)

```javascript
/** @odoo-module **/

import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.BrandMobileMenu = publicWidget.Widget.extend({
    selector: '#brand_mobile_menu',

    start() {
        this._super(...arguments);
        // Move offcanvas from header to body to avoid z-index issues
        // caused by header transform/sticky positioning
        document.body.appendChild(this.el);
    },
});
```

## Snippet Pattern

### Individual Snippet File (views/snippets/s_hero_banner.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="s_hero_banner" name="Brand Hero Banner">
    <section class="brand_hero o_cc o_cc5 position-relative d-flex align-items-center"
             style="min-height: 85vh; background-image: url('/theme_brandname/static/src/img/content/hero.jpg'); background-size: cover; background-position: center;">
        <!-- Overlay -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(123,45,95,0.4));"/>
        <div class="container position-relative text-center text-white">
            <h1 style="font-size: 3.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">Brand Name</h1>
            <p class="mb-4" style="font-size: 1.2rem; color: rgba(255,255,255,0.85);">
                Tagline or subtitle here
            </p>
            <a href="/about" class="brand_btn_primary me-2">O nás</a>
            <a href="/contact" class="brand_btn_outline" style="border-color: #fff; color: #fff;">Kontakt</a>
        </div>
    </section>
</template>

</odoo>
```

### Static Preview Snippet (e.g., pricing preview)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="s_pricing_preview" name="Brand Pricing Preview">
    <section class="brand_pricing_preview py-5 o_cc o_cc1">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="brand_section_title brand_title_accent">Ceník</h2>
                <p class="brand_section_subtitle">Aktuální ceník služeb</p>
            </div>
            <div class="row g-4 justify-content-center">
                <!-- Card 1 -->
                <div class="col-lg-6 col-md-6">
                    <div class="brand_card text-center p-4 h-100">
                        <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #7B2D5F; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i class="fa fa-bolt fa-2x text-white"/>
                        </div>
                        <h4>Služba A</h4>
                        <p class="text-muted small mb-3">Popis služby</p>
                        <div class="mb-3">
                            <span style="font-size: 2rem; font-weight: 700; color: #333;">190 Kč</span>
                            <span class="text-muted"> / vstup</span>
                        </div>
                        <ul class="list-unstyled small text-muted mb-4">
                            <li class="mb-1"><i class="fa fa-check text-success me-2"/>Položka 1</li>
                            <li class="mb-1"><i class="fa fa-check text-success me-2"/>Položka 2</li>
                        </ul>
                        <a href="/pricing" class="brand_btn_outline">Kompletní ceník</a>
                    </div>
                </div>
                <!-- Card 2 -->
                <div class="col-lg-6 col-md-6">
                    <div class="brand_card text-center p-4 h-100" style="border: 2px solid #7B2D5F;">
                        <div style="width: 70px; height: 70px; border-radius: 50%; background-color: #E91E63; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i class="fa fa-heart fa-2x text-white"/>
                        </div>
                        <h4>Služba B</h4>
                        <p class="text-muted small mb-3">Popis služby</p>
                        <div class="mb-3">
                            <span style="font-size: 2rem; font-weight: 700; color: #333;">390 Kč</span>
                            <span class="text-muted"> / vstup</span>
                        </div>
                        <ul class="list-unstyled small text-muted mb-4">
                            <li class="mb-1"><i class="fa fa-check text-success me-2"/>Položka 1</li>
                            <li class="mb-1"><i class="fa fa-check text-success me-2"/>Položka 2</li>
                        </ul>
                        <a href="/pricing" class="brand_btn_primary">Kompletní ceník</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

</odoo>
```

### Simple CTA Snippet with button

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="s_schedule_preview" name="Brand Schedule Preview">
    <section class="brand_schedule_preview py-5 o_cc o_cc3">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="brand_section_title brand_title_accent">Rozvrh</h2>
                <p class="brand_section_subtitle">Nabídka lekcí a služeb</p>
            </div>
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <div class="brand_card p-5">
                        <i class="fa fa-calendar fa-3x mb-3" style="color: #7B2D5F;"/>
                        <h3>Aktuální rozvrh</h3>
                        <p class="text-muted mb-4">
                            Prohlédněte si aktuální rozvrh online.
                        </p>
                        <a href="/schedule" class="btn brand_btn_primary">Zobrazit rozvrh</a>
                    </div>
                </div>
            </div>
            <!-- Info cards row -->
            <div class="row mt-4 g-3 justify-content-center">
                <div class="col-md-4 text-center">
                    <div class="brand_card p-4">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background-color: rgba(123,45,95,0.15); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i class="fa fa-bolt fa-2x" style="color: #7B2D5F;"/>
                        </div>
                        <h5>Služba A</h5>
                        <p class="text-muted small">Krátký popis</p>
                    </div>
                </div>
                <div class="col-md-4 text-center">
                    <div class="brand_card p-4">
                        <div style="width: 60px; height: 60px; border-radius: 50%; background-color: rgba(233,30,99,0.15); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                            <i class="fa fa-heart fa-2x" style="color: #E91E63;"/>
                        </div>
                        <h5>Služba B</h5>
                        <p class="text-muted small">Krátký popis</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

</odoo>
```

## One-page scroll spy widget (static/src/js/main.js)

On a one-page site, Odoo marks ALL anchor nav links as `.active` (see `theme-scss-architecture.md` → "One-page navigation"). This `publicWidget` uses IntersectionObserver to apply a custom class only to the link whose target section is currently in the viewport.

```javascript
/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.BrandScrollSpy = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    disabledInEditableMode: true,

    start() {
        this._super(...arguments);
        // Collect ALL nav links with anchor fragments (desktop + mobile copies)
        this._navLinks = [...document.querySelectorAll(
            'header .navbar-nav .nav-link[href*="#"], header .navbar-nav a[href*="#"]'
        )];
        if (!this._navLinks.length) {
            return;
        }

        // Map each section element → array of links pointing to it
        // (array because desktop + mobile navs duplicate links)
        this._sectionMap = new Map();
        for (const link of this._navLinks) {
            const href = link.getAttribute('href');
            const hash = href.includes('#') ? href.split('#')[1] : null;
            if (hash) {
                const section = document.getElementById(hash);
                if (section) {
                    if (!this._sectionMap.has(section)) {
                        this._sectionMap.set(section, []);
                    }
                    this._sectionMap.get(section).push(link);
                }
            }
        }
        if (!this._sectionMap.size) {
            return;
        }

        this._activeLinks = [];
        this._observer = new IntersectionObserver(
            (entries) => this._onIntersect(entries),
            { rootMargin: '-20% 0px -60% 0px' },
        );
        for (const section of this._sectionMap.keys()) {
            this._observer.observe(section);
        }
    },

    destroy() {
        if (this._observer) {
            this._observer.disconnect();
        }
        this._activeLinks.forEach(l => l.classList.remove('brand-scrollspy-active'));
        this._super(...arguments);
    },

    _onIntersect(entries) {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const links = this._sectionMap.get(entry.target);
                if (!links) continue;
                this._activeLinks.forEach(l => l.classList.remove('brand-scrollspy-active'));
                links.forEach(l => l.classList.add('brand-scrollspy-active'));
                this._activeLinks = links;
            }
        }
    },
});
```

**Key details:**
- `rootMargin: '-20% 0px -60% 0px'` — activates when a section enters the top 20–40% of the viewport (adjust to taste)
- Uses a `Map<Element, Link[]>` (not `Map<Element, Link>`) because Odoo's responsive header often duplicates nav links for desktop and mobile menus — both copies need the active class
- The CSS class is `brand-scrollspy-active` (not `.active`) — see `theme-scss-architecture.md` for the SCSS side
- `disabledInEditableMode: true` prevents the observer from running in the website editor
- Replace `brand-scrollspy-active` with `<brand>-scrollspy-active` (e.g. `gl-scrollspy-active`) matching your theme prefix

**Smooth scroll companion widget** — pair the scroll spy with a smooth-scroll handler for anchor clicks:

```javascript
publicWidget.registry.BrandSmoothScroll = publicWidget.Widget.extend({
    selector: '#wrapwrap',
    events: {
        'click a[href^="#"]': '_onAnchorClick',
    },

    _onAnchorClick(ev) {
        const href = ev.currentTarget.getAttribute('href');
        if (!href || href === '#') {
            return;
        }
        const target = document.querySelector(href);
        if (target) {
            ev.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    },
});
```

## Snippet Registration (views/snippets/snippets_registry.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>

<template id="brand_snippets" inherit_id="website.snippets" name="Brand Snippets">
    <xpath expr="//snippets[@id='snippet_structure']" position="after">
        <snippets id="brand_snippets_group" string="Brand Name">
            <t t-snippet="theme_brandname.s_hero_banner"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_hero_banner.png"/>
            <t t-snippet="theme_brandname.s_about_section"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_about_section.png"/>
            <t t-snippet="theme_brandname.s_pricing_preview"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_pricing_preview.png"/>
            <t t-snippet="theme_brandname.s_schedule_preview"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_schedule_preview.png"/>
            <t t-snippet="theme_brandname.s_contact_section"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_contact_section.png"/>
            <t t-snippet="theme_brandname.s_cta_section"
               t-thumbnail="/theme_brandname/static/src/img/icons/s_cta_section.png"/>
        </snippets>
    </xpath>
</template>

</odoo>
```

**Snippet registration rules:**
- Inherits `website.snippets` with xpath targeting `//snippets[@id='snippet_structure']`
- Use `position="after"` to add a new group AFTER the default structure snippets
- Each group needs its own `<snippets id="..." string="...">` wrapper element
- **Leaf element MUST be `<t t-snippet="..." t-thumbnail="..."/>`** — NOT `<snippet t-snippet="..." string="...">`. The wrong form parses without error but registers the snippet in a broken state where the editor shows "This block cannot be dropped anywhere on the page."
- `t-snippet` must use full module-qualified ID: `theme_brandname.s_name`
- Thumbnails are PNG/SVG images (~200×150px) in `static/src/img/icons/` or `static/src/img/snippets/`
- `snippets_registry.xml` MUST be loaded AFTER individual snippet files in manifest `data:`
- `string` attribute on `<snippets>` defines the group name in the website editor sidebar

**DO NOT add custom drop-zone rules for plain `<section>` snippets.** Odoo's built-in rule `so_snippet_addition_selector = "section, .parallax, .s_hr"` already handles any `<section>`-based snippet. Adding your own `data-selector` / `data-drop-in` / `data-drop-near` entry will conflict with the built-in rule and the editor will refuse to drop your snippet anywhere:

```xml
<!-- WRONG — custom drop-zone rule; conflicts with the built-in section rule -->
<xpath expr="." position="inside">
    <div data-js="MySnippet"
         data-selector=".s_arena_hero"
         data-drop-in="#wrap"
         data-drop-near="section"/>
</xpath>
```

**WRONG xpath patterns (cause silent failure or missing snippets):**
```xml
<!-- WRONG: targeting div instead of snippets element -->
<xpath expr="//div[@id='snippet_structure']//t[@t-snippet]" position="before">

<!-- WRONG: position="inside" on //snippets without specifying which one -->
<xpath expr="//snippets" position="inside">

<!-- WRONG: <snippet> wrapper element instead of <t t-snippet> —
     parses fine but snippet becomes undroppable in the editor -->
<snippet t-snippet="theme_brandname.s_hero_banner" string="Hero Banner"/>
```

**Editor-created pages vs hand-crafted pages.** If your theme scopes all SCSS under a page-level class (e.g. `.my-theme`), snippets dropped into editor-created pages (`+ New → Page`) will render unstyled because those pages use `<div id="wrap" class="oe_structure oe_empty">` with no theme class. Add a body-level scope fallback — see `theme-scss-architecture.md` → "Scoping theme styles for editor-created pages".

## Page Pattern (views/pages.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data>

<!-- About page template -->
<template id="brand_page_about" name="Brand About Page">
    <t t-call="website.layout">
        <t t-set="additional_title">O nás | Brand Name</t>
        <t t-set="meta_description">Popis stránky pro SEO.</t>

        <div id="wrap" class="oe_structure oe_empty">
            <!-- Sub-banner -->
            <section class="brand_sub_banner o_cc o_cc5 py-5 position-relative"
                     style="background-image: url('/theme_brandname/static/src/img/content/about-bg.jpg'); background-size: cover;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6);"/>
                <div class="container position-relative text-center text-white">
                    <h1>O nás</h1>
                </div>
            </section>

            <!-- Page content sections -->
            <section class="py-5 o_cc o_cc1 o_colored_level">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-6">
                            <h2 class="brand_section_title">Náš příběh</h2>
                            <p>Text here...</p>
                        </div>
                        <div class="col-lg-6">
                            <img src="/theme_brandname/static/src/img/content/about.jpg"
                                 class="img-fluid rounded" alt="O nás"/>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </t>
</template>

<!-- Page record -->
<record id="brand_page_about_page" model="theme.website.page">
    <field name="url">/about</field>
    <field name="view_id" ref="brand_page_about"/>
    <field name="is_published" eval="True"/>
</record>

<!-- Contact page template -->
<template id="brand_page_contact" name="Brand Contact Page">
    <t t-call="website.layout">
        <t t-set="additional_title">Kontakt | Brand Name</t>

        <div id="wrap" class="oe_structure oe_empty">
            <section class="brand_sub_banner o_cc o_cc5 py-5 position-relative"
                     style="background-image: url('/theme_brandname/static/src/img/content/contact-bg.jpg'); background-size: cover;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6);"/>
                <div class="container position-relative text-center text-white">
                    <h1>Kontakt</h1>
                </div>
            </section>

            <section class="py-5 o_cc o_cc1 o_colored_level">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-6">
                            <h3>Kontaktujte nás</h3>
                            <!-- Contact form or info -->
                        </div>
                        <div class="col-lg-6">
                            <!-- Map embed -->
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </t>
</template>

<record id="brand_page_contact_page" model="theme.website.page">
    <field name="url">/contact</field>
    <field name="view_id" ref="brand_page_contact"/>
    <field name="is_published" eval="True"/>
</record>

</data>
</odoo>
```

**Page rules:**
- `<template>` + `<record>` in same file → MUST wrap in `<data>`
- `theme.website.page` has NO `key` field — just `url`, `view_id`, `is_published`
- `<div id="wrap" class="oe_structure oe_empty">` required for website editor compatibility
- Use `t-set="additional_title"` for page title (appended to website name)
- Sub-banner sections create consistent page headers across the site

## Homepage Page Conflict (CRITICAL)

When a theme creates a page with `url="/"`, Odoo may show the **default empty `website.homepage`** instead of the theme's homepage. This happens because:

1. `website.homepage` (default Odoo page) has `website_page` records at lower IDs
2. Theme's `ha_page_home_page` creates a third `website_page` with `url="/"` at a higher ID
3. Odoo resolves `/` by taking the page with the **lowest ID** for the given website

**Diagnosis:**
```sql
SELECT wp.id, wp.url, wp.website_id, v.key
FROM website_page wp
JOIN ir_ui_view v ON v.id = wp.view_id
WHERE wp.url = '/'
ORDER BY wp.id;
```

Typical result (broken):
```
 id | url | website_id |              key
----+-----+------------+-------------------------------
  2 | /   |     (null) | website.homepage      ← empty default (global)
  4 | /   |          1 | website.homepage      ← empty default (website-specific)
  8 | /   |          1 | theme_brand.page_home ← our page with snippets (IGNORED!)
```

**Fix: Delete conflicting default homepage pages:**
```sql
DELETE FROM website_page WHERE url = '/' AND view_id IN (
    SELECT id FROM ir_ui_view WHERE key = 'website.homepage'
);
```

**Prevention in the theme module:**
The cleanest approach is to NOT create a separate homepage page at all, but instead override `website.homepage` view via inheritance in the theme's `pages.xml`. However, in `theme_*` modules this gets auto-converted to `theme.ir.ui.view`, so direct `ir.ui.view` override is not possible.

**Recommended approach:**
1. Create the homepage as `theme.website.page` with `url="/"`
2. After theme installation, run cleanup in the post-copy hook model:

```python
class ThemeBrandName(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_brandname_post_copy(self, mod):
        # Remove default homepage pages that conflict with theme homepage
        default_pages = self.env['website.page'].search([
            ('url', '=', '/'),
            ('view_id.key', '=', 'website.homepage'),
            ('website_id', '=', self.env['website'].get_current_website().id),
        ])
        if default_pages:
            default_pages.unlink()
```

## Settings Companion Module Pattern

Create a separate `settings_*` module for website configuration that is NOT a theme module (no `theme_*` prefix, so no auto-conversion):

```
project_dir/
├── theme_brandname/       # Theme module (auto-converts to theme.* models)
└── settings_brandname/    # Settings module (regular ir.* models)
    ├── __init__.py        # empty
    ├── __manifest__.py
    └── data/
        └── website_config_data.xml
```

**`settings_brandname/__manifest__.py`:**
```python
{
    'name': 'Brand Settings',
    'summary': 'Base configuration: languages, company info, website settings',
    'category': 'Website',
    'version': '18.0.1.0.0',
    'license': 'LGPL-3',
    'depends': ['website'],
    'data': ['data/website_config_data.xml'],
    'installable': True,
}
```

**`settings_brandname/data/website_config_data.xml`:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <!-- Activate languages -->
    <function model="res.lang" name="write">
        <value model="res.lang" search="[('code', 'in', ['cs_CZ', 'de_DE', 'ru_RU'])]"/>
        <value eval="{'active': True}"/>
    </function>

    <!-- Install translations (Odoo 18: uses 'lang_ids' Many2many, NOT 'lang') -->
    <record id="install_cs" model="base.language.install">
        <field name="lang_ids" eval="[(6, 0, [ref('base.lang_cs')])]"/>
        <field name="overwrite" eval="False"/>
    </record>
    <function model="base.language.install" name="lang_install">
        <value eval="[ref('install_cs')]"/>
    </function>

    <!-- Configure website languages -->
    <record id="website.default_website" model="website">
        <field name="default_lang_id" ref="base.lang_cs"/>
        <field name="language_ids" eval="[(6, 0, [
            ref('base.lang_cs'),
            ref('base.lang_de'),
            ref('base.lang_ru'),
            ref('base.lang_en'),
        ])]"/>
    </record>

</data>
</odoo>
```

**Why a separate module?**
- `theme_*` modules auto-convert `<record model="ir.*">` to `theme.ir.*` — this breaks non-theme records like `res.lang`, `website`, etc.
- Settings module uses standard `ir.*` models, so language activation and website config work correctly
- Theme module depends on settings module to ensure languages are ready before theme pages load

---

## Admin menu XML IDs (CRITICAL)

When adding menu items for theme models (hero slides, gallery, etc.), the parent menu XML ID matters. The Website module has **two** similar-sounding XML IDs:

| XML ID | Actual menu | What it is |
|---|---|---|
| `website.menu_website_configuration` | **Website** (top-level) | The root Website app menu |
| `website.menu_website_global_configuration` | **Website > Configuration** | The Configuration submenu |

**Always use `website.menu_website_global_configuration`** for theme admin menus:

```xml
<menuitem id="menu_gelato_gallery_image"
    name="Gallery"
    parent="website.menu_website_global_configuration"
    action="action_gelato_gallery_image"
    sequence="51"/>
```

Using `menu_website_configuration` places the item at the top level of the Website app, where it appears invisible because it has no parent group in the menu dropdown. The item exists in the database but users cannot find it in the UI.

**Diagnosis:** If menu items are missing from the Configuration dropdown, check `parent_id` in the database:

```sql
SELECT m.id, m.name::text, m.parent_id, p.name::text
FROM ir_ui_menu m
LEFT JOIN ir_ui_menu p ON m.parent_id = p.id
WHERE m.name::text ILIKE '%gallery%' OR m.name::text ILIKE '%hero%';
```

If `parent_id` points to the top-level Website menu (the one with no parent), fix the XML to use `menu_website_global_configuration`.
