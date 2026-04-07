# Static → Odoo Mapping Rules

Exhaustive mapping table from static-bundle constructs to Odoo 18 theme module constructs.

## HTML files → pages or layouts

| Static file | Odoo target | Notes |
|---|---|---|
| `index.html` | `theme.website.page` with `url="/"` | Post-copy hook must delete default `website.homepage` |
| `about.html` | `theme.website.page` with `url="/about"` | Plain page template |
| `products.html` | `theme.website.page` with `url="/products"` | If dynamic, replaces controller route — see `odoo-web-admin-bridge` |
| `contact.html` | `theme.website.page` with `url="/contact"` | Consider `website.contactus` override if form is standard |
| `404.html` | Override `website.page_404` via inheritance | Optional |
| `privacy-policy.html` | `theme.website.page` with `url="/privacy-policy"` | |

## HTML fragments → snippets and layouts

| Static HTML | Odoo target |
|---|---|
| `<header>...</header>` | `website.layout` inherit, xpath `//header//nav` position=replace |
| `<footer>...</footer>` | `website.layout` inherit, xpath `//div[@id='footer']` position=replace |
| `<section data-snippet="s_x">` | Standalone snippet template at `views/snippets/s_x.xml`, registered via `<t t-snippet/>` |
| `<body class="...">` | `website.layout` inherit, xpath `//body` position=attributes with `add="theme_<brand>_body"` |
| `<nav>` inside header | Part of header replacement; use `t-foreach="website.menu_id.child_id"` for links |
| `<main>` wrapper | Not needed — Odoo's `#wrap` is the main wrapper |
| `<aside>` for sidebar | If per-page, include inside page template; if global, include in `website.layout` inherit |

## CSS → SCSS files

| Static source | Odoo SCSS file | Bundle |
|---|---|---|
| `:root { --brand-primary: ... }` or equivalent | `primary_variables.scss` as `$o-website-values-palettes` | `web._assets_primary_variables` |
| Bootstrap variable overrides (`$border-radius`, `$btn-padding-x`) | `bootstrap_overridden.scss` | `web._assets_frontend_helpers` |
| `.brand-hero`, `.brand-card`, body, sections, buttons | `theme.scss` | `web.assets_frontend` |
| `.brand-header`, `.brand-nav`, mobile menu styles | `header.scss` | `web.assets_frontend` |
| `.brand-footer`, footer grid, social icons | `footer.scss` | `web.assets_frontend` |
| `@media (max-width: ...)` blocks | `responsive.scss` | `web.assets_frontend` (load last) |
| `@font-face` declarations | **NOT in SCSS** — inject into layout.xml `<head>` via `<link>` or `<style>` | n/a |

## Assets → static paths

| Static path | Odoo path |
|---|---|
| `img/logo.svg` | `theme_<brand>/static/src/img/logo.svg` |
| `img/hero.jpg` | `theme_<brand>/static/src/img/hero.jpg` |
| `img/products/item-1.jpg` | `theme_<brand>/static/src/img/products/item-1.jpg` |
| `fonts/brand-sans.woff2` | `theme_<brand>/static/src/fonts/brand-sans.woff2` |
| `audio/intro.mp3` | `theme_<brand>/static/src/audio/intro.mp3` |
| `js/main.js` | `theme_<brand>/static/src/js/main.js` |
| `data/products.json` | **Do not include** — dynamic data belongs in a data module (`odoo-web-admin-bridge`) |

URL references update rules:

| Static reference | Odoo reference |
|---|---|
| `src="img/hero.jpg"` | `t-att-src="'/theme_<brand>/static/src/img/hero.jpg'"` (in QWeb) |
| `src="img/hero.jpg"` | `src="/theme_<brand>/static/src/img/hero.jpg"` (in snippet template, plain) |
| `url('img/hero.jpg')` in CSS | `url('/theme_<brand>/static/src/img/hero.jpg')` in SCSS |
| `href="about.html"` | `href="/about"` |
| `href="#contact"` | `href="#contact"` (stays) |

## JavaScript → Odoo assets

**IMPORTANT:** All generated JS files MUST use `publicWidget.Widget` (not vanilla IIFE wrappers).
Odoo 18 manages widget lifecycle (init, destroy, editor mode) through `publicWidget` — raw
`DOMContentLoaded` / `(function(){})()` patterns bypass this and cause issues with the website
editor, hot-reload, and page transitions.

| Static pattern | Odoo target |
|---|---|
| `js/main.js` with vanilla event listeners | Rewrite as `publicWidget.registry.X = publicWidget.Widget.extend({ selector: '...', start() {...} })` in `static/src/js/main.js` |
| `js/main.js` using `@odoo-module` | Keep as an `/** @odoo-module **/` file — but ensure DOM widgets use `publicWidget.Widget.extend`, not raw event listeners |
| Inline `<script>` for pre-bundle work (preloader, audio unlock) | Inject into `website.layout` via xpath `//head` position=inside or `//body` position=inside |
| CDN scripts (GSAP, Vanta) | Inject `<script src="...">` into layout.xml `<head>` (inline — allows pre-bundle execution) |
| `publicWidget.registry.X` | Keep — it's the correct Odoo 18 pattern for DOM widgets |
| OWL components | Keep, mount against a hidden host element on DOMContentLoaded |

### publicWidget pattern (required)

```javascript
/** @odoo-module **/
import publicWidget from "@web/legacy/js/public/public_widget";

publicWidget.registry.BrandFeatureName = publicWidget.Widget.extend({
    selector: '.brand-feature-root',   // CSS selector the widget attaches to
    events: {
        'click .some-btn': '_onClick',  // delegated events (auto-cleaned on destroy)
    },

    start() {
        // DOM setup, fetch data, bind global listeners
        // Use this.el (the matched DOM element) instead of document.querySelector
        this._onResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._onResize);
        return this._super(...arguments);
    },

    destroy() {
        // Clean up global listeners (delegated events are auto-cleaned)
        window.removeEventListener('resize', this._onResize);
        this._super(...arguments);
    },

    _onClick(ev) { /* handler */ },
    _handleResize() { /* handler */ },
});
```

**Do NOT generate** vanilla patterns like:
```javascript
// ❌ WRONG — bypasses Odoo widget lifecycle
(function () {
    document.addEventListener('DOMContentLoaded', function () { ... });
})();
```

## Text content and translations

| Static construct | Odoo target |
|---|---|
| Hardcoded Czech text in HTML | Wrap in `<t t-esc>` with translated values, OR leave inline and rely on the `odoo-i18n` skill downstream |
| Text content inside snippets | Leave as-is in the `<template>` — Odoo's editor lets users translate inline |
| Labels on forms / buttons | Same — inline text is editable in the editor |

## Forms

| Static form | Odoo target |
|---|---|
| `<form action="/api/contact">` | Replace with `website.s_website_form` snippet or custom `<form>` with `action="/website/form/..."` and hidden `csrf_token` field |
| `<input type="email" name="email">` | Keep attributes; add `t-att-name` if using form snippet |
| Client-side JS form handling | Move to a controller in a companion module, OR use `website_form` module's built-in submit handler |

Forms are typically out of scope for `static-to-odoo-theme` — flag them to the user and suggest a companion module via `odoo-module-scaffold` or `odoo-web-admin-bridge`.

## Color combination (CC) classes

Every snippet needs a `o_cc o_cc<N>` class pair on its outer `<section>`. Pick the number based on the snippet's background intent:

| CC class | Intent | Typical background |
|---|---|---|
| `o_cc1` | Light primary | White / near-white |
| `o_cc2` | Light secondary | Very light gray |
| `o_cc3` | Accent light | Brand-tinted light |
| `o_cc4` | Accent brand | Full brand color |
| `o_cc5` | Dark | Near-black / dark brand |

Match the static bundle's background color to the closest CC slot and document the mapping in `primary_variables.scss` under the `$o-website-values-palettes` entry (see the `odoo-theme` skill for palette format).

## Dynamic content markers

If the static bundle contains placeholder data that was originally backed by a database (product cards, team members, event listings), mark each occurrence with a comment:

```xml
<section class="s_brand_products o_cc o_cc1 theme_<brand>_page">
    <!-- DYNAMIC: seeded from data/products.json — wire to product.template in odoo-web-admin-bridge skill -->
    <div class="brand-products__grid">
        <article class="brand-product-card">
            <img src="/theme_<brand>/static/src/img/products/item-1.jpg"/>
            <h3>Product 1</h3>
            <p class="brand-product-card__price">299 Kč</p>
        </article>
        <!-- ... -->
    </div>
</section>
```

This keeps the snippet visually complete and draggable, while making the dynamic wiring step obvious to the next skill in the pipeline.

## Menu structure

The static bundle's `<nav>` gives the menu structure. Emit it to `data/website_menu_data.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
<data noupdate="1">

    <record id="menu_home" model="theme.website.menu">
        <field name="name">Home</field>
        <field name="url">/</field>
        <field name="sequence">10</field>
    </record>
    <record id="menu_products" model="theme.website.menu">
        <field name="name">Products</field>
        <field name="url">/products</field>
        <field name="sequence">20</field>
    </record>
    <record id="menu_about" model="theme.website.menu">
        <field name="name">About</field>
        <field name="url">/about</field>
        <field name="sequence">30</field>
    </record>
    <record id="menu_contact" model="theme.website.menu">
        <field name="name">Contact</field>
        <field name="url">/contact</field>
        <field name="sequence">40</field>
    </record>

</data>
</odoo>
```

`theme.website.menu` is auto-converted from `theme_*` modules into real `website.menu` records on install.
