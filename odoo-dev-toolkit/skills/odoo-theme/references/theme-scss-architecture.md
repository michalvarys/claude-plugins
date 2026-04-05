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

## SCSS Gotchas

- **`:has()` NOT supported** — Odoo uses libsass compiler which doesn't support `:has()` selector
- **No CSS custom properties in primary_variables.scss** — Use SCSS variables only in palette definition
- **`!default` is required** on palette map — allows Odoo to override values
- **Font URL format** — Use `+` for spaces in Google Fonts URL: `Open+Sans:300,400,600,700`
- **NEVER use `url()` for fonts in SCSS** — load fonts via `<link>` in the XML arch or via `$o-theme-font-configs` (see Font Loading section above)
- **Color references** — In palette, use `'o-color-N'` (quoted string) to reference other palette colors
- **Bundle order matters** — `primary_variables` → `frontend_helpers` → `assets_frontend`
- **Debug assets** — Use `?debug=assets` URL parameter to force asset recompilation
