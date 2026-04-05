---
name: web-to-static
description: |
  Convert any web application (Next.js, React, Vue, or a live website) into plain static HTML + CSS + JS that a designer can open directly in a browser and iterate on before Odoo integration. Use this skill when the user wants to migrate an existing web project to Odoo and needs a clean, framework-free intermediate representation — one where styles can be debugged visually without build tooling. Covers Next.js static export, Tailwind tree-shaking + rewrite to semantic class names, framer-motion/GSAP replacement, asset extraction, and per-section HTML fragmentation.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "převést web", "migrace webu", "Next.js do HTML", "statické HTML", "odstranit framework", "čisté HTML", "exportovat web", "převod na statický web", "udělat statickou verzi", "vzít starý web".
version: 0.1.0
---

# Web → Static HTML/CSS/JS Converter

Converts an existing web application or live website into a clean, framework-free `HTML + CSS + JS` bundle that can be opened directly from the filesystem, iterated on visually, and then fed into the `static-to-odoo-theme` skill.

This is **stage 1 of the web-to-odoo migration pipeline**. Stage 2 (`static-to-odoo-theme`) converts the static bundle into an Odoo 18 theme module. Stage 3 (`odoo-web-admin-bridge`) migrates the admin side to Odoo.

## Before you start

Read the reference files in `references/`:
- **nextjs-export.md** — Next.js static export strategies, `generateStaticParams`, handling server components and API routes.
- **tailwind-rewrite.md** — Tree-shaking Tailwind and rewriting utilities into semantic SCSS-ready class names.
- **asset-extraction.md** — Images, fonts, videos, audio — how to pull them out of `public/` and framework-specific locations.
- **generic-html-mirror.md** — `wget`-based capture of an existing live website when no source code is available.

## Core Principles

1. **Framework-free output** — the final bundle must run with `python3 -m http.server` or `open index.html` — no node, no build step, no CLI.
2. **One HTML file per logical page** — `index.html`, `about.html`, `products.html`, ... Flat structure, no routing layer.
3. **Semantic, editor-friendly classes** — NOT `shadow-[0_0_30px_rgba(255,106,0,0.4)] transition-all duration-300` (breaks the Odoo editor downstream). Rewrite to `.brand-card`, `.brand-hero-cta`, etc.
4. **Section-scoped fragments** — each logical section that will become an Odoo snippet downstream must live in its own `<section data-snippet="s_name">...</section>` block. This tag is what the `static-to-odoo-theme` skill uses to split the HTML into individual `s_*.xml` snippet files.
5. **Preserve visual fidelity** — pixel-match the original, but feel free to rename classes, consolidate duplicated styles, and remove client-side fluff (hydration wrappers, dev overlays, analytics).
6. **No runtime data** — if the source uses database calls (Prisma, API routes), bake in representative seed data as plain JSON in a `data/` folder or inline. The admin side is migrated separately by `odoo-web-admin-bridge`.

## Workflow

### Step 1: Identify the source type

Ask the user or inspect the project:

- **Next.js app** (has `next.config.*`, `src/app/` or `pages/`) → go to Step 2a
- **React/Vite, Vue, SvelteKit, Astro** → go to Step 2b
- **Live website, no source** → go to Step 2c
- **Plain HTML already** → skip to Step 4

### Step 2a: Next.js static export

Read `references/nextjs-export.md` for the full procedure. Summary:

1. Add `output: 'export'` to `next.config.ts` (if not already present).
2. For any route with `generateStaticParams` missing, add a stub that returns seed data from Prisma (or hardcoded if no DB).
3. For server-only code (`fetch` to own API routes, database calls in RSC), replace with static imports from a `lib/static-data.ts` file built from the seed.
4. Remove `dynamic = 'force-dynamic'`, `revalidate` exports, and middleware that would block export.
5. Run `next build` — the `out/` directory is the static bundle.
6. **Check `AGENTS.md` / `CLAUDE.md`** in the Next.js project first — Next.js 15/16 has breaking changes vs. earlier versions, and the project may document them.

### Step 2b: Other framework static build

- **Vite/React:** `vite build` → `dist/` is already static if the app uses client-side routing only. Prerender routes with `vite-plugin-ssr` or manually duplicate `index.html` per route.
- **Nuxt:** `nuxt generate`.
- **Astro:** `astro build` (static by default).
- **SvelteKit:** `@sveltejs/adapter-static`.

### Step 2c: Live website mirror

Use the `wget` pattern in `references/generic-html-mirror.md`:

```bash
wget --mirror \
     --convert-links \
     --adjust-extension \
     --page-requisites \
     --no-parent \
     --execute robots=off \
     --user-agent="Mozilla/5.0" \
     https://example.com/
```

Then manually rename files, flatten directories, and de-duplicate shared assets.

### Step 3: Normalize the output

Take whatever came out of Step 2 and reshape it into this target layout:

```
<project>-static/
├── index.html              # Homepage
├── about.html              # One file per page
├── products.html
├── contact.html
├── css/
│   ├── theme.css           # Main styles (semantic class names)
│   ├── responsive.css      # Media queries
│   └── vendor/             # Third-party CSS (if any)
├── js/
│   ├── main.js             # Vanilla JS for interactions
│   └── vendor/             # CDN scripts downloaded locally (GSAP, etc.)
├── img/                    # All images, flat or grouped by category
├── fonts/                  # Self-hosted fonts (or document Google Fonts URLs)
└── data/                   # Optional: JSON seed data for iteration
    └── products.json
```

**Renaming rules:**
- Homepage → `index.html` (not `_app.html`, not `home.html`)
- Admin pages are **NOT** part of this bundle — they are migrated by `odoo-web-admin-bridge`. Exclude `/admin/*` entirely.
- Page filenames use dashes, not underscores: `our-team.html`, not `our_team.html`.

### Step 4: Rewrite Tailwind (and other utility-CSS)

This is the most important transformation and is **required** even if you're tempted to skip it. See `references/tailwind-rewrite.md`.

**Why it matters:** Downstream the Odoo editor will crash on utility chains like `shadow-[0_0_30px_rgba(255,106,0,0.4)]`, `transition-all duration-300`, or anything with embedded commas. The `odoo-theme` skill documents this in detail — `ShadowOption` and `TransitionOption` parsers split on commas and throw `Cannot convert 'px,' units into 'px' units !`.

**Procedure:**
1. Walk every JSX/HTML file and list unique class-attribute values.
2. Group by component/section — `Hero.tsx` → `.brand-hero`, `.brand-hero-title`, `.brand-hero-cta`, ...
3. Write one `theme.css` rule per semantic class, expanding the Tailwind utilities into plain CSS.
4. **Apply editor-safe rules** from the `odoo-theme` skill:
   - Never ship comma-separated multi-value `box-shadow`, `transition`, or `filter`. Use one shadow + `::before`/`::after` pseudos, `transition: all 0.3s ease`, single `filter` layer.
   - No `:has()` (libsass in Odoo doesn't support it).
5. Replace the class attribute in HTML with the new semantic class.
6. Delete the Tailwind CDN / bundle from the output entirely.

### Step 5: Replace framework runtime

- **framer-motion** → vanilla CSS animations + IntersectionObserver for scroll-trigger. For complex timelines, use GSAP from a CDN `<script>` (matches the `odoo-theme` inline-script pattern).
- **React client components with state** → vanilla JS in `js/main.js` using `document.querySelector` + event listeners. No React at all in the static output.
- **next/image, next/link** → plain `<img src="...">`, plain `<a href="...">`. Image optimization happens in Odoo via `ir.attachment` automatic resizing.
- **next/font** → either self-host in `fonts/` with `@font-face` in a `.css` file (NOT SCSS — see `odoo-theme` rule), or link to Google Fonts via `<link>` in the `<head>`.

### Step 6: Fragment into snippets

For each page, identify logical sections and wrap them with `data-snippet` markers:

```html
<!-- index.html -->
<body class="brand-body">
    <header class="brand-header"><!-- nav --></header>

    <main>
        <section class="brand-hero" data-snippet="s_brand_hero">
            <!-- ... -->
        </section>

        <section class="brand-categories" data-snippet="s_brand_categories">
            <!-- ... -->
        </section>

        <section class="brand-about" data-snippet="s_brand_about">
            <!-- ... -->
        </section>

        <!-- etc. -->
    </main>

    <footer class="brand-footer"><!-- ... --></footer>
</body>
```

**Snippet boundary rules:**
- One `data-snippet` per logical unit the user would drag-drop in Odoo (hero, pricing, cta, contact, ...).
- Header and footer are **NOT** snippets — they become `layout.xml` inherits.
- Every snippet must be a self-contained `<section>` (Odoo's built-in drop-zone rule `section, .parallax, .s_hr` handles these automatically — see `odoo-theme` skill).
- Snippet IDs use `s_` prefix and snake_case, matching Odoo convention.

### Step 7: Verify in a browser

```bash
cd <project>-static/
python3 -m http.server 8000
# Open http://localhost:8000 — pages must render pixel-identically to the original
```

**STOP HERE** and tell the user:

> Static bundle is ready at `<project>-static/`. Open it in a browser, check every page on desktop and mobile, tweak `css/theme.css` until you're happy. When you're ready, run the `static-to-odoo-theme` skill (or `/web-to-odoo` step 3) to generate the Odoo theme module.

Iteration at this stage is **cheap** — no Odoo restart, no bundle recompile. Debug the visuals here, not later.

## Output Format

A single directory `<project>-static/` with the structure from Step 3. No additional files outside that directory.

If the source project has secrets (`.env`, API keys), **never** copy them into the static bundle. Log a warning if any are detected.

## Key Gotchas

- **Next.js 15+ breaking changes** — always read the project's `CLAUDE.md` / `AGENTS.md` first. Next.js 15/16 introduced changes to `params`, `searchParams` (now Promises), server actions, and `fetch` caching that may break naive static export. The user's `AGENTS.md` will flag this.
- **`next export` is gone** — in Next.js 14+, use `output: 'export'` in `next.config.*` instead of the old `next export` command.
- **Dynamic routes without `generateStaticParams`** — static export will fail. Either add the function with seed IDs or remove the route entirely from the static bundle.
- **Server actions** — cannot be exported. Remove or stub them.
- **Middleware** — `middleware.ts` at project root blocks `output: 'export'`. Delete or move aside temporarily.
- **Tailwind arbitrary values** — `bg-[url('/hero.jpg')]`, `shadow-[...]`, `grid-cols-[1fr_2fr]` must ALL be rewritten to plain CSS. Leaving them in will break the Odoo editor later.
- **CSS modules** — Next.js `.module.css` files get hashed class names. Run `next build` first, then extract from the built bundle — or walk the source and manually replace with semantic names.
- **Hydration-only content** — anything rendered only after `useEffect` won't appear in a static export. Convert those components to render server-side or inline the data.
- **Admin routes** — exclude `/admin/*`, `/dashboard/*`, `/login`, `/api/*` from the static bundle. Those become Odoo backend views via `odoo-web-admin-bridge`.
- **Flat file naming** — Odoo's `theme.website.page` URLs don't need a directory structure. `about.html` becomes `/about`, `products.html` becomes `/products`. No nested `about/index.html` trick.
