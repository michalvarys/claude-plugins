# Install / Upgrade / Reload Commands

Definitive command reference for the iterative development loop. Everything here assumes the Elite-style compose setup (service `web`, database `elite`, user `varyshop`, host root mounted at `/app/elite_themes`). Substitute the values from the project's actual `docker-compose.yml`.

## The golden rule

**Stop the running web container before any install/upgrade.**

```bash
docker compose stop web
docker compose run --rm -T web odoo -u <module> --stop-after-init -d <db>
docker compose start web
```

Why this exact pattern:

1. **`stop web`** — releases the HTTP port and the database locks held by the long-running server.
2. **`run --rm -T`** — launches a *new* container from the same image, not inside the existing one. `--rm` auto-deletes it on exit. `-T` disables TTY allocation so the command works in scripts and CI.
3. **`--stop-after-init`** — after the module(s) finish installing/upgrading, exit instead of starting the HTTP server. Without this, the one-shot container stays up and the next command can't start.
4. **`start web`** — bring the long-running server back up with the updated code loaded.

## Install a new module

```bash
docker compose stop web
docker compose run --rm -T web odoo \
    -i <module_name> \
    --stop-after-init \
    -d elite
docker compose start web
```

### Multiple modules in one shot

```bash
docker compose run --rm -T web odoo \
    -i base,website,website_sale,theme_elite_arena,elite_web_catalog \
    --stop-after-init \
    -d elite
```

Odoo resolves dependencies automatically, but listing them roughly in dependency order (core → website → theme → catalog) makes the log easier to read when something fails.

### Install into a fresh database

If the database doesn't exist yet, Odoo will create it on the first `-i` command. The database user (`varyshop`) needs `CREATEDB` permission, which the standard Postgres image grants by default.

```bash
# The database 'elite' doesn't exist yet
docker compose run --rm -T web odoo \
    -i base,web,website \
    --stop-after-init \
    -d elite \
    --without-demo=all
```

**`--without-demo=all`** skips demo data. Almost always what you want outside of exploratory demos — demo data adds 50+ records per module and noise to your tests.

## Upgrade after code changes

The normal iterative loop:

```bash
# 1. Edit files in the mounted directory (on the host)
vim theme_elite_arena/views/pages.xml

# 2. Run upgrade
docker compose stop web
docker compose run --rm -T web odoo \
    -u theme_elite_arena \
    --stop-after-init \
    -d elite
docker compose start web

# 3. Reload the browser (force refresh if SCSS/JS changed)
```

### Upgrade multiple modules at once

```bash
docker compose run --rm -T web odoo \
    -u theme_elite_arena,elite_web_catalog \
    --stop-after-init \
    -d elite
```

### Upgrade everything (use sparingly)

```bash
docker compose run --rm -T web odoo \
    -u all \
    --stop-after-init \
    -d elite
```

This re-runs every installed module's upgrade step. Useful after a git pull that touched many modules, or after a core Odoo version bump. Slow (minutes on medium databases).

## Cache-busting for SCSS / JS changes

Odoo compiles all `.scss` and `.js` files into aggregate bundles and stores them as `ir.attachment` records with URLs like `/web/assets/abc123/web.assets_frontend.min.css`. After you edit an SCSS file and upgrade the module, the old compiled bundle is STILL cached. The browser loads stale CSS.

**Fix:** delete the cached bundles before the upgrade, or force a rebuild with the `?debug=assets` URL parameter.

### SQL cache bust (most reliable)

```bash
docker compose exec -T db psql -U varyshop -d elite -c \
    "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
```

This is safe to run any time — Odoo regenerates the bundles on the next page load. Nothing is lost.

### Sequence: bust → upgrade → refresh

```bash
# 1. Bust the asset cache
docker compose exec -T db psql -U varyshop -d elite -c \
    "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"

# 2. Upgrade the module
docker compose stop web
docker compose run --rm -T web odoo -u theme_elite_arena --stop-after-init -d elite
docker compose start web

# 3. Open with ?debug=assets to force the browser to re-fetch uncached
open "http://localhost:8172/?debug=assets"
```

### Why `?debug=assets` alone isn't enough

`?debug=assets` tells Odoo "don't serve bundled assets, serve each file individually so I can inspect them in the browser". It does NOT delete the existing compiled bundle. So:

- `?debug=assets` — great for debugging, seeing source maps, and verifying your SCSS edits
- SQL bust — actually removes the stale bundle so the NEXT non-debug visit also gets fresh CSS

Use both during active development.

### The harder hammer

If `DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%'` doesn't clear it (rare edge cases with multi-website setups):

```bash
docker compose exec -T db psql -U varyshop -d elite -c \
    "DELETE FROM ir_attachment WHERE name LIKE '%.css' OR name LIKE '%.js';"
docker compose restart web
```

This deletes ALL CSS/JS attachments, not just the /web/assets/ ones. Includes editor-uploaded custom CSS, so use with care.

## Install with `-i` vs upgrade with `-u` — when to use which

| Scenario | Command |
|---|---|
| First time installing this module | `-i <module>` |
| You edited code in an already-installed module | `-u <module>` |
| You added a new XML file to `data:` in manifest | `-u <module>` (Odoo re-reads the manifest) |
| You added a new model field (Python) | `-u <module>` (runs schema migration) |
| You added a brand-new module to the project | `-i <module>` |
| Module is stuck in a half-installed state | `-i <module>` as a last resort (may lose data) |
| You want to re-run data files only | `-u <module>` (data files are always re-processed) |

**Never routinely use `-i` on an installed module.** It re-runs `init` SQL, which can truncate tables with `noupdate="0"` data, deleting user edits. `-u` is the safe default.

## Passing multiple flags — script pattern

For convenience, wrap the sequence in a shell function or Makefile target:

```bash
# In ~/.bashrc or a project-local .envrc
odoo-upgrade() {
    local module=$1
    local db=${2:-elite}
    docker compose stop web
    docker compose run --rm -T web odoo -u "$module" --stop-after-init -d "$db"
    docker compose start web
}

odoo-bust() {
    local db=${1:-elite}
    docker compose exec -T db psql -U varyshop -d "$db" -c \
        "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
}

# Usage:
odoo-upgrade theme_elite_arena
odoo-bust
```

Or use the Makefile from the main SKILL.md.

## Common failures and fixes

### `FATAL: database "elite" does not exist`

The database hasn't been created. Either install with `-i base` to let Odoo create it, or create it manually:

```bash
docker compose exec -T db psql -U varyshop -d postgres -c \
    "CREATE DATABASE elite OWNER varyshop;"
```

### `psycopg2.errors.SerializationFailure: could not serialize access`

Two Odoo processes are fighting over the database. This means `web` was still running when you ran `docker compose run`. Stop web and retry:

```bash
docker compose stop web
# Retry the command
```

### `could not bind to 0.0.0.0:8069: address already in use`

`docker compose run` is trying to start Odoo's HTTP server (because you forgot `--stop-after-init`), and port 8069 is held by something. Add `--stop-after-init`.

### `ModuleNotFoundError: <module>`

Odoo can't find the module in the addons path. Check:

1. Is the module folder on the host at the location mounted into `/app/elite_themes`?
2. Does the folder contain `__manifest__.py`?
3. Is `/app/elite_themes` in the `--addons-path` argument?

```bash
# Verify the mount is working
docker compose exec web ls /app/elite_themes/theme_elite_arena/__manifest__.py
```

### `ParseError: while parsing .../views/foo.xml`

The error output names the file and usually the line. Open it, fix the XML, re-run the upgrade. XML errors are always explicit — Odoo reports them early.

### `External ID not found in the system: module.xml_id`

A `ref="..."` or `env.ref(...)` references an XML ID that doesn't exist. Causes:

- **Wrong load order** — record A references record B, but B is in a file loaded later in `data:`. Reorder the manifest `data:` list.
- **Missing dependency** — B is in another module that isn't in `depends`. Add it.
- **Typo** — check for typos in the ID.

### Upgrade succeeds but changes don't appear

Three possibilities:

1. **SCSS cache** — run the SQL bust.
2. **Browser cache** — hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) or `?debug=assets`.
3. **Theme post-copy** — the module is a `theme_*` and the record you edited was copied to `website.page` / `ir.ui.view` on first install. Subsequent upgrades don't re-copy. See `theme-install-gotchas.md`.

## Best practices checklist

Before declaring an upgrade "done":

- [ ] `docker compose logs --tail=100 web` shows no ERROR / CRITICAL lines from the last minute
- [ ] Browser loads the affected page with fresh CSS (verified via `?debug=assets` or hard refresh)
- [ ] Any new records you expected to exist are queryable in `odoo shell`
- [ ] The module version in `__manifest__.py` was bumped if this is a release (not strictly required for dev, but good habit)
