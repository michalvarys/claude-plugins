---
name: odoo-docker-dev
description: |
  Develop, install, upgrade, and debug Odoo 18 modules and themes through a Docker Compose setup. Use this skill when the user is iterating on custom modules or themes in a dockerized Odoo environment and needs help with: install/upgrade commands that avoid serialization errors, cache invalidation after SCSS/JS changes, module reload workflow, log inspection, odoo shell usage, debugging crashes in the website editor, handling the `theme_*` post-copy mechanism, and documenting conventions from an existing docker-compose.yml. Use this skill when the user mentions docker, containers, upgrade command failures, asset cache problems, theme re-install, bundle errors, or iterative theme development.
  Czech triggers (CZ): Trigger also when the user speaks Czech and mentions: "docker", "odoo kontejner", "upgrade modulu", "reinstalovat modul", "docker compose odoo", "restart odoo", "logy odoo", "odoo shell", "vynutit recompile", "cache assets", "vývoj v dockeru", "debug v dockeru".
version: 0.1.0
---

# Odoo 18 Docker Development Workflow

End-to-end workflow for developing Odoo 18 custom modules and themes in a Docker Compose setup. Covers installation, iterative upgrade after code changes, asset cache invalidation, debugging editor crashes, and the theme post-copy mechanism.

## Before you start

Read these files in order:

1. **`references/compose-conventions.md`** — The reference `docker-compose.yml` pattern this toolkit uses (based on the Elite project). Volume mounts, addons path, environment variables, health checks.
2. **`references/install-upgrade-reload.md`** — The definitive command reference for installing modules, upgrading after changes, and the SCSS/JS cache-busting loop.
3. **`references/debug-workflows.md`** — Debugging editor crashes, tracing QWeb errors, using odoo shell, inspecting the database.
4. **`references/theme-install-gotchas.md`** — `theme_*` post-copy hook mechanism and how to re-trigger it when theme changes don't appear.

## Core Principles

1. **Match the project's existing setup.** If the project already has `docker-compose.yml`, read it first and adapt commands to its volumes, service names, and addons path. Do NOT generate a new compose file unless the project has none.

2. **Upgrade, not reinstall.** During iterative development, always use `-u <module>` to upgrade. Full reinstall (`--init`) destroys data and is rarely needed.

3. **Stop web before running one-shot commands.** `docker compose run --rm -T web odoo ...` launches a second Odoo process that fights the running `web` container for the same port and database locks. Always `docker compose stop web` first.

4. **SCSS/JS changes need cache busting.** Editing `.scss` or `.js` files and then reloading the browser shows stale content because Odoo cached the bundle in `ir.attachment`. Clear the cache and upgrade the module.

5. **Theme changes need more than upgrade.** `theme_*` modules use a copy-on-install mechanism. If the user updates snippets or layout XML, upgrading the module alone may not update the copied records. Use the post-copy re-trigger pattern from `theme-install-gotchas.md`.

6. **Logs tell you what broke.** When something goes wrong, read `docker compose logs -f --tail=200 web` before guessing. Odoo logs XML parse errors, missing references, and failed assertions clearly.

## Workflow

### Step 1: Inspect the existing setup

```bash
ls docker-compose.yml .env 2>/dev/null
cat docker-compose.yml
```

Extract:

- **Service names** — usually `web` (Odoo) and `db` (PostgreSQL). The project may use different names.
- **Container names** — `container_name:` field.
- **Addons path** — from the `command:` line, look for `--addons-path=...`.
- **Mounted volumes** — where are custom modules mounted inside the container?
- **Database name** — from `--db-filter` or `DB_NAME` env var.
- **Port** — from `ports:`.

Example from the Elite project:

```yaml
services:
  web:
    container_name: elite-arena-web
    image: varyshop/sidonio:release-1.0.6
    command: python3 odoo-bin --addons-path="addons,varyshop,/app/elite_themes" ...
    ports:
      - "${WEB_HTTP_PORT:-8172}:8069"
    volumes:
      - ./:/app/elite_themes
```

Here, the project's root directory is mounted at `/app/elite_themes`, which is part of the addons path. Any theme or module placed in the project root is automatically visible to Odoo without restarting the container.

**Write the extracted config to scratch memory** — you'll reuse it in every command below.

### Step 2: Install a new module

```bash
# Stop the running web service to avoid port/lock conflicts
docker compose stop web

# Run a one-shot install
docker compose run --rm -T web odoo \
    -i <module_name> \
    --stop-after-init \
    -d <db_name>

# Restart the web service
docker compose start web
```

**Why `docker compose run` and not `docker compose exec`?**

- `exec` runs inside the already-running container, which means two Odoo processes share the same database connection pool. Install/upgrade runs transactions that conflict with the running server.
- `run --rm` launches a fresh container from the same image, runs the command, and removes the container on exit. It owns the database exclusively for the duration.
- `-T` disables pseudo-TTY allocation, needed for scripted execution.

**For multiple modules in one shot:**

```bash
docker compose run --rm -T web odoo \
    -i base,website,theme_<brand>,<brand>_web_catalog \
    --stop-after-init \
    -d <db_name>
```

Order matters when dependencies are involved — Odoo resolves them automatically, but list them roughly in dependency order for clarity.

### Step 3: Upgrade after code changes

The iterative development loop:

```bash
# 1. Edit files in the mounted addons directory
# 2. Stop web
docker compose stop web

# 3. Upgrade the module
docker compose run --rm -T web odoo \
    -u <module_name> \
    --stop-after-init \
    -d <db_name>

# 4. Start web
docker compose start web

# 5. Refresh the browser with ?debug=assets to force asset recompilation
open "http://localhost:8172/?debug=assets"
```

**For pure Python/XML changes** (models, views, controllers), steps 2-4 are enough.

**For SCSS/JS changes**, add a cache bust before step 3:

```bash
docker compose exec -T db psql -U varyshop -d <db_name> -c \
    "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
```

Then proceed with upgrade. This removes the compiled bundle from `ir_attachment` so the next page load regenerates it from the fresh SCSS.

### Step 4: Force-recompile the frontend bundle

If SCSS changes still don't appear after upgrade + cache bust:

```bash
# Delete ALL bundle attachments, not just the ones matching a pattern
docker compose exec -T db psql -U varyshop -d <db_name> -c \
    "DELETE FROM ir_attachment WHERE name LIKE '%.css' OR name LIKE '%.js';"

# Restart web to clear in-memory caches
docker compose restart web

# Hit the site with ?debug=assets to force rebuild
curl -o /dev/null -s -w "%{http_code}\n" "http://localhost:8172/?debug=assets"
```

Alternative: use Odoo's developer tools UI. Log in as admin, toggle **Settings → Developer Tools → Force refresh browser (Ctrl + Shift + R)** — this runs the same cache bust through the UI.

### Step 5: Tail logs during development

In a separate terminal, keep logs open while you work:

```bash
docker compose logs -f --tail=200 web
```

Key log patterns to watch for:

- `ERROR odoo.modules.loading:` — module load failure, usually XML parse error or missing field
- `ParseError:` — XML syntax error, file and line reported
- `External ID not found in the system:` — referenced an xml_id that doesn't exist yet (wrong file order in manifest `data:`)
- `psycopg2.errors.UndefinedColumn:` — model field referenced in a view doesn't exist on the model
- `Cannot convert 'px,' units into 'px' units !` — editor crash from multi-value CSS (see `odoo-theme` skill)
- `TypeError: can only concatenate str (not "NoneType") to str` — usually a missing XML attribute the Python code expects

### Step 6: Drop into odoo shell

For inspecting the database, testing models, or running one-off scripts:

```bash
docker compose exec web odoo shell -d <db_name>
```

Inside the shell, `env` is already available:

```python
>>> env['product.template'].search_count([])
42

>>> env.ref('theme_elite_arena.layout_body_class').arch
'<xpath expr="//body" ...>'

>>> # Commit required for writes outside a request cycle
>>> env['res.users'].browse(2).write({'name': 'Updated'})
>>> env.cr.commit()
```

**Execute a script file:**

```bash
docker compose exec -T web odoo shell -d <db_name> < scripts/my_script.py
```

### Step 7: Debug a failed install

When `docker compose run ... -i <module>` fails, the output usually contains the error. If it's truncated:

```bash
# Save the full output
docker compose run --rm -T web odoo -i <module> --stop-after-init -d <db> 2>&1 | tee /tmp/install.log

# Search for the actual error
grep -E "(ERROR|ParseError|CRITICAL|Traceback)" /tmp/install.log
```

Common install failures and fixes:

| Error pattern | Cause | Fix |
|---|---|---|
| `ParseError: "Error while parsing view..."` | XML syntax in a view file | Read the file path in the error, fix the XML |
| `ValueError: External ID not found: module.xml_id` | Record references an ID loaded later in the manifest, or in a module not in `depends` | Reorder `data:` in manifest, or add missing dependency |
| `psycopg2.errors.DuplicateTable` | Model already exists, stale table from a previous install | Drop the table manually or run `-u <module>` instead of `-i` |
| `ImportError: cannot import name X from 'odoo'` | Using Odoo 17 API in an Odoo 18 install | Check the `odoo-python` skill for 18-specific patterns |
| `MissingError: Record does not exist or has been deleted` | Demo data references a record from a module that isn't loaded | Add the missing module to `depends` or remove the demo reference |

### Step 8: Theme-specific: re-trigger post-copy hook

`theme_*` modules use a copy-on-install mechanism (`theme.ir.ui.view` → `ir.ui.view`, `theme.website.page` → `website.page`, etc.). The post-copy hook runs ONCE when the theme is applied to a website. Subsequent `-u theme_<brand>` commands update the `theme.*` source records but may NOT re-run the copy into `website.*`.

See `references/theme-install-gotchas.md` for the full pattern. Quick version:

```bash
docker compose exec web odoo shell -d <db> <<'EOF'
# Force re-apply the theme to the current website
website = env['website'].get_current_website()
theme = env['ir.module.module'].search([('name', '=', 'theme_<brand>')])
website.theme_id = False
env.cr.commit()
theme.button_immediate_install()  # Or button_immediate_upgrade()
env.cr.commit()
EOF
```

Alternative: delete the website's applied theme and re-apply via Website → Configurator UI.

### Step 9: Database backup before risky operations

Before any migration, theme swap, or large data import:

```bash
docker compose exec -T db pg_dump -U varyshop <db_name> > backup-$(date +%Y%m%d-%H%M%S).sql
```

Restore:

```bash
docker compose exec -T db psql -U varyshop -d <db_name> < backup-20260405-143022.sql
```

For binary format (faster, smaller):

```bash
docker compose exec -T db pg_dump -U varyshop -Fc <db_name> > backup.dump
docker compose exec -T db pg_restore -U varyshop -d <db_name> --clean --if-exists < backup.dump
```

### Step 10: Fresh database for testing

When an install goes wrong and the database is in a broken state:

```bash
# Stop web to release connections
docker compose stop web

# Drop and recreate the database
docker compose exec -T db psql -U varyshop -d postgres -c "DROP DATABASE IF EXISTS <db_name>;"
docker compose exec -T db psql -U varyshop -d postgres -c "CREATE DATABASE <db_name> OWNER varyshop;"

# Install base + target modules from scratch
docker compose run --rm -T web odoo \
    -i base,web,website,theme_<brand>,<brand>_web_catalog \
    --stop-after-init \
    -d <db_name>

# Start web
docker compose start web
```

## Makefile for convenience

Drop this in the project root next to `docker-compose.yml`:

```makefile
# Makefile — Odoo dev shortcuts
DB ?= elite
MODULE ?=

.PHONY: up down logs shell install upgrade bust restart fresh backup

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200 web

shell:
	docker compose exec web odoo shell -d $(DB)

install:
	@test -n "$(MODULE)" || (echo "Usage: make install MODULE=<name>"; exit 1)
	docker compose stop web
	docker compose run --rm -T web odoo -i $(MODULE) --stop-after-init -d $(DB)
	docker compose start web

upgrade:
	@test -n "$(MODULE)" || (echo "Usage: make upgrade MODULE=<name>"; exit 1)
	docker compose stop web
	docker compose run --rm -T web odoo -u $(MODULE) --stop-after-init -d $(DB)
	docker compose start web

bust:
	docker compose exec -T db psql -U varyshop -d $(DB) -c \
		"DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
	docker compose restart web

restart:
	docker compose restart web

fresh:
	docker compose stop web
	docker compose exec -T db psql -U varyshop -d postgres -c "DROP DATABASE IF EXISTS $(DB);"
	docker compose exec -T db psql -U varyshop -d postgres -c "CREATE DATABASE $(DB) OWNER varyshop;"
	docker compose run --rm -T web odoo -i base,website,theme_$(BRAND) --stop-after-init -d $(DB)
	docker compose start web

backup:
	docker compose exec -T db pg_dump -U varyshop $(DB) > backup-$$(date +%Y%m%d-%H%M%S).sql
```

Usage:

```bash
make upgrade MODULE=theme_elite_arena
make bust
make logs
make shell
```

## Key Gotchas

- **Never `docker compose exec web odoo -i/-u ...`** — always use `run --rm` for install/upgrade. Exec shares the database connection pool with the running server and causes transaction conflicts.
- **Always `docker compose stop web` before `run --rm`** — two Odoo processes fighting over the same port and database cause serialization errors and partial installs.
- **`--stop-after-init`** is required on one-shot commands — otherwise the container stays up trying to serve HTTP and you can't chain the next command.
- **SCSS changes need `DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%'`** — just upgrading the module leaves the old compiled bundle in place.
- **`?debug=assets` query parameter** forces asset rebuild on the next page load, which is the user-facing equivalent of the SQL cache bust.
- **`--dev=xml,qweb,reload`** in the command args makes Odoo re-read XML templates on every request (no restart needed for view changes). Great for iterative view development, terrible for production.
- **`theme_*` upgrade doesn't always reapply** — Odoo's copy-on-install mechanism may leave stale copies in `website.page` / `ir.ui.view`. If your changes don't appear, use the re-trigger pattern from `theme-install-gotchas.md`.
- **PostgreSQL volume persists across `docker compose down`** — use `docker compose down -v` to also delete the database volume. Otherwise data survives restarts (which is usually what you want).
- **Logs can get huge fast** — `docker compose logs` without `--tail` dumps everything since container start. Always use `--tail=200` or similar.
- **Windows + WSL2 bind mounts are slow** — module upgrades can take 10x longer than on Linux/macOS due to filesystem I/O. Consider moving the project into the WSL filesystem instead of `/mnt/c/...`.
- **Odoo reads the manifest on startup, not on upgrade** — if you add a new file to the `data:` list, you must RESTART the web service (or do a full upgrade) for Odoo to notice the new file. Just editing an existing file in the list doesn't require a restart with `--dev=reload`.
- **`/_custom/` SCSS attachments are NOT cache** — `ir_attachment` records with URLs matching `/_custom/web.assets_*/...` are SCSS customizations created by the website editor (color palette overrides, user value overrides). They are referenced by `ir_asset` records. **NEVER delete them when clearing asset cache.** The safe cache-clearing pattern is: `DELETE FROM ir_attachment WHERE url LIKE '%/web/assets/%';` — this matches compiled bundles (`/web/assets/1/abc123/...`) but NOT `/_custom/...` paths. If you accidentally delete `_custom` attachments, the SCSS compiler fails with errors like `Could not get content for /_custom/web.assets_frontend/...` and NO CSS loads on the frontend.
- **`ir_attachment.db_datas` is bytea — encoding matters** — When manually inserting `ir_attachment` records via SQL, the `db_datas` column is `bytea`. Using `encode('/* empty */', 'base64')::bytea` does NOT store decoded binary — it stores the base64 TEXT as literal bytes. The SCSS compiler then reads the literal base64 string (e.g. `LyogZW1wdHkgKi8=`) as SCSS source, which causes compilation errors. To store actual content: `decode(encode('/* empty */', 'base64'), 'base64')` or just use Odoo ORM instead of raw SQL.
- **Orphan `ir_model_data` after manual record deletion** — If you manually `DELETE FROM theme_ir_asset WHERE id = X` (or any model), the corresponding `ir_model_data` row survives. On next module upgrade, Odoo tries to read the deleted record and crashes with `MissingError: Record does not exist or has been deleted. (Record: theme.ir.asset(X,), User: 1)`. **Fix:** Always delete both: `DELETE FROM ir_model_data WHERE model = 'theme.ir.asset' AND res_id = X;` then `DELETE FROM theme_ir_asset WHERE id = X;`. Or better: use Odoo shell `env['theme.ir.asset'].browse(X).unlink()` which handles cleanup automatically.
- **JS in manifest `assets` dict vs `theme.ir.asset`** — Theme modules can register JS via `__manifest__.py`'s `assets` dict (e.g. `'web.assets_frontend': ['theme_x/static/src/js/main.js']`) OR via `theme.ir.asset` records in XML. The manifest approach creates `ir_asset` records directly on install. If you switch from `theme.ir.asset` XML to manifest `assets`, you must clean up the old `ir_model_data` entry for the removed XML record, otherwise module upgrade crashes.
- **`docker exec` upgrade shortcut** — When the web container is already running and has the DB connection params in its environment/command, you can upgrade without stop/run/start cycle: `docker exec <web-container> odoo -d <db> -u <module> --stop-after-init --no-http --db_host=<db-container> --db_user=<user> --db_password=<pass>`. This runs inside the existing container. Follow with cache bust + `docker restart <web-container>`. Faster for iterative development than the full `docker compose stop/run/start` flow.
- **SCSS/JS changes require THREE steps, not just restart** — After editing SCSS or JS: (1) upgrade module (`-u`), (2) restart container (3) load with '?debug=assets' parameter to trigger asset rebuild. Skipping any step shows stale content. A common mistake is restarting without upgrading — the module XML/assets aren't reloaded, just the Python process.
