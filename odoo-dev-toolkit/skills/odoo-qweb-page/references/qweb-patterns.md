# QWeb Template Patterns for Odoo 18

This reference contains the exact patterns and conventions for building QWeb website pages. Read this before writing any template.

## Table of Contents

1. [Template Skeleton](#template-skeleton)
2. [SEO Meta Configuration](#seo-meta-configuration)
3. [JSON-LD Structured Data](#json-ld-structured-data)
4. [CSS Architecture](#css-architecture)
5. [JavaScript Patterns](#javascript-patterns)
6. [Form Handling](#form-handling)
7. [XML Gotchas](#xml-gotchas)
8. [Responsive Design](#responsive-design)

---

## Template Skeleton

Every page follows this exact structure. Don't deviate from the nesting order.

### CRITICAL XML FORMAT RULES

1. **NEVER start the file with `<?xml version="1.0" encoding="UTF-8"?>`** — Odoo does not need or want an XML declaration at the top of QWeb template files.
2. **NEVER wrap the template in `<odoo>`, `<data>`, or `<template>` tags** — those are for data/record XML files, NOT for QWeb website page templates.
3. **The file starts directly with `<t t-name="website.page-slug">`** — this is the root element.

### When templates ARE inside data XML files (theme modules, manifest `data:` list)

**Two rules for `<data>` wrapping:**

1. **Template-only files** (e.g., snippets): `<template>` goes directly under `<odoo>` — do NOT wrap in `<data>`
2. **Mixed files** (templates + records, e.g., pages with `theme.website.page`): wrap ALL content in `<data>`

```xml
<!-- CORRECT: template-only file (snippet) -->
<odoo>
<template id="s_my_snippet" name="My Snippet">
    <section data-snippet="s_my_snippet" data-name="My Snippet">...</section>
</template>
</odoo>

<!-- CORRECT: mixed file (page template + page record) -->
<odoo>
<data>
<template id="my_page" name="My Page">
    <t t-call="website.layout">...</t>
</template>
<record id="my_page_page" model="theme.website.page">
    <field name="url">/</field>
    <field name="view_id" ref="my_page"/>
    <field name="is_published" eval="True"/>
</record>
</data>
</odoo>
```

**IMPORTANT for theme modules (`theme_*`):** Do NOT use `<record model="theme.ir.ui.view">` with explicit `<field name="arch">` for pages and snippets. Use `<template>` instead — it automatically creates `theme.ir.ui.view` records. See `theme-snippets-pages.md` for the complete pattern.

### Correct skeleton

```xml
<t t-name="website.page-slug">

    <t t-set="pageName" t-value="'Page Display Name'"/>

    <t t-call="website.layout">
        <t t-set="no_header" t-value="False"/>
        <t t-set="no_footer" t-value="False"/>
        <t t-set="additional_title">Page Title | Brand Name</t>

        <t t-set="meta_description">Compelling 150-160 char description with keywords and call-to-action.</t>

        <t t-set="opengraph_meta" t-value="{
            'og:title': 'Page Title | Brand Name',
            'og:description': 'Short compelling description for social sharing.',
            'og:type': 'website',
            'og:site_name': 'Brand Name',
            'og:locale': 'en_US',
        }"/>

        <t t-set="twitter_meta" t-value="{
            'twitter:card': 'summary_large_image',
            'twitter:title': 'Page Title | Brand Name',
            'twitter:description': 'Short compelling description for Twitter.',
        }"/>

        <!-- JSON-LD structured data blocks go here -->
        <script type="application/ld+json">{
    "@context": "https://schema.org",
    "@type": "...",
    ...
}</script>

        <!-- Page content: MUST use oe_structure for drag-and-drop support -->
        <div id="wrap" class="oe_structure oe_empty">

            <!-- Each section uses class="container" or full-width patterns -->
            <!-- Sections that should support drag-and-drop of new blocks: -->
            <section class="prefix-hero o_colored_level pt104 pb104">
                <div class="container">
                    <!-- section content -->
                </div>
            </section>

            <section class="prefix-features o_colored_level pt104 pb104">
                <div class="container">
                    <!-- section content -->
                </div>
            </section>

            <!-- More sections... -->

        </div>
    </t>

    <!-- Head injection for CSS and JS -->
    <xpath expr="head" position="inside">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet"/>
        <style>
            /* All CSS here */
        </style>
        <script type="text/javascript">
            // All JS here
        </script>
    </xpath>
</t>
```

### WRONG — never do this:

```xml
<!-- WRONG: XML declaration -->
<?xml version="1.0" encoding="UTF-8"?>

<!-- WRONG: data/template wrappers -->
<odoo>
    <data>
        <template id="..." name="...">
            ...
        </template>
    </data>
</odoo>
```

### Key structural rules

- **File starts with `<t t-name="...">`** — no XML declaration, no `<odoo>`, no `<data>`, no `<template>` wrappers
- `t-name` always uses `website.` prefix followed by a kebab-case page slug
- Use `<t t-set="pageName" t-value="'Display Name'"/>` before `t-call` to set a human-readable page name
- `website.layout` gives you Odoo's header and footer. Set `no_header`/`no_footer` to `True` if you want to hide them.
- The `<div id="wrap">` is the main content container. It **MUST have class `oe_structure oe_empty`** so that Odoo's website builder can drag and drop blocks into it.
- Each `<section>` inside `#wrap` **MUST have class `o_colored_level`** so Odoo's color picker and block system can interact with it.
- The `<xpath>` block is a sibling of `<t t-call="website.layout">`, not nested inside it. It injects into the `<head>` element.

### Odoo Website Builder Drag-and-Drop Classes

For the page to work properly in Odoo's website editor (allowing users to add, move, and rearrange blocks), you MUST use these classes:

| Class | Where | Purpose |
|-------|-------|---------|
| `oe_structure` | On `<div id="wrap">` | Marks the container as a drop zone for website builder blocks |
| `oe_empty` | On `<div id="wrap">` (together with `oe_structure`) | Tells Odoo this structure can accept new blocks |
| `o_colored_level` | On each `<section>` | Enables Odoo's color picker and theme color integration for the section |
| `pt104 pb104` (or similar) | On each `<section>` | Odoo's spacing classes for consistent padding (pt = padding-top, pb = padding-bottom in Odoo units) |
| `container` | On the inner `<div>` of each section | Bootstrap container for responsive width |

**Why this matters:** Without `oe_structure` on the wrap div, users will see "This block cannot be dropped anywhere on this page" when trying to add blocks in the website editor. Without `o_colored_level` on sections, the color picker won't work. These classes are essential for Odoo website builder compatibility.

Example of a properly structured section:
```xml
<section class="prefix-hero o_colored_level pt104 pb104">
    <div class="container">
        <div class="row">
            <div class="col-lg-6">
                <h1>Headline</h1>
            </div>
            <div class="col-lg-6">
                <p>Content</p>
            </div>
        </div>
    </div>
</section>
```

---

## SEO Meta Configuration

### Page Title (`additional_title`)
- 50-60 characters max (Google truncates beyond this)
- Format: `Primary Keyword | Brand Name` or `Compelling Phrase | Brand Name`
- Include the most important keyword near the beginning

### Meta Description (`meta_description`)
- 150-160 characters max
- Include primary keyword naturally
- End with a call-to-action or value proposition
- This is what appears in Google search results — make it compelling

### OpenGraph Meta
Required properties:
```python
{
    'og:title': 'Title for social sharing (can differ from page title)',
    'og:description': 'Description optimized for social media engagement',
    'og:type': 'website',  # or 'article' for blog posts
    'og:site_name': 'Brand Name',
    'og:locale': 'en_US',  # match the page language
}
```

Optional but recommended if the page has a hero image:
```python
{
    'og:image': '/web/image/...',
    'og:image:width': '1200',
    'og:image:height': '630',
}
```

### Twitter Card Meta
```python
{
    'twitter:card': 'summary_large_image',  # or 'summary' for smaller cards
    'twitter:title': 'Title for Twitter',
    'twitter:description': 'Description for Twitter (under 200 chars)',
}
```

---

## JSON-LD Structured Data

Place `<script type="application/ld+json">` blocks inside the `<t t-call="website.layout">` block, before the page content. You can have multiple blocks for different schema types.

### Important formatting rules
- The JSON must be valid — no trailing commas, proper quoting
- Use 4-space indentation for readability
- Escape single quotes in values if they appear inside Python string delimiters

### Common Schema Templates

#### ProfessionalService / LocalBusiness
```json
{
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Business Name - Service",
    "description": "What the business does",
    "url": "https://example.com/page",
    "email": "info@example.com",
    "founder": {
        "@type": "Person",
        "name": "Founder Name"
    },
    "areaServed": {
        "@type": "Country",
        "name": "US"
    },
    "serviceType": ["Service 1", "Service 2", "Service 3"],
    "knowsLanguage": ["en"],
    "priceRange": "$$"
}
```

#### FAQPage
```json
{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Question text here?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Answer text here."
            }
        }
    ]
}
```

Every FAQ section in the HTML should have a matching FAQPage schema. The questions and answers must match exactly.

#### Product
```json
{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Product Name",
    "description": "Product description",
    "offers": {
        "@type": "Offer",
        "price": "99.00",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
    }
}
```

#### Article / BlogPosting
```json
{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Article Title",
    "author": {
        "@type": "Person",
        "name": "Author Name"
    },
    "datePublished": "2026-01-15",
    "dateModified": "2026-01-20",
    "description": "Brief summary"
}
```

#### BreadcrumbList
```json
{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://example.com/"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": "Current Page",
            "item": "https://example.com/current-page"
        }
    ]
}
```

---

## CSS Architecture

### Namespacing

All CSS classes must be prefixed with a short, unique namespace to avoid collisions with Odoo's built-in styles and other pages. Choose a 2-4 letter prefix based on the project or page name.

```css
/* Good */
.mv-hero { ... }
.mv-hero__title { ... }
.mv-btn--primary { ... }

/* Bad — will collide with Odoo or Bootstrap */
.hero { ... }
.title { ... }
.btn-primary { ... }
```

### CSS Custom Properties

Define all theme values as custom properties on the page wrapper element:

```css
.mv-landing {
    --mv-primary: #933df5;
    --mv-accent: #00d4ff;
    --mv-bg: #000000;
    --mv-bg-card: #111111;
    --mv-text: #ffffff;
    --mv-text-muted: #888888;
    --mv-gradient: linear-gradient(135deg, #6699ff 0%, #ff3366 100%);
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--mv-bg);
    color: var(--mv-text);
    line-height: 1.6;
    overflow-x: hidden;
}
```

### Section Pattern

```css
.prefix-landing section {
    padding: 100px 0;
    position: relative;
}

@media (max-width: 768px) {
    .prefix-landing section {
        padding: 72px 0;
    }
}
```

### Card Pattern

```css
.prefix-card {
    background: var(--prefix-bg-card);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 16px;
    padding: 40px 32px;
    transition: all 0.3s ease;
}
.prefix-card:hover {
    border-color: rgba(0,212,255,0.3);
    background: var(--prefix-bg-card-hover);
}
```

### Button Pattern

```css
.prefix-btn {
    display: inline-block;
    padding: 16px 40px;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 700;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
}
.prefix-btn--primary {
    background: var(--prefix-gradient);
    color: #fff;
    box-shadow: 0 4px 24px rgba(147,61,245,0.3);
}
.prefix-btn--primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(147,61,245,0.5);
    text-decoration: none;
    color: #fff;
}
```

### Animation Keyframes

Prefix all keyframe names:

```css
@keyframes prefixFadeUp {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0); }
}
```

### Badge Pattern

```css
.prefix-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}
```

### Text Gradient Pattern

```css
.prefix-text-gradient {
    background: var(--prefix-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

---

## JavaScript Patterns

### Intersection Observer (scroll animations)

```javascript
document.addEventListener('DOMContentLoaded', function() {
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('prefix-visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.prefix-fade-up').forEach(function(el) {
        observer.observe(el);
    });
});
```

CSS companion:
```css
.prefix-fade-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}
.prefix-fade-up.prefix-visible {
    opacity: 1;
    transform: translateY(0);
}
```

### FAQ Accordion

```javascript
document.querySelectorAll('.prefix-faq__question').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var item = btn.closest('.prefix-faq__item');
        var wasActive = item.classList.contains('prefix-active');
        // Close all
        document.querySelectorAll('.prefix-faq__item.prefix-active').forEach(function(i) {
            i.classList.remove('prefix-active');
        });
        // Open clicked (if it wasn't already open)
        if (!wasActive) item.classList.add('prefix-active');
    });
});
```

CSS companion:
```css
.prefix-faq__answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
}
.prefix-faq__item.prefix-active .prefix-faq__answer {
    max-height: 500px;
    padding-bottom: 24px;
}
```

### Sticky CTA Bar

```javascript
var stickyCta = document.getElementById('prefixStickyCta');
if (stickyCta) {
    var ctaObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (!entry.isIntersecting) {
                stickyCta.classList.add('prefix-visible');
            } else {
                stickyCta.classList.remove('prefix-visible');
            }
        });
    }, { threshold: 0 });

    var heroSection = document.querySelector('.prefix-hero');
    if (heroSection) ctaObserver.observe(heroSection);
}
```

### Smooth Scroll

```javascript
document.querySelectorAll('.prefix-page a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
```

---

## Form Handling

Forms in Odoo QWeb must include a CSRF token:

```xml
<form id="prefix-contact-form" class="prefix-form" action="/your-endpoint" method="post">
    <input type="hidden" name="csrf_token" t-att-value="request.csrf_token()"/>
    <input type="text" name="name" placeholder="Your name *" required="required"/>
    <input type="email" name="email" placeholder="Your email *" required="required"/>
    <input type="tel" name="phone" placeholder="Phone"/>
    <select name="interest" required="required">
        <option value="" disabled="disabled" selected="selected">Select an option *</option>
        <option value="option-1">Option 1</option>
        <option value="option-2">Option 2</option>
    </select>
    <textarea name="message" placeholder="Your message..." rows="3"/>
    <button type="submit" class="prefix-btn">Send</button>
</form>
```

### Form CSS Pattern

```css
.prefix-form {
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.prefix-form input,
.prefix-form textarea,
.prefix-form select {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 12px;
    padding: 16px 20px;
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.3s;
}
.prefix-form input:focus,
.prefix-form textarea:focus,
.prefix-form select:focus {
    border-color: rgba(255,255,255,0.6);
}
.prefix-form input::placeholder,
.prefix-form textarea::placeholder {
    color: rgba(255,255,255,0.6);
}
```

---

## XML Gotchas

These are the things that trip people up most often with QWeb/XML:

### Self-closing tags
In XML, void elements must be self-closed:
```xml
<!-- Correct -->
<div class="spacer"/>
<input type="text" name="email"/>
<br/>
<img src="..." alt="..."/>

<!-- Wrong — XML parser will break -->
<div class="spacer"></div>  <!-- Only wrong if truly empty and you want short form -->
<input type="text" name="email">
<br>
<img src="..." alt="...">
```

Note: `<div>` with content inside should use opening and closing tags normally. Only use self-closing for truly empty elements.

### Ampersands in URLs and text
```xml
<!-- Correct -->
&amp;  (for & in text and URLs)

<!-- Example in Google Fonts URL -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
```

### Attribute quoting
Always use double quotes for attributes. If the value contains double quotes, use single quotes for the outer or escape:
```xml
<t t-set="opengraph_meta" t-value="{
    'og:title': 'Your website isn\'t selling? We\'ll change that.',
}"/>
```

### viewBox attribute
In Odoo's XML context, use lowercase `viewbox` (Odoo's parser may be case-sensitive):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24" fill="none">
```

### Boolean attributes
Use explicit values:
```xml
<!-- Correct in QWeb XML -->
required="required"
disabled="disabled"
selected="selected"

<!-- Wrong — not valid XML -->
required
disabled
selected
```

### Special characters in JSON-LD
The JSON-LD `<script>` blocks are inside XML, so:
- Don't use `<` or `>` in JSON values (use unicode escapes if needed)
- Ampersands in JSON values should work inside `<script>` tags, but test if issues arise

### The `o_colored_level` class
Add `o_colored_level` to ALL `<section>` elements. This is mandatory — it enables Odoo's theme color picker AND tells the website builder that the section is a valid block. Without it, sections can't be recolored and blocks can't be dropped near them.

### The `oe_structure` and `oe_empty` classes
The main `<div id="wrap">` MUST have `class="oe_structure oe_empty"`. This is what makes the entire page a valid drop zone for the website builder. Without these classes, users will see "This block cannot be dropped anywhere on this page" error when trying to add new blocks via the editor.

### Odoo spacing classes
Use Odoo's built-in spacing utility classes on sections for consistent vertical rhythm:
- `pt104 pb104` — standard section padding (approximately 104px top and bottom)
- `pt48 pb48` — smaller padding for compact sections
- `pt0 pb0` — no padding
These work with Odoo's spacing system and can be adjusted in the website editor.

---

## Responsive Design

### Breakpoints

```css
/* Mobile-first is ideal, but matching Odoo's patterns: */
@media (max-width: 768px) {
    /* Tablets and below */
}

@media (max-width: 480px) {
    /* Small phones */
}
```

### Common responsive adjustments

- Grid layouts collapse to single column on mobile
- Section padding reduces (100px → 72px)
- Font sizes use `clamp()` for fluid scaling: `font-size: clamp(2rem, 4vw, 3.5rem);`
- Sticky CTA bar hides text label on mobile, keeps just the button
- Hero sections with side-by-side layout stack vertically on mobile
- Comparison columns stack vertically on mobile

### Fluid Typography

Use `clamp()` for headings to avoid separate media queries:
```css
h1 { font-size: clamp(2rem, 6vw, 5rem); }
h2 { font-size: clamp(1.5rem, 4vw, 3.5rem); }
h3 { font-size: clamp(1.1rem, 2vw, 1.3rem); }
```

### Image Handling

For Odoo images, use the `img-fluid` class and Odoo's image URL pattern:
```xml
<img src="/web/image/ATTACHMENT_ID/filename.webp"
     alt="Descriptive alt text"
     class="prefix-image img img-fluid"
     loading="lazy"/>
```

Use `loading="lazy"` for images below the fold to improve page speed.

---

## Language Selector in Custom Templates

When using `t-call="website.layout"` with `no_header=True`, the `frontend_languages` dict from Odoo 18 may NOT be reliably available in the inner template scope. A more reliable approach is to use `request.website.language_ids` directly.

### Reliable language selector pattern

```xml
<!-- Set language data from request.website -->
<t t-set="bwd_languages" t-value="request.website.language_ids"/>
<t t-set="bwd_active_lang" t-value="bwd_languages.filtered(lambda l: l.code == request.env.lang)[:1] or bwd_languages[:1]"/>

<!-- Only show selector if multiple languages exist -->
<t t-if="len(bwd_languages) > 1">
    <div class="prefix-lang-selector">
        <!-- Current language display -->
        <span>
            <img t-att-src="bwd_active_lang.flag_image_url" width="20" height="15"/>
            <t t-out="bwd_active_lang.name"/>
        </span>
        <!-- Language options -->
        <ul>
            <t t-foreach="bwd_languages" t-as="lg">
                <li t-att-class="'active' if lg.code == request.env.lang else ''">
                    <a t-attf-href="/web/set_lang?lang={{ lg.code }}&amp;r={{ request.httprequest.path }}">
                        <img t-att-src="lg.flag_image_url" width="20" height="15"/>
                        <t t-out="lg.name"/>
                    </a>
                </li>
            </t>
        </ul>
    </div>
</t>
```

### Key points

- `res.lang` records have a `flag_image_url` field for flag icons
- Language switching URL: `/web/set_lang?lang={{ lg.code }}&r={{ request.httprequest.path }}`
- Condition `t-if="len(bwd_languages) > 1"` hides the selector when only one language is active
- Use `request.env.lang` to detect the current active language

---

## Company Data in QWeb Templates

Access company information via `request.env.company.sudo()` in QWeb templates.

### Common company fields

```xml
<!-- Phone: check mobile first, then phone -->
<t t-set="company" t-value="request.env.company.sudo()"/>
<a t-att-href="'tel:' + (company.mobile or company.phone or '')"
   t-if="company.mobile or company.phone">
    <t t-out="company.mobile or company.phone"/>
</a>

<!-- Email -->
<a t-att-href="'mailto:' + (company.email or '')">
    <t t-out="company.email"/>
</a>

<!-- Social media links -->
<a t-att-href="company.social_instagram" t-if="company.social_instagram">Instagram</a>
<a t-att-href="company.social_facebook" t-if="company.social_facebook">Facebook</a>

<!-- Address -->
<t t-out="company.street"/>
<t t-out="company.city"/>
<t t-out="company.zip"/>
```

**Important:** Use the `mobile` field (not just `phone`) for phone numbers. The `phone` field may be empty while `mobile` has the actual number. Social media fields are: `social_instagram`, `social_facebook`, `social_twitter`, `social_youtube`, `social_linkedin`, `social_github` on `res.company`.
