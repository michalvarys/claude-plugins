# Tailwind → Semantic CSS Rewrite

**This is the most important transformation in the `web-to-static` pipeline.** Skipping it will break the downstream Odoo theme editor with cryptic `Cannot convert 'px,' units into 'px' units !` errors.

## Why the rewrite is non-negotiable

Odoo 18's website editor loads option widgets (`ShadowOption`, `TransitionOption`, filter widgets) that parse the **computed styles** of the block the user clicks on. These parsers:

1. Split CSS values on commas.
2. Feed each segment into a unit parser.
3. Crash on interior commas (`rgba(...)`) or multi-layer values.

Tailwind utility chains like:

```html
<div class="shadow-[0_0_30px_rgba(255,106,0,0.4)] transition-all duration-300">
```

...compile to exactly the CSS that crashes the editor. The `odoo-theme` skill documents this in detail under **"Editor-safe CSS properties (CRITICAL)"**.

## The rewrite procedure

### 1. Inventory every unique class attribute

```bash
# Rough extraction
grep -rhoE 'class(Name)?="[^"]+"' src/ | sort -u > /tmp/classes.txt
```

Group by source file:

```bash
for f in $(find src/components -name "*.tsx"); do
    echo "=== $f ==="
    grep -oE 'className="[^"]+"' "$f"
done
```

### 2. Name semantic classes by component + role

For a `Hero.tsx` component, generate names like:

- `.brand-hero` — the outer `<section>`
- `.brand-hero__inner` — the container
- `.brand-hero__title` — headline
- `.brand-hero__subtitle` — tagline
- `.brand-hero__cta` — primary button
- `.brand-hero__backdrop` — background overlay

Use **BEM-like** naming (`block__element--modifier`) or plain kebab-case — both work in Odoo. Pick one and be consistent.

The prefix (`brand-`, `trafika-`, `arena-`) should match the theme module name the user plans to create downstream. Ask if unclear.

### 3. Expand utilities to plain CSS

For each semantic class, take the Tailwind chain and expand it using the Tailwind default config:

```html
<!-- Before -->
<div class="flex items-center justify-between max-w-7xl mx-auto px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-white/5">
```

```css
/* After */
.brand-header__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 80rem;          /* max-w-7xl = 1280px */
    margin: 0 auto;
    padding: 1rem 1.5rem;      /* py-4 px-6 */
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
```

```html
<!-- After -->
<div class="brand-header__inner">
```

### 4. Apply editor-safe rules (CRITICAL)

This is where most rewrites go wrong. Follow these rules:

#### ❌ NEVER ship these patterns

```css
/* Multi-layer shadow — crashes ShadowOption */
.brand-card {
    box-shadow: 0 0 10px rgba(255, 106, 0, 0.4), 0 0 30px rgba(255, 106, 0, 0.2);
}

/* Multi-property transition — crashes TransitionOption */
.brand-card {
    transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

/* Multi-layer filter */
.brand-logo {
    filter: drop-shadow(0 0 10px #f00) drop-shadow(0 0 20px #f00);
}
```

#### ✅ Editor-safe equivalents

```css
/* Single shadow + pseudo element for the second layer */
.brand-card {
    position: relative;
    box-shadow: 0 0 30px rgba(255, 106, 0, 0.2);
    transition: all 0.3s ease;
}
.brand-card::before {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: 0 0 10px rgba(255, 106, 0, 0.4);
    pointer-events: none;
    border-radius: inherit;
}

/* Single filter layer */
.brand-logo {
    filter: drop-shadow(0 0 15px rgba(255, 0, 0, 0.8));
}
```

### 5. Replace `class` attributes in HTML

For every HTML/JSX file, replace the Tailwind chains with the new semantic classes. In Next.js source this is a find-and-replace across `.tsx` files. In exported HTML it's a find-and-replace across the `out/` directory.

### 6. Delete the Tailwind runtime

The static bundle must not contain any Tailwind CSS. Remove:

- `_next/static/css/<hash>.css` (Tailwind compiled output) — replace with your hand-written `css/theme.css`.
- Any `<link>` to a CDN Tailwind build.
- `tailwind.config.*` and `postcss.config.*` are irrelevant — they never ship.

## Common Tailwind utility → CSS translations

| Tailwind | CSS |
|---|---|
| `flex` | `display: flex;` |
| `grid` | `display: grid;` |
| `items-center` | `align-items: center;` |
| `justify-between` | `justify-content: space-between;` |
| `gap-4` | `gap: 1rem;` |
| `p-4` | `padding: 1rem;` |
| `px-6 py-4` | `padding: 1rem 1.5rem;` |
| `mx-auto` | `margin-left: auto; margin-right: auto;` |
| `w-full` | `width: 100%;` |
| `max-w-7xl` | `max-width: 80rem;` |
| `h-screen` | `height: 100vh;` |
| `min-h-[85vh]` | `min-height: 85vh;` |
| `text-sm` | `font-size: 0.875rem; line-height: 1.25rem;` |
| `text-xl` | `font-size: 1.25rem; line-height: 1.75rem;` |
| `font-bold` | `font-weight: 700;` |
| `uppercase` | `text-transform: uppercase;` |
| `tracking-wider` | `letter-spacing: 0.05em;` |
| `text-white` | `color: #fff;` |
| `text-zinc-400` | `color: #a1a1aa;` |
| `bg-black/80` | `background: rgba(0, 0, 0, 0.8);` |
| `bg-gradient-to-br from-orange-500 to-red-600` | `background: linear-gradient(135deg, #f97316, #dc2626);` |
| `rounded-lg` | `border-radius: 0.5rem;` |
| `border` | `border: 1px solid currentColor;` |
| `border-white/5` | `border-color: rgba(255, 255, 255, 0.05);` |
| `backdrop-blur-xl` | `backdrop-filter: blur(24px);` |
| `hover:scale-105` | `&:hover { transform: scale(1.05); }` |
| `transition-all duration-300` | `transition: all 0.3s ease;` |
| `opacity-0` / `opacity-100` | `opacity: 0;` / `opacity: 1;` |
| `absolute inset-0` | `position: absolute; inset: 0;` |
| `z-50` | `z-index: 50;` |
| `md:flex` | `@media (min-width: 768px) { .x { display: flex; } }` |

For arbitrary values in square brackets (`shadow-[0_0_30px_rgba(255,106,0,0.4)]`, `min-h-[85vh]`, `grid-cols-[1fr_2fr]`), read the exact value and translate directly.

## Responsive breakpoints

Tailwind's default breakpoints map to standard media queries:

| Tailwind prefix | Min-width | Use in CSS |
|---|---|---|
| `sm:` | 640px | `@media (min-width: 640px)` |
| `md:` | 768px | `@media (min-width: 768px)` |
| `lg:` | 1024px | `@media (min-width: 1024px)` |
| `xl:` | 1280px | `@media (min-width: 1280px)` |
| `2xl:` | 1536px | `@media (min-width: 1536px)` |

Group all media queries at the bottom of `theme.css` or in a separate `responsive.css`, matching the `odoo-theme` skill's SCSS layout.

## Custom color palette extraction

If the project has a custom Tailwind theme (`tailwind.config.ts` with `extend.colors`), extract the palette and map it to Odoo's `o-color-1` through `o-color-5`:

```typescript
// tailwind.config.ts
colors: {
    brand: {
        primary: '#ff6a00',
        secondary: '#cc2200',
        dark: '#0a0a0a',
    },
}
```

```scss
// primary_variables.scss (downstream in static-to-odoo-theme skill)
$o-website-values-palettes: (
    'brand-1': (
        'o-color-1': #ffffff,
        'o-color-2': #0a0a0a,   // brand.dark
        'o-color-3': #f4f4f5,
        'o-color-4': #ff6a00,   // brand.primary
        'o-color-5': #cc2200,   // brand.secondary
    ),
);
```

## Verifying the rewrite

After rewriting, search the output HTML for any remaining Tailwind utility patterns:

```bash
# Any class with a colon (responsive prefix) or square bracket (arbitrary value)
grep -rE 'class="[^"]*(\[|:)[^"]*"' <project>-static/
# Should return nothing.
```

```bash
# Any shadow-*, transition-*, bg-gradient-*, etc.
grep -rE 'class="[^"]*(shadow-|transition-|hover:|md:)[^"]*"' <project>-static/
# Should return nothing.
```

If these greps find matches, the rewrite is incomplete and the Odoo editor will crash downstream.
