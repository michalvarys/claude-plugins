# Debug Workflows

Techniques for diagnosing Odoo failures in the dockerized dev environment. Ordered roughly from "cheap and first" to "heavy and last".

## 1. Read the logs before guessing

Odoo's logs are verbose and informative. Always check them FIRST when something breaks.

```bash
# Tail the last 200 lines and follow
docker compose logs -f --tail=200 web

# Just the last errors
docker compose logs --tail=500 web | grep -E "(ERROR|CRITICAL|Traceback)"

# Logs since a specific time
docker compose logs --since=5m web
```

### Key log patterns

| Pattern | Meaning | First thing to try |
|---|---|---|
| `ERROR odoo.modules.loading: Module <name>: module not loaded` | Manifest invalid or one of its data files crashed | Check the line ABOVE — it names the file and line |
| `ParseError: "Error while parsing view..."` | XML syntax error | Open the reported file, fix the XML |
| `ValueError: External ID not found in the system: X.Y` | Referenced `xml_id` missing | Check `depends:` in manifest, check `data:` load order |
| `psycopg2.errors.UndefinedColumn` | View references a field not on the model | Model out of sync; run `-u <module>` |
| `psycopg2.errors.SerializationFailure` | Two processes writing same row | You forgot to `stop web` before `run --rm` |
| `Cannot convert 'px,' units into 'px' units !` | Editor crash: multi-value CSS (`transition`, `box-shadow`) | See odoo-theme skill — rewrite CSS to single values |
| `TypeError: can only concatenate str (not "NoneType") to str` | Missing XML attribute Python expected | Check recent XML edits for removed attributes |
| `Got singleton X but expected Y records` | `.id` or `.name` called on a recordset with multiple records | Add `.ensure_one()` or use `.ids` / `.mapped(...)` |
| `AccessError: You are not allowed to ...` | `ir.model.access.csv` missing group permission | Add the group to the CSV |
| `MissingError: Record does not exist or has been deleted` | XML references a record removed via `noupdate="0"` | Check what's in the DB with `env.ref(..., raise_if_not_found=False)` |

### Getting the full traceback

Docker logs sometimes truncate long stack traces. To get the full thing:

```bash
docker compose run --rm -T web odoo -u <module> --stop-after-init -d elite 2>&1 | tee /tmp/upgrade.log
less /tmp/upgrade.log
```

## 2. Verify state in odoo shell

`odoo shell` is a Python REPL with a pre-loaded `env` object. Use it to inspect records, test methods, and verify assumptions.

```bash
docker compose exec web odoo shell -d elite
```

### Useful snippets

```python
# Is the module installed?
>>> env['ir.module.module'].search([('name', '=', 'theme_elite_arena')]).state
'installed'

# What fields does a model have?
>>> list(env['product.template']._fields.keys())
['id', 'name', 'description', ...]

# Look up a record by XML ID
>>> env.ref('theme_elite_arena.homepage')
website.page(42,)

# Look up without raising if missing
>>> env.ref('theme_elite_arena.homepage', raise_if_not_found=False)
website.page(42,)  # or False

# Search with a domain
>>> env['website.page'].search([('website_id', '=', 1)]).mapped('name')
['Home', 'About', 'Contact']

# Check an attachment
>>> env['ir.attachment'].search_count([('url', 'like', '/web/assets/%')])
17

# Inspect view architecture
>>> print(env.ref('theme_elite_arena.layout_body_class').arch)
<xpath expr="//body" position="attributes">...</xpath>

# Write requires commit outside request cycle
>>> user = env['res.users'].browse(2)
>>> user.write({'name': 'Admin Updated'})
>>> env.cr.commit()
```

### Running a script file

```bash
docker compose exec -T web odoo shell -d elite < scripts/debug_check.py
```

Where `scripts/debug_check.py`:

```python
# scripts/debug_check.py
products = env['product.template'].search([('is_published', '=', True)])
print(f"Published products: {len(products)}")
for p in products[:5]:
    print(f"  - {p.name}: {p.list_price} {p.currency_id.name}")
    print(f"    categories: {p.public_categ_ids.mapped('name')}")
    print(f"    has image: {bool(p.image_1920)}")
```

Scripts are a great way to write one-off diagnostic queries without polluting shell history.

## 3. Debug a crashed install

When `docker compose run ... -i <module>` or `-u <module>` fails:

### Step 1: Capture the full output

```bash
docker compose run --rm -T web odoo -u <module> --stop-after-init -d elite 2>&1 | tee /tmp/install.log
```

### Step 2: Find the actual error

```bash
grep -nE "(ERROR|ParseError|CRITICAL|Traceback|ValueError|MissingError)" /tmp/install.log
```

### Step 3: Locate the file

The error line usually contains a file path. Open it:

```
ParseError: while parsing /app/elite_themes/theme_elite_arena/views/pages.xml:42
```

`/app/elite_themes/theme_elite_arena/views/pages.xml:42` is inside the container. On the host (because of the bind mount), it's `./theme_elite_arena/views/pages.xml:42`. Open and fix.

### Step 4: Re-run just the upgrade

```bash
docker compose run --rm -T web odoo -u <module> --stop-after-init -d elite
```

Iterate until clean.

## 4. Debug editor crashes (website editor)

The website editor is a JavaScript SPA that crashes loudly when it encounters CSS it can't parse. The classic symptoms:

- Clicking a snippet opens a blank options panel
- Console shows `Cannot convert 'px,' units into 'px' units !`
- Editing a text block, the options sidebar is empty
- Save button is dead

Almost always the cause is **multi-value CSS properties** being parsed by the `ShadowOption`, `TransitionOption`, or `FilterOption` widgets. They expect single values and choke on comma-separated lists.

### Diagnosis

Open browser DevTools → Console. Look for JS errors. The message names the failing property (`box-shadow`, `transition`, `filter`).

Find the offending rule by inspecting the element:

```bash
# In browser DevTools → Elements
# Click the element whose editor options are broken
# Look at Computed Styles → box-shadow / transition / filter
# If they are multi-value, that's the culprit
```

### Fix

Rewrite the CSS to single values. See the `odoo-theme` skill → `references/theme-scss-architecture.md` for the full list of what to avoid.

Quick version:

```scss
/* ❌ Crashes editor */
.card {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.05);
    transition: opacity 0.3s ease, transform 0.5s ease;
}

/* ✅ Editor-safe */
.card {
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}
```

After fixing the SCSS:

```bash
docker compose exec -T db psql -U varyshop -d elite -c \
    "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
docker compose stop web
docker compose run --rm -T web odoo -u theme_elite_arena --stop-after-init -d elite
docker compose start web
```

Reload the editor. Options panel should work.

## 5. Trace QWeb template rendering

QWeb is Odoo's template engine. When a page renders wrong, you usually want to know which template produced a given HTML chunk.

### Inspect the rendered template tree

Add `?debug=1` to the URL, then right-click an element in the browser → "Inspect QWeb" (available in debug mode on Odoo 18). It shows the template hierarchy.

### Read the template source

```python
# In odoo shell
>>> print(env.ref('theme_elite_arena.product_card').arch)
```

### Force a re-render

```bash
# Clear QWeb cache and restart
docker compose exec -T db psql -U varyshop -d elite -c \
    "DELETE FROM ir_attachment WHERE name LIKE 'web.assets_qweb%';"
docker compose restart web
```

With `--dev=qweb` in the compose command, QWeb templates re-parse on every request — no cache bust needed.

## 6. Inspect the database directly

For quick queries that don't need the ORM:

```bash
docker compose exec -T db psql -U varyshop -d elite
```

### Useful queries

```sql
-- What modules are installed?
SELECT name, state FROM ir_module_module WHERE state = 'installed' ORDER BY name;

-- What views does a module own?
SELECT id, name, model, type FROM ir_ui_view
WHERE module = 'theme_elite_arena' OR key LIKE 'theme_elite_arena.%';

-- What website pages exist?
SELECT p.id, p.url, p.website_published, v.name
FROM website_page p JOIN ir_ui_view v ON v.id = p.view_id
WHERE p.website_id = 1;

-- Cached asset bundles
SELECT id, name, url, length(datas) AS size
FROM ir_attachment WHERE url LIKE '/web/assets/%' ORDER BY id DESC LIMIT 10;

-- All products with image status
SELECT id, name, list_price, is_published, (image_1920 IS NOT NULL) AS has_image
FROM product_template WHERE sale_ok = true LIMIT 20;

-- Security groups and their users
SELECT g.id, g.name, u.login
FROM res_groups g
JOIN res_groups_users_rel r ON r.gid = g.id
JOIN res_users u ON u.id = r.uid
WHERE g.name ILIKE '%content%';
```

### Dangerous queries (use carefully)

```sql
-- Drop a stuck module state so you can reinstall
UPDATE ir_module_module SET state = 'uninstalled' WHERE name = 'theme_elite_arena';
-- Then re-run: docker compose run --rm -T web odoo -i theme_elite_arena ...

-- Delete all website pages for a theme (to force post-copy re-run)
-- ONLY if you know what you're doing
DELETE FROM website_page WHERE view_id IN (
    SELECT id FROM ir_ui_view WHERE key LIKE 'theme_elite_arena.%'
);
```

Always `BEGIN; ... ; ROLLBACK;` a risky query first to see what it would affect:

```sql
BEGIN;
DELETE FROM website_page WHERE ...;
-- If the row count looks right:
COMMIT;
-- If not:
ROLLBACK;
```

## 7. Attach a Python debugger

For deep debugging of Python code, drop a breakpoint and reconnect.

### Step 1: Enable debug connections in compose

Add to the `web` service:

```yaml
stdin_open: true
tty: true
```

And expose a debugger port if using `debugpy`:

```yaml
ports:
  - "5678:5678"
```

### Step 2: Add a breakpoint in your code

```python
# In your Python file
import pdb; pdb.set_trace()  # or: breakpoint()
```

### Step 3: Attach

```bash
docker attach <container_name>
```

When the code path hits the breakpoint, you drop into `pdb`. Use `n` (next), `s` (step), `c` (continue), `p <var>` (print).

**Detach without stopping the container:** Ctrl+P then Ctrl+Q. If you Ctrl+C, you kill the Odoo process inside.

### debugpy (VSCode)

For VSCode integration, use `debugpy` instead of pdb:

```python
import debugpy
debugpy.listen(("0.0.0.0", 5678))
debugpy.wait_for_client()
breakpoint()
```

And a VSCode `launch.json`:

```json
{
    "type": "python",
    "request": "attach",
    "name": "Attach to Odoo",
    "connect": { "host": "localhost", "port": 5678 },
    "pathMappings": [
        { "localRoot": "${workspaceFolder}", "remoteRoot": "/app/elite_themes" }
    ]
}
```

## 8. Inspect a specific request

When a page loads slowly or throws 500, enable request-level logging:

```bash
# Add --log-handler='odoo.http:DEBUG' temporarily
docker compose run --rm -T web odoo --log-handler='odoo.http:DEBUG' -d elite
```

Or use the browser's Network tab: failed requests show the traceback in the response body when Odoo is in dev mode.

## 9. Last resort: fresh database

If state is corrupted beyond repair:

```bash
docker compose stop web
docker compose exec -T db psql -U varyshop -d postgres -c "DROP DATABASE IF EXISTS elite;"
docker compose exec -T db psql -U varyshop -d postgres -c "CREATE DATABASE elite OWNER varyshop;"
docker compose run --rm -T web odoo \
    -i base,web,website,website_sale,theme_elite_arena,elite_web_catalog \
    --stop-after-init \
    -d elite \
    --without-demo=all
docker compose start web
```

**BACKUP FIRST** if there's anything worth keeping:

```bash
docker compose exec -T db pg_dump -U varyshop elite > elite-backup-$(date +%Y%m%d-%H%M%S).sql
```

## Debug mental model

1. **Symptom → log** — always start with `docker compose logs --tail=200 web`
2. **Log → file** — errors name the file; open it
3. **File → hypothesis** — understand what changed recently (`git diff`)
4. **Hypothesis → shell** — verify assumptions with `odoo shell`
5. **Fix → upgrade → verify** — upgrade the module, verify in browser or shell
6. **If stuck → fresh DB** — rule out state corruption as a variable

Don't skip steps 1-2. "Let me just try a few things" without reading the logs wastes more time than reading them would have taken.
