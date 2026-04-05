# Asset Extraction

Pulling images, fonts, videos, and audio out of a framework project into the flat `<project>-static/` bundle.

## Images

### Next.js projects

Images live in two places:

1. **`public/`** — static images referenced by absolute path: `<img src="/hero.jpg">`
2. **`src/` or `assets/`** — imported images: `import hero from './hero.jpg'` (get bundled into `_next/static/media/` with a hash filename)

**Extraction:**

```bash
# Copy everything from public/ verbatim
cp -r public/* <project>-static/img/

# Pull bundled images out of the build
find out/_next/static/media -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" \) \
    -exec cp {} <project>-static/img/ \;
```

Then **rename** the hashed filenames back to something human-readable by cross-referencing the HTML:

```bash
# Hashed filename in built HTML:
#   <img src="/_next/static/media/hero.a1b2c3d4.jpg">
# Rename to:
#   <img src="img/hero.jpg">
```

Use `grep` to find references and `sed` to rewrite them consistently.

### `next/image` components

The built HTML contains `<img>` tags with `srcset`, `sizes`, and query parameters:

```html
<img src="/_next/image?url=%2Fhero.jpg&w=1920&q=75" srcset="..." />
```

Replace with plain:

```html
<img src="img/hero.jpg" alt="Hero">
```

Odoo will handle responsive resizing via `ir.attachment` automatic thumbnails once the theme is installed.

## Fonts

### Google Fonts via `next/font`

```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'] });
```

In the static bundle, replace with a `<link>` in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

And use the font in CSS:

```css
body {
    font-family: 'Inter', system-ui, sans-serif;
}
```

### Self-hosted fonts

If the project ships `.woff2` files in `public/fonts/` or imports them:

```bash
cp -r public/fonts/* <project>-static/fonts/
```

Declare them in **CSS** (not SCSS — the downstream `odoo-theme` skill forbids `url()` for fonts in SCSS):

```css
/* <project>-static/css/fonts.css */
@font-face {
    font-family: 'Brand Sans';
    src: url('../fonts/brand-sans-regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}
@font-face {
    font-family: 'Brand Sans';
    src: url('../fonts/brand-sans-bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}
```

Link it from every HTML page:

```html
<link rel="stylesheet" href="css/fonts.css">
```

## Videos

Rare in static bundles but possible (hero video backgrounds). Same extraction pattern as images:

```bash
find public/ -type f \( -name "*.mp4" -o -name "*.webm" \) -exec cp {} <project>-static/img/ \;
```

Use `<video>` tags with fallback:

```html
<video autoplay muted loop playsinline class="brand-hero__video">
    <source src="img/hero.webm" type="video/webm">
    <source src="img/hero.mp4" type="video/mp4">
</video>
```

## Audio

Same treatment. Odoo serves anything in `theme_*/static/` automatically, so the downstream theme skill just copies the files into `static/src/audio/`.

## SVG icons

### Icon libraries (lucide-react, heroicons, react-icons)

These render inline SVG at runtime from React components. In the static bundle, either:

1. **Inline the SVG** directly into the HTML (preferred — zero dependencies):

```html
<!-- Before (lucide-react) -->
<Menu className="w-6 h-6" />

<!-- After (inline SVG) -->
<svg class="icon icon--menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
</svg>
```

2. **Use Font Awesome** (Odoo ships FA 4.7 by default in the downstream theme):

```html
<i class="fa fa-bars"></i>
```

Inlining is usually cleaner for the static debugging phase.

### Logo SVGs

If the logo is a React component, extract it to a standalone `.svg` file:

```bash
# src/components/Logo.tsx contains <svg>...</svg>
# Extract the SVG, save as <project>-static/img/logo.svg
```

Reference it as `<img src="img/logo.svg" alt="Logo">` throughout.

## Data files (JSON seed)

If the project uses Prisma, dump the database to JSON:

```typescript
// scripts/export-seed.ts (run once, temporary)
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const products = await prisma.product.findMany();
    const dataDir = path.resolve('..', '<project>-static', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
        path.join(dataDir, 'products.json'),
        JSON.stringify(products, null, 2),
    );
}
main();
```

The JSON is used during debugging (e.g. `fetch('data/products.json').then(...)` in a vanilla `main.js`) and later becomes seed data for the Odoo admin module (`odoo-web-admin-bridge`).

## File placement in the final bundle

```
<project>-static/
├── img/
│   ├── logo.svg
│   ├── hero.jpg
│   ├── products/
│   │   ├── product-1.jpg
│   │   └── product-2.jpg
│   └── icons/              # Optional: grouped PNG thumbnails for snippets
├── fonts/
│   ├── brand-sans-regular.woff2
│   └── brand-sans-bold.woff2
├── css/
│   └── fonts.css           # @font-face declarations if self-hosted
└── data/
    └── products.json
```

## Verifying no asset references are broken

```bash
cd <project>-static/
# Find all src= and href= references
grep -rhoE '(src|href)="[^"]+"' *.html css/*.css | sort -u > /tmp/refs.txt

# Check each one exists
while IFS= read -r line; do
    path=$(echo "$line" | sed -E 's/.*="([^"]+)".*/\1/')
    case "$path" in
        http*|//*|mailto:*|tel:*|\#*) continue ;;
    esac
    [ -f "$path" ] || echo "MISSING: $path"
done < /tmp/refs.txt
```

Every reported "MISSING" must be fixed before handing off to the `static-to-odoo-theme` skill.
