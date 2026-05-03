# Splitting a Flat CSS File into Odoo's SCSS Architecture

The static bundle ships one or two CSS files (`theme.css`, `responsive.css`). Odoo wants six SCSS files across three asset bundles. This reference walks through the split.

## Target layout

```
static/src/scss/
├── primary_variables.scss       → web._assets_primary_variables (loads first)
├── bootstrap_overridden.scss    → web._assets_frontend_helpers
├── theme.scss                   → web.assets_frontend
├── header.scss                  → web.assets_frontend
├── footer.scss                  → web.assets_frontend
└── responsive.scss              → web.assets_frontend (loads last)
```

See `odoo-theme/references/theme-scss-architecture.md` for why this order matters.

## Step 1: Extract variables → `primary_variables.scss`

Scan the static CSS for:

1. **Custom properties** in `:root { --x: ... }`
2. **Repeated color hex values** — pick the top 5 and treat them as the palette
3. **Font families** declared in `body` and `h1-h6`
4. **Base font sizes**

Build the `$o-website-values-palettes` map:

```scss
// primary_variables.scss
// NOTE: `url` uses Google Fonts v1 syntax (Family+Name:weights[,italics]),
// NOT the v2 "wght@..." syntax. Odoo's website loader builds a v1 request URL.
// Verified pattern matches Odoo 18 core themes (theme_clean, theme_anelusia, etc).
$o-theme-font-configs: (
    'Inter': (
        'family': ('Inter', sans-serif),
        'url': 'Inter:300,300i,400,400i,700,700i',
    ),
);

$o-website-values-palettes: (
    'brand-1': (
        // Base palette — map from the 5 most-used brand colors in the static CSS
        'o-color-1': #ffffff,   // Backgrounds / cards
        'o-color-2': #0a0a0a,   // Body text
        'o-color-3': #f4f4f5,   // Light section backgrounds
        'o-color-4': #ff6a00,   // Primary brand accent
        'o-color-5': #cc2200,   // Secondary brand / dark sections

        // Typography
        'font': 'Inter',
        'headings-font': 'Inter',
        'font-size-base': 1rem,
        'headings-font-weight': 700,

        // Button defaults
        'btn-primary-bg': 'o-color-4',
        'btn-primary-border-color': 'o-color-4',

        // Header/footer CC mapping
        'menu': 5,
        'footer': 5,
        'copyright': 5,

        // CC5 — dark sections
        'o-cc5-bg': 'o-color-5',
        'o-cc5-text': rgba(255, 255, 255, 0.85),
        'o-cc5-headings': #ffffff,
        'o-cc5-btn-primary': 'o-color-4',
    ),
) !default;
```

**Only include variables here** — no selectors, no actual rules. This file feeds Odoo's palette configurator and must load before Bootstrap.

## Step 2: Bootstrap tweaks → `bootstrap_overridden.scss`

Keep this minimal. Only override variables you actually need:

```scss
// bootstrap_overridden.scss
$enable-shadows: false;
$border-radius: 6px;
$border-radius-lg: 10px;
$btn-padding-y: 0.75rem;
$btn-padding-x: 1.75rem;
$font-weight-bold: 600;
```

Check the static bundle for tell-tale Bootstrap usage (`.btn`, `.container`, `.row`, `.col-*`, `.navbar-*`). If the static bundle doesn't use Bootstrap at all, leave this file empty (but still register it — Odoo expects it).

## Step 3: Header styles → `header.scss`

Move every rule that targets header elements:

```scss
// header.scss
.theme_<brand>_page,
body.theme_<brand>_body #wrap {
    // Nothing header-specific here; header lives OUTSIDE #wrap
}

// Header lives outside the dual-scope because #wrapwrap > header is a sibling of #wrap.
#wrapwrap > header {
    // Hide Odoo's default navbar — we render our own
    > nav.navbar,
    > .navbar {
        display: none !important;
    }

    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;  // SINGLE property — editor-safe

    .brand-header__inner {
        max-width: 80rem;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 80px;
        padding: 0 1.5rem;
    }

    .brand-nav-links {
        display: none;
        align-items: center;
        gap: 2rem;

        @media (min-width: 768px) {
            display: flex;
        }

        a {
            color: #a1a1aa;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 0.8rem;
            text-decoration: none;
            transition: color 0.3s ease;  // SINGLE property

            &:hover { color: #fafafa; }
        }
    }
}
```

**Why header is NOT inside the dual-scope:** `<header>` is a sibling of `#wrap` inside `#wrapwrap`. The scope selectors only match descendants of `#wrap` and `.theme_<brand>_page`. Target header directly via `#wrapwrap > header`.

## Step 4: Footer styles → `footer.scss`

Same logic — footer is a sibling of `#wrap`, scope it directly:

```scss
// footer.scss
#wrapwrap > footer,
#wrapwrap #footer {
    background: #0a0a0a;
    color: rgba(255, 255, 255, 0.7);
    padding: 4rem 0 2rem;

    .brand-footer__grid {
        max-width: 80rem;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2rem;

        @media (max-width: 767px) {
            grid-template-columns: 1fr;
        }
    }

    .brand-footer__logo img {
        height: 72px;
        width: auto;
        filter: drop-shadow(0 0 15px rgba(255, 106, 0, 0.4));  // SINGLE filter layer
    }
}
```

## Step 5: Main theme styles → `theme.scss`

Everything else — body, sections, buttons, cards, typography. Wrap in the dual-scope:

```scss
// theme.scss

// ===== Dual-scope: applies to hand-crafted pages AND editor-created pages =====
// Hand-crafted pages have <div id="wrap" class="theme_<brand>_page oe_structure ...">.
// Editor-created pages have <div id="wrap" class="oe_structure oe_empty"> (no theme class),
// but <body> gets the theme_<brand>_body class from layout.xml, so body + #wrap matches.
.theme_<brand>_page,
body.theme_<brand>_body #wrap {

    // Body base
    font-family: 'Inter', system-ui, sans-serif;
    color: #0a0a0a;
    background: #ffffff;

    // Hero section
    .brand-hero {
        position: relative;
        min-height: 85vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0a0a0a 0%, #1f1f1f 100%);
        color: #ffffff;
        overflow: hidden;
    }

    .brand-hero__title {
        font-size: 4rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .brand-hero__cta {
        display: inline-block;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #ff6a00, #cc2200);
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: 6px;
        transition: all 0.2s ease;  // SINGLE property

        &:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(255, 106, 0, 0.4);  // SINGLE shadow
        }
    }

    // Card base
    .brand-card {
        position: relative;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 10px;
        padding: 1.5rem;
        transition: all 0.3s ease;  // SINGLE property
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);  // SINGLE shadow

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: 0 0 20px rgba(255, 106, 0, 0.1);  // Secondary glow via pseudo
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        &:hover {
            transform: translateY(-4px);

            &::before { opacity: 1; }
        }
    }
}
```

## Step 5b: Neutralize clearfix on grid containers

Odoo injects `#wrap .container::before, #wrap .container::after { content: ""; display: table; }` globally. These pseudo-elements become invisible grid children and break any `display: grid` layout inside `#wrap`.

After writing `theme.scss`, find every rule that uses `display: grid` and check whether the HTML element also has Bootstrap's `.container` class. If it does, add the clearfix guard:

```scss
.brand-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;

    // Odoo clearfix pseudo-elements break grid layout inside #wrap
    &::before,
    &::after {
        display: none;
    }
}
```

**Diagnostic clue:** if a grid layout works in the footer but breaks inside `#wrap`, the clearfix pseudo-elements are the cause — the footer is a sibling of `#wrap`, not a descendant, so the rule doesn't apply there.

See `odoo-theme/references/theme-scss-architecture.md` → "CSS Grid inside `#wrap`" for the full explanation.

## Step 6: Media queries → `responsive.scss`

Pull every `@media` block out of the above files and put them here:

```scss
// responsive.scss

.theme_<brand>_page,
body.theme_<brand>_body #wrap {

    @media (max-width: 991px) {
        .brand-hero__title { font-size: 2.5rem; }
        .brand-hero { min-height: 70vh; }
    }

    @media (max-width: 767px) {
        .brand-hero__title { font-size: 1.75rem; }
        .brand-hero__cta {
            display: block;
            width: 100%;
            text-align: center;
        }
    }
}

// Header responsive (outside dual-scope)
@media (max-width: 767px) {
    #wrapwrap > header {
        .brand-header__inner { height: 64px; }
    }
}
```

Loading `responsive.scss` last (as specified in `ir_asset.xml`) ensures media queries cascade over base rules.

## Step 7: The editor-safe sweep

After splitting, run this sweep across all SCSS files — this catches violations that will crash the Odoo editor:

```bash
# Find multi-value transitions
grep -rn 'transition:.*,' static/src/scss/
# Every match is a bug. Collapse to `transition: all <duration> <easing>`.

# Find multi-layer box-shadow
grep -rnE 'box-shadow:[^;]*,[^;]*,' static/src/scss/
# Every match with MORE than one comma inside rgba() is a bug.
# (Single rgba() has 3 commas inside parens — those are fine.)

# Find multi-layer filter
grep -rnE 'filter:[^;]*\) *[^;]+\(' static/src/scss/
# Every match is a bug. Use one filter layer + pseudo-element for secondary effects.
```

**Distinguishing safe vs unsafe comma usage:**

```scss
// SAFE — commas inside rgba() parens only
box-shadow: 0 0 30px rgba(255, 106, 0, 0.4);

// UNSAFE — comma OUTSIDE parens separates two shadow layers
box-shadow: 0 0 10px rgba(255, 106, 0, 0.4), 0 0 20px rgba(255, 106, 0, 0.2);

// SAFE — single transition property
transition: all 0.3s ease;

// UNSAFE — multiple comma-separated properties
transition: opacity 0.3s ease, transform 0.3s ease;
```

A more precise detection uses balanced-paren parsing — easiest done by eye after generating the files.

## Step 8: Verify bundle order in `ir_asset.xml`

Match the load order exactly:

1. `primary_variables.scss` → `web._assets_primary_variables`
2. `bootstrap_overridden.scss` → `web._assets_frontend_helpers`
3. `theme.scss` → `web.assets_frontend`
4. `header.scss` → `web.assets_frontend`
5. `footer.scss` → `web.assets_frontend`
6. `responsive.scss` → `web.assets_frontend`

Odoo loads bundles in this order: `_assets_primary_variables` → `_assets_frontend_helpers` → `assets_frontend`. Within a bundle, records load in the order they're declared in `ir_asset.xml`. Put `responsive.scss` last within the frontend bundle so its media queries override base rules.
