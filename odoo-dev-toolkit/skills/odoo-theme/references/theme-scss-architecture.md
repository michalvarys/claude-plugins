# Odoo 18 Theme SCSS Architecture

## File Loading Order

1. `primary_variables.scss` → `web._assets_primary_variables` (loaded FIRST)
2. `bootstrap_overridden.scss` → `web._assets_frontend_helpers` (after variables)
3. `theme.scss` → `web.assets_frontend` (main styles)
4. `header.scss` → `web.assets_frontend`
5. `footer.scss` → `web.assets_frontend`
6. Component-specific SCSS → `web.assets_frontend`
7. `responsive.scss` → `web.assets_frontend` (loaded LAST)

## primary_variables.scss — Font + Palette

```scss
// ============================================================
// Font Configuration
// ============================================================
$o-theme-font-configs: (
    // Body font
    'Open Sans': (
        'family': ('Open Sans', sans-serif),
        'url': 'Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i',
    ),
    // Heading font
    'Montserrat': (
        'family': ('Montserrat', sans-serif),
        'url': 'Montserrat:300,400,500,600,700',
    ),
) !default;

// ============================================================
// Color Palette
// ============================================================
$o-website-values-palettes: (
    // Palette name (referenced in configurator)
    'brand-1': (
        // --- Color classes ---
        'o-color-1': #FFFFFF,           // White (default backgrounds)
        'o-color-2': #333333,           // Charcoal (text)
        'o-color-3': #FAF8F7,           // Warm off-white (light sections)
        'o-color-4': #7B2D5F,           // Brand primary (accent sections)
        'o-color-5': #1B1B1B,           // Near-black (header/footer)

        // --- Typography ---
        'font': 'Open Sans',
        'headings-font': 'Montserrat',
        'font-size-base': 1rem,
        'headings-font-weight': 600,

        // --- Button defaults ---
        'btn-primary-bg': 'o-color-4',
        'btn-primary-border-color': 'o-color-4',
        'btn-secondary-bg': 'o-color-5',
        'btn-secondary-border-color': 'o-color-5',

        // --- Header/Footer/Menu color class mapping ---
        // These control which o_cc class wraps header, footer, copyright
        'menu': 5,                       // Header uses o_cc5 (near-black bg)
        'footer': 5,                     // Footer uses o_cc5
        'copyright': 5,                  // Copyright bar uses o_cc5

        // --- Content Class (CC) overrides ---
        // CC5 = Dark sections (header/footer/dark backgrounds)
        'o-cc5-bg': 'o-color-5',
        'o-cc5-text': rgba(255, 255, 255, 0.85),
        'o-cc5-headings': #FFFFFF,
        'o-cc5-h2': #FFFFFF,
        'o-cc5-h3': rgba(255, 255, 255, 0.9),
        'o-cc5-link': 'o-color-4',
        'o-cc5-btn-primary': 'o-color-4',

        // CC4 = Brand-colored sections
        'o-cc4-bg': 'o-color-4',
        'o-cc4-text': rgba(255, 255, 255, 0.9),
        'o-cc4-headings': #FFFFFF,
        'o-cc4-link': #FFFFFF,
        'o-cc4-btn-primary': 'o-color-5',
        'o-cc4-btn-primary-border-color': 'o-color-5',

        // CC3 = Light sections (off-white bg)
        'o-cc3-bg': 'o-color-3',
        'o-cc3-text': 'o-color-2',

        // CC1 = Default (white bg)
        'o-cc1-bg': 'o-color-1',
        'o-cc1-text': 'o-color-2',
    ),
) !default;
```

**Palette rules:**
- Colors 1-5 define the base palette — referenced by `o_cc1` through `o_cc5` CSS classes
- `menu`, `footer`, `copyright` map to which CC class wraps those elements
- CC overrides allow per-section text/heading/link/button colors
- Use `rgba()` for semi-transparent text on dark backgrounds
- Use `'o-color-N'` (string) to reference other palette colors

## bootstrap_overridden.scss — Bootstrap Tweaks

```scss
// Disable shadows globally
$enable-shadows: false;

// Border radius
$border-radius: 4px;
$border-radius-lg: 6px;
$border-radius-sm: 3px;

// Button padding (wider buttons)
$btn-padding-y: 0.625rem;
$btn-padding-x: 1.5rem;

// Font weight for headings/buttons
$font-weight-bold: 600;

// Navbar padding (tighter)
$navbar-padding-y: 0.75rem;
```

## theme.scss — Main Component Styles

```scss
// ============================================================
// Brand Variables
// ============================================================
$brand-primary: #7B2D5F;       // Primary accent (wine/burgundy)
$brand-primary-light: #9B4D7F; // Lighter shade for hover
$brand-primary-dark: #5A1D45;  // Darker shade for active
$brand-dark: #1B1B1B;          // Near-black

// ============================================================
// Section Titles
// ============================================================
.brand_section_title {
    text-transform: uppercase;
    letter-spacing: 2px;
    position: relative;
    display: inline-block;
    padding-bottom: 15px;

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 3px;
        background-color: $brand-primary;
    }
}

.brand_title_accent {
    color: $brand-primary;
}

// ============================================================
// Buttons
// ============================================================
.brand_btn_primary {
    display: inline-block;
    padding: 12px 30px;
    background-color: $brand-primary;
    color: #fff;
    border: 2px solid $brand-primary;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
        background-color: $brand-primary-dark;
        border-color: $brand-primary-dark;
        color: #fff;
        text-decoration: none;
    }
}

.brand_btn_outline {
    display: inline-block;
    padding: 12px 30px;
    background-color: transparent;
    color: $brand-primary;
    border: 2px solid $brand-primary;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
        background-color: $brand-primary;
        color: #fff;
        text-decoration: none;
    }
}

// ============================================================
// Cards
// ============================================================
.brand_card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
}

// ============================================================
// Badges (for service cards, status indicators)
// ============================================================
.brand_badge_featured {
    display: inline-block;
    padding: 4px 12px;
    background-color: $brand-primary;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 3px;
}

.brand_badge_info {
    display: inline-block;
    padding: 4px 12px;
    background-color: #FF9800;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    border-radius: 3px;
}
```

## header.scss — Header Styles

```scss
// ============================================================
// Sticky Header
// ============================================================
header#top {
    overflow: visible !important; // Required for offcanvas z-index
}

// ============================================================
// Top Bar (desktop only)
// ============================================================
.brand_topbar {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 6px 0;
    font-size: 0.8rem;

    a {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;

        &:hover {
            color: #fff;
        }
    }
}

// ============================================================
// Navigation
// ============================================================
.brand_nav_link {
    text-transform: uppercase;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.8) !important;
    transition: color 0.3s ease;

    &:hover,
    &.active {
        color: $brand-primary !important;
    }
}

// ============================================================
// Mobile Menu (Offcanvas)
// ============================================================
.brand_mobile_menu {
    .offcanvas-body .nav-link {
        font-size: 1.1rem;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);

        &:hover {
            color: $brand-primary;
        }
    }
}

// Offcanvas backdrop (below menu z-index)
.brand_offcanvas_backdrop {
    z-index: 1079;
}
```

**Header gotcha:** Odoo JS strips custom classes from `header#top` at runtime. Style via SCSS selectors, not inline class attributes on the header element.

## footer.scss — Footer Styles

```scss
// ============================================================
// Footer Grid
// ============================================================
.brand_footer {
    // Contact info list
    .brand_contact_list {
        list-style: none;
        padding: 0;

        li {
            margin-bottom: 10px;
            display: flex;
            align-items: flex-start;
        }

        .fa {
            width: 20px;
            margin-right: 10px;
            margin-top: 4px;
            color: $brand-primary;
        }
    }

    // Quick links
    .brand_footer_links {
        list-style: none;
        padding: 0;

        a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: color 0.3s ease;

            &:hover {
                color: $brand-primary;
            }
        }
    }

    // Social icons
    .brand_social_icons {
        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            color: #fff;
            margin-right: 8px;
            transition: all 0.3s ease;

            &:hover {
                background-color: $brand-primary;
                color: #fff;
            }
        }
    }
}
```

## responsive.scss — Media Queries

```scss
// ============================================================
// Tablet (max-width: 991px)
// ============================================================
@media (max-width: 991px) {
    // Hero section
    .brand_hero h1 {
        font-size: 2rem;
    }
    .brand_hero p {
        font-size: 1rem;
    }

    // Section titles
    .brand_section_title {
        font-size: 1.5rem;
    }

    // Service/studio cards
    .brand_service_card {
        height: 280px;
    }
}

// ============================================================
// Mobile (max-width: 767px)
// ============================================================
@media (max-width: 767px) {
    // Hero section
    .brand_hero {
        min-height: 60vh;

        h1 {
            font-size: 1.5rem;
        }
    }

    // Section titles
    .brand_section_title {
        font-size: 1.25rem;
        letter-spacing: 1px;
    }

    // Service/studio cards
    .brand_service_card {
        height: 250px;
    }

    // Buttons - full width on mobile
    .brand_btn_primary,
    .brand_btn_outline {
        display: block;
        width: 100%;
        text-align: center;
    }
}
```

## Font Loading — CRITICAL RULE

**NEVER use `url()` in SCSS files to load font files.** Odoo's asset bundler does not resolve `url()` references to font files reliably across theme/asset boundaries, and doing so breaks font loading in production.

**WRONG — do NOT do this in any `.scss` file:**
```scss
// ❌ BREAKS — url() for fonts in SCSS is not supported
@font-face {
    font-family: 'MyFont';
    src: url('/theme_mymodule/static/src/fonts/myfont.woff2') format('woff2');
}

// ❌ BREAKS — also don't import external font CSS via @import url()
@import url('https://fonts.googleapis.com/css2?family=Open+Sans');
```

**CORRECT — load fonts via `<link>` in the XML arch (template):**
```xml
<!-- views/layout.xml — inherit website.layout and inject <link> into <head> -->
<template id="hotel_arena_layout" inherit_id="website.layout" name="Hotel Arena Layout">
    <xpath expr="//head" position="inside">
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin"/>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&amp;family=Montserrat:wght@300;400;500;600;700&amp;display=swap"
              rel="stylesheet"/>
    </xpath>
</template>
```

**OR use Odoo's `$o-theme-font-configs` map** in `primary_variables.scss` — this declares the font to Odoo's website configurator, and Odoo automatically generates the correct `<link>` tag to Google Fonts at runtime:
```scss
$o-theme-font-configs: (
    'Open Sans': (
        'family': ('Open Sans', sans-serif),
        'url': 'Open+Sans:300,400,600,700',  // Google Fonts URL fragment ONLY — not a CSS url()
    ),
) !default;
```

Note: the `'url'` key inside `$o-theme-font-configs` is **not** a CSS `url()` — it is a Google Fonts URL fragment that Odoo appends to `https://fonts.googleapis.com/css?family=`. This is the one acceptable place where the word "url" appears in SCSS for fonts, and it is handled by Odoo, not by the SCSS compiler.

For self-hosted font files (`.woff2` in `static/src/fonts/`), declare the `@font-face` in a **CSS** file (not SCSS) loaded via `<link>`, or inject the `@font-face` declaration directly into the XML template inside a `<style>` tag in `<head>`.

## Editor-safe CSS properties (CRITICAL)

Odoo 18's website editor loads a set of "option widgets" (`ShadowOption`, `TransitionOption`, filter option, etc.) that **parse the computed styles of the block the user clicked on**. These parsers split CSS values on commas and feed each segment into a unit parser. If ANY segment contains interior commas (e.g. `rgba(0,0,0,.5)`) or the property has multiple comma-separated layers, the parser crashes with:

```
Error: Cannot convert 'px,' units into 'px' units !
```

The whole editor then becomes unusable — the user can't select blocks, drag snippets, or save. Worst part: the crash only fires when clicking a *styled* block, so it looks intermittent.

**Rule: never ship comma-separated multi-value CSS on any element that can land inside a snippet drop zone** (i.e. anything inside `#wrap`, `.oe_structure`, or a `<section>` snippet). This includes styles applied via descendant selectors — if `.my-hero .cta` has a multi-value `box-shadow`, clicking `.cta` in the editor crashes.

**Properties that trigger the bug:**

- `box-shadow: 0 0 10px #000, 0 0 20px #f00;` — use ONE shadow + `::before`/`::after` pseudo for additional glow
- `transition: opacity 0.3s, transform 0.3s;` — use `transition: all 0.3s ease`
- `filter: drop-shadow(...) blur(...)` with multiple layers — use a single `filter` layer
- Any property wrapping multiple `rgba()` values separated by commas

**Safe examples:**

```scss
// ❌ Crashes editor when user clicks a .ea-card
.ea-card {
    box-shadow: 0 0 10px rgba(255, 106, 0, 0.4), 0 0 30px rgba(255, 106, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

// ✅ Editor-safe
.ea-card {
    box-shadow: 0 0 30px rgba(255, 106, 0, 0.3);
    transition: all 0.3s ease;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        box-shadow: 0 0 10px rgba(255, 106, 0, 0.4);
        pointer-events: none;
    }
}
```

**Debugging recipe:** If the editor throws `Cannot convert 'px,' units into 'px' units` after you click a block, grep your SCSS for `transition:` and `box-shadow:` that contain a comma inside the value. Start with the element class you clicked, then walk up its ancestors. Remember nested selectors — a `transition` declared on a parent applies to the child.

## Scoping theme styles for editor-created pages (CRITICAL)

If you write all theme styles scoped under one class (to avoid polluting Odoo's backend UI):

```scss
.my-theme {
    .ea-hero { ... }
    .ea-card { ... }
}
```

...then editor-created pages (`website.new_page`, duplicated pages, pages created via "+New → Page") will render **completely unstyled**. Reason: those pages use `<div id="wrap" class="oe_structure oe_empty">` — no `.my-theme` wrapper — because they don't go through your hand-crafted page templates.

**Fix: dual-scope under the theme class AND a body-level fallback that targets `#wrap`:**

```scss
// Matches both hand-crafted pages (<div id="wrap" class="my-theme">)
// and editor-created pages (<div id="wrap" class="oe_structure">).
// body.my-theme-body guard prevents leaking styles into Odoo's backend admin.
.my-theme,
body.my-theme-body #wrap {
    .ea-hero { ... }
    .ea-card { ... }
}
```

**Add the body class via `website.layout` inherit** (NOT via a wrap-level inherit — `#wrap` is in page templates, not in `website.layout`, so XPath to `//div[@id='wrap']` inside `website.layout` will 500):

```xml
<template id="my_theme_body_class" inherit_id="website.layout" name="My Theme Body Class">
    <xpath expr="//body" position="attributes">
        <attribute name="class" add="my-theme-body" separator=" "/>
    </xpath>
</template>
```

**Why not just drop the scope?** Unscoped theme SCSS (`.ea-hero { ... }` at root) leaks into Odoo's backend admin UI, website editor chrome, and other themes — often breaking them subtly. The body-class guard keeps isolation while covering editor-created pages.

## SCSS Gotchas

- **`:has()` NOT supported** — Odoo uses libsass compiler which doesn't support `:has()` selector
- **No CSS custom properties in primary_variables.scss** — Use SCSS variables only in palette definition
- **`!default` is required** on palette map — allows Odoo to override values
- **Font URL format** — Use `+` for spaces in Google Fonts URL: `Open+Sans:300,400,600,700`
- **NEVER use `url()` for fonts in SCSS** — load fonts via `<link>` in the XML arch or via `$o-theme-font-configs` (see Font Loading section above)
- **Color references** — In palette, use `'o-color-N'` (quoted string) to reference other palette colors
- **Bundle order matters** — `primary_variables` → `frontend_helpers` → `assets_frontend`
- **Debug assets** — Use `?debug=assets` URL parameter to force asset recompilation
