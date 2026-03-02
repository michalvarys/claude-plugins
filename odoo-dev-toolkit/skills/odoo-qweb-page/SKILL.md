---
name: odoo-qweb-page
description: |
  Create beautiful, SEO-optimized website pages using QWeb templates for Odoo 18. Use this skill whenever the user wants to build, create, or generate a web page, landing page, service page, about page, blog-style page, product page, portfolio page, contact page, or any other website page for an Odoo 18 instance. Also trigger when the user mentions "QWeb", "Odoo website", "Odoo page", "Odoo template", or asks for a page with SEO optimization for Odoo. This skill covers the full spectrum of page types — from simple informational pages to complex animated landing pages with conversion funnels. If someone says "make me a page" or "build a website section" and the context is Odoo, use this skill.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "vytvoř stránku", "udělej stránku", "postav stránku", "nová stránka", "landing page", "webová stránka", "stránka pro Odoo", "QWeb šablona", "QWeb stránka", "šablona pro web", "SEO stránka", "prodejní stránka", "kontaktní stránka", "portfolio stránka", "stránka služeb", "o nás stránka", "blog stránka", "produktová stránka", "udělej mi web", "vytvoř mi web", "potřebuji stránku", "chci stránku", or any Czech request involving creating a website page for Odoo.
---

# Odoo 18 QWeb Page Creator

You create complete, production-ready QWeb website pages for Odoo 18. Every page you produce is a single self-contained `.xml` file with inline CSS and JS, optimized for SEO from the ground up.

Before you start writing any code, read the reference file at `references/qweb-patterns.md` in this skill's directory. It contains the exact template structure, SEO patterns, and CSS/JS conventions you need to follow. This is essential — the patterns there are battle-tested and ensure your output works correctly in Odoo 18.

## Core Principles

### 1. Every page is SEO-first

Search engines are how people find websites. Every page you create must include:

- **`additional_title`** — a compelling, keyword-rich page title (50-60 chars ideal)
- **`meta_description`** — a persuasive summary with a call-to-action (150-160 chars)
- **OpenGraph meta tags** — so the page looks great when shared on social media
- **Twitter Card meta tags** — for Twitter/X sharing
- **JSON-LD structured data** — the right schema type for the page content (see reference file for schema options)
- **Semantic HTML** — proper heading hierarchy (one H1, then H2s, H3s), landmark elements, descriptive alt text

The reason this matters so much: a beautiful page that Google can't understand is invisible. Structured data can earn rich snippets in search results, which dramatically increases click-through rates.

### 2. Self-contained templates

Each page is a single QWeb XML file. All CSS goes in a `<style>` block and all JS in a `<script>` block, both injected into `<head>` via `<xpath expr="head" position="inside">`. This keeps deployment simple — one file, one page, no external dependencies to manage.

### 3. Beautiful by default

Pages should look professional and modern out of the box. Use CSS custom properties (variables) for theming, smooth animations for engagement, and responsive design that works on all devices. The visual quality should match what a professional web agency would deliver.

### 4. Odoo 18 compatibility

QWeb templates have specific syntax requirements. The reference file covers all of them, but the critical rules:

**FILE FORMAT — NEVER violate these:**
- **NEVER start the file with `<?xml version="1.0" encoding="UTF-8"?>`** — no XML declaration
- **NEVER wrap the template in `<odoo>`, `<data>`, or `<template>` tags** — those are for data XML files, not QWeb page templates
- **The file starts directly with `<t t-name="website.page-slug">`** as the root element
- Use `<t t-set="pageName" t-value="'Display Name'"/>` to set the page name

**TEMPLATE STRUCTURE:**
- Use `t-name` with the `website.` prefix (e.g., `website.my-page`)
- Inside `t-name`, call `<t t-call="website.layout">` to get Odoo's header/footer
- Self-closing tags must use `/>` syntax (this is XML, not HTML)
- Use `t-att-value` for dynamic attributes
- CSRF tokens are needed for forms: `<input type="hidden" name="csrf_token" t-att-value="request.csrf_token()"/>`

**WEBSITE BUILDER COMPATIBILITY — essential for drag-and-drop:**
- The main `<div id="wrap">` MUST have class `oe_structure oe_empty` — this makes the page a valid drop zone for the website builder
- Every `<section>` MUST have class `o_colored_level` — this enables the color picker and block system
- Use Odoo spacing classes like `pt104 pb104` on sections for consistent vertical rhythm
- Without these classes, users will see **"This block cannot be dropped anywhere on this page"** in the website editor

## Page Creation Workflow

### Step 1: Understand the page

Before writing any code, clarify:
- **What is the page about?** (topic, business, product, service)
- **Who is the audience?** (B2B, B2C, technical, general public)
- **What action should visitors take?** (contact form, purchase, sign up, learn more)
- **What language?** (affects meta tags, structured data locale, content)
- **What's the visual style?** (dark/light, corporate/creative, minimal/rich)

### Step 2: Choose the right structured data

Pick the JSON-LD schema type(s) that match the page content. Common choices:

| Page Type | Primary Schema | Optional Additional |
|-----------|---------------|-------------------|
| Landing page (service) | `ProfessionalService` or `Service` | `FAQPage` |
| Product page | `Product` | `Review`, `FAQPage` |
| About page | `Organization` or `Person` | `BreadcrumbList` |
| Blog/article | `Article` or `BlogPosting` | `BreadcrumbList` |
| Contact page | `LocalBusiness` | `ContactPoint` |
| Portfolio | `CreativeWork` collection | `Organization` |
| Event page | `Event` | `Offer`, `Place` |
| FAQ page | `FAQPage` | `Organization` |

You can (and often should) include multiple schema blocks. For example, a service landing page with an FAQ section should have both a `ProfessionalService` and a `FAQPage` schema.

### Step 3: Write the template

Follow the structure in `references/qweb-patterns.md`. The general skeleton is:

```
<t t-name="website.{page-slug}">
  <t t-set="pageName" t-value="'Page Display Name'"/>
  <t t-call="website.layout">
    <!-- SEO meta configuration (t-set for title, description, OG, Twitter) -->
    <!-- JSON-LD structured data -->
    <!-- Page content -->
    <div id="wrap" class="oe_structure oe_empty">
      <section class="prefix-hero o_colored_level pt104 pb104">
        <div class="container"><!-- hero content --></div>
      </section>
      <section class="prefix-features o_colored_level pt104 pb104">
        <div class="container"><!-- features content --></div>
      </section>
      <!-- more sections, each with o_colored_level -->
    </div>
  </t>
  <xpath expr="head" position="inside">
    <!-- Google Fonts link (if needed) -->
    <!-- <style> block with all CSS -->
    <!-- <script> block with all JS -->
  </xpath>
</t>
```

**NEVER** start the file with `<?xml version="1.0" encoding="UTF-8"?>`.
**NEVER** wrap in `<odoo>`, `<data>`, or `<template>` tags.

### Step 4: CSS Architecture

Use a consistent naming convention to avoid conflicts with Odoo's built-in styles. Prefix all classes with a short identifier (2-3 letters) related to the page or project. For example, `mv-` for "Michal Varys" or `lp-` for "landing page".

Key CSS patterns:
- **CSS custom properties** at the root element for colors, gradients, fonts
- **Responsive breakpoints** using `@media (max-width: 768px)` (and 1024px for tablets if needed)
- **Animation keyframes** prefixed with the same namespace to avoid collisions
- **No reliance on Odoo's built-in utility classes** beyond basic Bootstrap grid (`container`, `row`, `col-*`) — your styles should be self-sufficient

### Step 5: JavaScript

Keep JS minimal and focused on interactivity:
- **Intersection Observer** for scroll-triggered animations (fade-in, slide-up)
- **FAQ accordion** toggle logic
- **Smooth scrolling** for anchor links
- **Sticky CTA** visibility toggling

Wrap everything in `DOMContentLoaded` to ensure the DOM is ready. Don't use jQuery — vanilla JS is cleaner and doesn't add dependencies.

### Step 6: Validate

Before delivering the page, mentally check:

**File format (CRITICAL):**
- [ ] File does NOT start with `<?xml version="1.0" encoding="UTF-8"?>`
- [ ] File does NOT contain `<odoo>`, `<data>`, or `<template>` wrapper tags
- [ ] File starts directly with `<t t-name="website.page-slug">`
- [ ] Uses `<t t-set="pageName" t-value="'...'"/>` for display name
- [ ] Uses `<t t-call="website.layout">` inside the `t-name` block

**Website builder compatibility (CRITICAL):**
- [ ] `<div id="wrap">` has class `oe_structure oe_empty`
- [ ] Every `<section>` has class `o_colored_level`
- [ ] Sections use Odoo spacing classes (e.g., `pt104 pb104`)
- [ ] Sections use `<div class="container">` inside for responsive width

**XML validity:**
- [ ] Valid XML (all tags properly closed, self-closing where needed)
- [ ] All `viewBox` attributes use lowercase `viewbox` in XML context
- [ ] `<div>` self-closing tags use `<div ... />` only when truly empty

**SEO:**
- [ ] Exactly one `<h1>` on the page
- [ ] Heading hierarchy makes sense (no skipping from H1 to H4)
- [ ] All images have `alt` attributes
- [ ] `meta_description` is under 160 characters
- [ ] `additional_title` is under 60 characters
- [ ] JSON-LD is valid JSON with correct `@context` and `@type`
- [ ] OpenGraph tags include at minimum: `og:title`, `og:description`, `og:type`
- [ ] Twitter card tags include: `twitter:card`, `twitter:title`, `twitter:description`

**Other:**
- [ ] Form has CSRF token if present
- [ ] CSS class names are namespaced (prefixed)
- [ ] Responsive layout tested mentally at 320px, 768px, 1024px, 1440px
- [ ] No hardcoded absolute URLs (use relative paths for internal links)

## Section Library

When building pages, think in sections. **Every section MUST follow this structure:**

```xml
<section class="prefix-sectionname o_colored_level pt104 pb104">
    <div class="container">
        <!-- section content using row/col-* for grid -->
    </div>
</section>
```

The `o_colored_level` class and Odoo spacing classes (`pt104 pb104`) are mandatory on every section for website builder compatibility.

### Hero Section
The first thing visitors see. Include a compelling headline (H1), a subheadline explaining the value proposition, a primary CTA button, and optionally trust signals (stats, logos, badges). For creative pages, add background animations (CSS only — no heavy JS animation libraries).

### Problem/Pain Section
Identify the visitor's pain points. Use a grid of cards with icons. This creates empathy and sets up the solution section.

### Solution/Offer Section
Present what you're offering. Feature grid, comparison table, or highlighted box with checkmarks. Connect each feature back to the problems identified above.

### Social Proof Section
Testimonials, client logos, case study snippets, or aggregate ratings. Use a card grid layout. Stars, quotes, author names with roles.

### Process/How-It-Works Section
Numbered steps showing how the service/product works. Reduces friction by making the next steps clear and predictable.

### Pricing/Comparison Section
Side-by-side comparison (you vs. competitors, or tier comparison). Highlight the recommended option with a border or shadow.

### FAQ Section
Accordion-style expandable questions. Each Q&A pair should also be in the FAQPage JSON-LD schema so Google can display them as rich results.

### CTA/Contact Form Section
Final conversion section. Keep the form short (name, email, phone, message). Include urgency or trust elements nearby.

### Sticky CTA Bar
Fixed bottom bar that appears after scrolling past the hero. Contains a short message and a CTA button.

## Content Quality Guidelines

The content you write matters as much as the code. Follow these principles:

- **Write for the visitor, not the business.** Frame benefits in terms of what the visitor gains, not what the business does.
- **Use specific numbers** when possible ("50+ projects" beats "many projects").
- **One CTA per section maximum.** Too many choices paralyze visitors.
- **Urgency should be honest.** "Limited availability" is fine if true. Don't fabricate scarcity.
- **Questions make great headings.** "How much does a working website cost?" engages better than "Our Pricing."

## Output Format

Save the final template as a `.xml` file. The filename should match the template name: if `t-name="website.my-cool-page"`, save as `my-cool-page.xml`.

If the user doesn't specify a page slug, derive one from the page topic (lowercase, hyphens, no special characters).
