# Next.js Static Export Strategies

Covers Next.js 13–16. **Always read the project's `AGENTS.md` / `CLAUDE.md` first** — Next.js has breaking changes between major versions and the project may document version-specific notes.

## Detecting the version

```bash
grep '"next"' package.json
# "next": "16.2.1"  → Next.js 16
# "next": "15.0.0"  → Next.js 15
# "next": "^14"     → Next.js 14
# "next": "^13"     → Next.js 13
```

Also check:
```bash
ls src/app 2>/dev/null && echo "App Router"
ls pages 2>/dev/null && echo "Pages Router"
```

## Enabling static export

### Next.js 14+

In `next.config.ts` / `next.config.mjs` / `next.config.js`:

```typescript
const nextConfig: NextConfig = {
    output: 'export',
    images: {
        unoptimized: true,  // Required — next/image optimization needs a server
    },
    trailingSlash: true,    // Creates about/index.html instead of about.html
                            // (flat-file cleanup happens in Step 3 of the skill)
};
```

After adding this, run:

```bash
npm run build
# out/ directory now contains the static bundle
```

### Next.js 13

Older projects may use the deprecated `next export` command:

```bash
npm run build && npx next export
```

This is no longer supported in 14+. Migrate to `output: 'export'` before attempting to convert.

## Handling dynamic routes

Any `[id]`, `[slug]`, `[...catchall]` folder needs `generateStaticParams` in Next.js 13+ (App Router) or `getStaticPaths` (Pages Router).

**App Router example (Next.js 15/16):**

```typescript
// src/app/products/[id]/page.tsx
export async function generateStaticParams() {
    // If the DB is available at build time:
    const products = await prisma.product.findMany({ select: { id: true } });
    return products.map((p) => ({ id: p.id }));
}

// Also required in Next.js 15+: params is now a Promise
export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    // ...
}
```

**If the DB isn't available at build time**, inline a seed:

```typescript
// src/app/products/[id]/page.tsx
import seedProducts from '@/data/seed-products.json';

export async function generateStaticParams() {
    return seedProducts.map((p) => ({ id: p.id }));
}
```

## Handling server-only code

### Problem: RSC fetches its own API routes

```typescript
// DOES NOT WORK in static export
const products = await fetch('http://localhost:3000/api/products').then(r => r.json());
```

### Fix: inline the data

```typescript
// src/lib/static-data.ts
import seed from '@/data/seed-products.json';

export async function getProducts() {
    return seed;
}
```

Replace every `fetch('/api/...')` with an import from `static-data.ts`.

### Problem: Direct database calls in RSC

```typescript
const products = await prisma.product.findMany();
```

This can actually work at build time if the DB is reachable during `next build`. Two options:

1. **Connect to DB at build time** — set `DATABASE_URL` in `.env.local` and let `prisma.findMany()` execute. Snapshot of data becomes the static bundle.
2. **Replace with seed import** (safer, reproducible):

```typescript
// Before
const products = await prisma.product.findMany();

// After
import seed from '@/data/seed-products.json';
const products = seed;
```

Generate the seed once with a one-off script:

```typescript
// scripts/export-seed.ts
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';

const products = await prisma.product.findMany();
fs.writeFileSync('src/data/seed-products.json', JSON.stringify(products, null, 2));
```

## Blockers that prevent export

Static export refuses to run if the project uses any of these features. Remove or stub them before building.

| Feature | Fix |
|---|---|
| `middleware.ts` at root | Delete or rename to `middleware.ts.bak` for the export run |
| `export const dynamic = 'force-dynamic'` | Remove the line |
| `export const revalidate = N` | Remove the line |
| Server Actions (`'use server'`) | Replace with client-side stubs that log instead of mutating |
| `next/headers` (`cookies()`, `headers()`) | Replace with constants or remove |
| API routes (`src/app/api/**/route.ts`) | Leave them — they're just skipped in export. Admin migration handles them separately. |
| `draftMode()`, `unstable_cache` | Remove |
| `fetch(..., { next: { revalidate: ... } })` | Remove the `next` options object |

## Next.js 15/16 specific gotchas

- **`params` is now a `Promise<...>`** in page components. Must `await` it.
- **`cookies()` / `headers()` return Promises** — used to be sync.
- **Caching defaults inverted** — `fetch()` no longer caches by default. Doesn't affect export but changes seed behavior.
- **Turbopack is default** in dev but not for `next build` unless opted in.

When in doubt, check the docs shipped with the installed version:

```bash
ls node_modules/next/dist/docs/ 2>/dev/null
# If the project has these, read them before writing code.
```

## Verifying the export

```bash
npm run build
ls out/
# index.html, about/index.html, products/index.html, _next/static/...
python3 -m http.server 8000 --directory out
# Open http://localhost:8000 — verify every page
```

If a page shows a blank body or hydration error in the browser console, the component is doing something not compatible with static rendering. Check the console for the exact hook/API causing it.

## Extracting the built assets

The `out/` directory contains:

```
out/
├── index.html
├── about/index.html           # Note: nested directory structure
├── products/index.html
├── _next/
│   └── static/
│       ├── css/<hash>.css      # All CSS bundled
│       ├── chunks/<hash>.js    # All JS bundled
│       └── media/              # Fonts, images
└── favicon.ico
```

The skill's Step 3 flattens this into:

```
<project>-static/
├── index.html
├── about.html                  # Flattened from about/index.html
├── products.html
├── css/theme.css               # Extracted from _next/static/css/<hash>.css
├── js/main.js                  # Extracted from _next/static/chunks
├── img/                        # From _next/static/media + public/
└── fonts/                      # From _next/static/media
```

Flattening is a find + sed + mv operation; do it carefully and update all href/src references in the HTML.
