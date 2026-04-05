# Odoo Dev Toolkit

Complete toolkit for Odoo 18 development. Specialized skills covering the full development workflow — from scaffolding new modules and building beautiful website pages, to migrating legacy web apps into Odoo themes + content-admin modules running in Docker.

## Skills

### odoo-qweb-page
Create SEO-optimized website pages using QWeb templates. Produces self-contained XML files with inline CSS/JS, complete with structured data (JSON-LD), OpenGraph meta tags, and Odoo website builder compatibility (drag-and-drop support).

**Triggers:** "create page", "QWeb page", "landing page", "website page", "vytvoř stránku", "QWeb šablona"

### odoo-module-scaffold
Scaffold complete Odoo 18 modules with proper directory structure, manifest, models, views, security, and data files. Covers both new standalone modules and extension modules.

**Triggers:** "create module", "new module", "scaffold", "nový modul", "vytvořit modul"

### odoo-views
Create and modify all types of Odoo 18 backend XML views — form, list, kanban, search, calendar, pivot, graph. Includes inheritance patterns and Odoo 18 syntax (list instead of tree, expression-based invisible/readonly).

**Triggers:** "form view", "list view", "kanban view", "create view", "vytvořit view", "pohled"

### odoo-python
Write Odoo 18 Python code — models, fields, computed fields, constraints, controllers, wizards, cron jobs, and reports. Covers the Command API, ORM patterns, domain syntax, and security best practices.

**Triggers:** "model", "controller", "wizard", "computed field", "Odoo Python", "napsat model"

### odoo-theme
Build complete Odoo 18 website themes (`theme_*` modules) — layout injection, snippets, dual-scope SCSS, ir_asset bundles, post-copy hooks. Includes hard-earned editor-safety rules (what multi-value CSS crashes the `ShadowOption` / `TransitionOption` widgets and how to avoid it).

**Triggers:** "theme", "website theme", "snippet", "šablona webu", "theme module"

### web-to-static
**Stage 1 of the migration pipeline.** Convert a legacy web application (Next.js, plain HTML, wget mirror) into a clean static HTML + CSS + JS bundle with semantic classes, ready to debug in the browser and feed into an Odoo theme. Handles Tailwind rewrite, asset extraction, seed JSON dump.

**Triggers:** "convert Next.js to static", "extract HTML from framework", "mirror website", "převést web na HTML"

### static-to-odoo-theme
**Stage 2 of the migration pipeline.** Turn a cleaned static bundle into a working `theme_<brand>/` Odoo 18 module — scaffold, SCSS split into 6 files with dual-scope pattern, layout.xml with body class injection, pages, snippets, ir_asset.xml, post-copy hook.

**Triggers:** "HTML to theme", "static to Odoo theme", "generate theme from HTML", "HTML na Odoo theme"

### odoo-web-admin-bridge
**Stage 3 of the migration pipeline.** Turn a legacy admin UI (e.g. Next.js + Prisma product admin) into an Odoo module that hooks into existing `product.template` without aggressive extension. Produces a simplified view set, a dedicated second top-level menu restricted to a content-editor group, and seed-import scripts that map Prisma schemas to Odoo fields.

**Triggers:** "simplified product admin", "content editor views", "Prisma to Odoo", "second menu", "zjednodušený admin"

### odoo-docker-dev
**Stage 4 of the migration pipeline (and everyday dev loop).** Install, upgrade, and debug Odoo 18 modules/themes in a Docker Compose environment. Covers the exact `docker compose stop web && docker compose run --rm -T web odoo -u ...` pattern, SCSS/JS cache busting, log inspection, odoo shell, fresh-DB recovery, and theme post-copy re-triggering.

**Triggers:** "docker odoo", "upgrade module docker", "cache bust", "docker compose odoo", "vývoj v dockeru"

## Commands

### /web-to-odoo
Orchestration command that chains `web-to-static` → `static-to-odoo-theme` → `odoo-web-admin-bridge` → `odoo-docker-dev` end-to-end. Takes a legacy website + brand name and produces a running dockerized Odoo 18 instance with `theme_<brand>/` plus `<brand>_web_catalog/` modules. See `commands/web-to-odoo.md`.

## Usage

Install the plugin, then simply describe what you want to build for Odoo 18. The appropriate skill activates automatically based on your request.

Examples:
- "Vytvoř mi landing page pro zubní kliniku v Odoo"
- "Scaffold a new module for tracking deliveries"
- "Create a kanban view for the project tasks model"
- "Write a wizard that imports CSV data into sale orders"

## Language Support

All skills respond in the language of your request. Czech trigger phrases are included for native Czech speakers.
