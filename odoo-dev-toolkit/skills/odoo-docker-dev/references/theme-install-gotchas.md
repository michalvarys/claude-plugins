# Theme Install Gotchas (post-copy mechanism)

`theme_*` modules behave differently from normal modules because Odoo runs a **copy-on-install** step that duplicates theme records into per-website runtime tables. Once copied, subsequent `-u theme_<brand>` commands update the source records but MAY NOT propagate to the copies — which is why "I upgraded but the site hasn't changed" is the single most common theme-development frustration.

This file explains what happens, why, and how to force a re-copy when you need one.

## The copy-on-install mechanism

A `theme_*` module declares its data using `theme.*` models:

| Theme-side model | Runtime model |
|---|---|
| `theme.ir.ui.view` | `ir.ui.view` (with `website_id` set) |
| `theme.website.page` | `website.page` |
| `theme.website.menu` | `website.menu` |
| `theme.ir.attachment` | `ir.attachment` |
| `theme.ir.asset` | `ir.asset` |

When you install the theme to a website:

1. Odoo reads the `theme.*` source records from the module's XML files.
2. Odoo **copies** each one into the corresponding runtime model, attaching it to the current `website_id`.
3. From then on, the website renders from the runtime copies, NOT from the theme source.

**Why this exists:** multi-website setups. Two websites can share the same theme module but have independently edited pages/views. The copy-on-install isolates them from each other and from subsequent upstream theme changes.

**Consequence for developers:** editing a `theme.website.page` in your module and upgrading the module updates the source. The runtime copy stays untouched. The user still sees the OLD content.

## When a plain `-u` works vs. doesn't

### Works (source records only)

Plain `-u theme_<brand>` DOES update:

- `ir.asset` records loaded via `theme.ir.asset` — these are shared across websites, so the runtime version gets updated.
- Views that are NOT per-website (rare in themes, common in modules). Check whether the view's `theme.ir.ui.view` has a `copy_ids` relation on its runtime counterpart.
- Static assets (SCSS, JS files under `static/src/`) — these are served directly from disk, not copied.

So: if you edit SCSS, JS, ir_asset.xml, or snippet templates that are re-read each request, a normal upgrade + cache bust is enough.

### Doesn't work (copied records)

Plain `-u theme_<brand>` does NOT update:

- `website.page` records that were copied from `theme.website.page` on install — including the homepage and any static pages.
- `ir.ui.view` records that were copied per-website.
- `website.menu` items that were copied.
- Any `theme.ir.attachment` → `ir.attachment` copies.

For these, you need the re-copy trigger below.

## Forcing a re-copy

### Option A: Delete the runtime copy, then upgrade

This is the surgical approach — you nuke just the record you care about and let Odoo re-create it from the theme source on next upgrade.

```bash
docker compose exec web odoo shell -d elite <<'EOF'
# Delete the runtime page so the next theme install re-copies it
pages = env['website.page'].search([
    ('url', '=', '/'),
    ('website_id', '=', 1),
])
pages.unlink()
env.cr.commit()
EOF

# Now upgrade — Odoo will re-copy the theme source
docker compose stop web
docker compose run --rm -T web odoo -u theme_elite_arena --stop-after-init -d elite
docker compose start web
```

### Option B: Full theme re-apply

Nuclear option — unapply and re-apply the entire theme to the website. Loses any in-editor changes the user made.

```bash
docker compose exec web odoo shell -d elite <<'EOF'
website = env['website'].browse(1)

# Un-apply the theme
website.theme_id = False
env.cr.commit()

# Re-install the theme (triggers copy-on-install)
theme = env['ir.module.module'].search([('name', '=', 'theme_elite_arena')])
theme.button_immediate_install()
env.cr.commit()
EOF
```

**When to use this:** after major theme restructuring (renamed pages, changed URL slugs, added new snippets) where surgical cleanup would miss something.

### Option C: Delete all theme copies for this website

Delete every runtime record that came from the theme, then upgrade.

```bash
docker compose exec web odoo shell -d elite <<'EOF'
# Delete every website.page owned by this website AND derived from the theme
env.cr.execute("""
    DELETE FROM website_page
    WHERE website_id = 1
      AND view_id IN (
          SELECT id FROM ir_ui_view WHERE key LIKE 'theme_elite_arena.%'
      );
""")

# Delete every theme-originating view for this website
env.cr.execute("""
    DELETE FROM ir_ui_view
    WHERE key LIKE 'theme_elite_arena.%'
      AND website_id = 1;
""")

env.cr.commit()
EOF

# Upgrade
docker compose run --rm -T web odoo -u theme_elite_arena --stop-after-init -d elite
```

More aggressive than Option A, less aggressive than Option B. Use when Option A is tedious (many pages to clean) and Option B is too destructive.

## Post-install hook

For things that `theme.*` models can't express, use a post-install hook. Common use cases:

- Delete Odoo's default `website.homepage` so your theme homepage becomes THE homepage
- Set the website's name, logo, social links programmatically
- Seed demo content that isn't a page (e.g., products, ribbons, categories)
- Configure `ir.config_parameter` values

### Pattern

```python
# models/theme_elite_arena.py
from odoo import models

class ThemeEliteArena(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_elite_arena_post_copy(self, mod):
        """Runs after the theme is copied to a website.

        `mod` is the ir.module.module record for theme_elite_arena.
        `self` is the theme.utils helper bound to a specific website.
        """
        # Delete the default homepage that Odoo ships with
        website = self.env['website'].get_current_website()
        default_home = self.env.ref('website.homepage_page', raise_if_not_found=False)
        if default_home and default_home.website_id == website:
            default_home.unlink()

        # Set the website name
        website.name = 'Elite Arena'

        # Configure parameters
        self.env['ir.config_parameter'].sudo().set_param('website.logo', '/theme_elite_arena/static/src/img/logo.png')

        return super()._theme_elite_arena_post_copy(mod) if hasattr(super(), '_theme_elite_arena_post_copy') else None
```

### Naming convention

The method MUST be named `_theme_<module_name>_post_copy`. Odoo's `theme.utils` model dispatches to it by name after the copy-on-install step.

### When does it run?

- On first install of the theme to a website (first `button_immediate_install` or first UI theme selection)
- On re-apply after `website.theme_id = False` + re-install
- **NOT** on plain `-u <module>` upgrades — which is the whole reason this file exists

### Making post-copy idempotent

Re-running the hook should be safe. Use `search` + `filter` + conditional actions:

```python
def _theme_elite_arena_post_copy(self, mod):
    website = self.env['website'].get_current_website()

    # Only delete default homepage once
    default_home = self.env.ref('website.homepage_page', raise_if_not_found=False)
    if default_home and default_home.website_id == website:
        default_home.unlink()

    # Only set name if still the default
    if website.name == 'My Website':
        website.name = 'Elite Arena'

    # Only seed ribbons if missing
    if not self.env['product.ribbon'].search([('name', '=', 'NEW')]):
        self.env['product.ribbon'].create({
            'name': 'NEW',
            'bg_color': '#ff6a00',
            'text_color': '#ffffff',
        })
```

## Diagnosing "theme changes don't appear"

Decision tree:

1. **Did you edit SCSS, JS, or a snippet template?**
   - Yes → Bust the asset cache and upgrade. Should work.
     ```bash
     docker compose exec -T db psql -U varyshop -d elite -c \
         "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
     docker compose run --rm -T web odoo -u theme_elite_arena --stop-after-init -d elite
     ```
   - No → continue.

2. **Did you edit a `theme.website.page` or `theme.ir.ui.view` XML record?**
   - Yes → the runtime copy is stale. Use Option A (delete the runtime copy, upgrade) or Option B (full re-apply).
   - No → continue.

3. **Did you edit the `_post_copy` hook?**
   - Yes → you need to re-trigger the hook via Option B. Plain upgrade doesn't re-run post_copy.
   - No → continue.

4. **Is the change visible in the DB but not the browser?**
   - Check `?debug=assets` and hard refresh.
   - Check `docker compose logs web` for cache issues.
   - Check whether multi-website is in play — maybe you upgraded but the wrong website is viewed.

## Verification after re-apply

```python
# In odoo shell
>>> homepage = env.ref('theme_elite_arena.homepage', raise_if_not_found=False)
>>> homepage
theme.website.page(5,)  # This is the THEME record, not the runtime copy

>>> runtime = env['website.page'].search([
...     ('url', '=', '/'),
...     ('website_id', '=', 1),
... ])
>>> runtime
website.page(42,)
>>> runtime.view_id.arch_fs  # Path to the underlying XML file
'theme_elite_arena/views/pages.xml'
```

If `runtime.view_id.arch_fs` points to your updated XML, the copy took. If it still points to the old file or is empty, the copy didn't happen — re-run the re-apply.

## Never do this

- **Don't edit `website.page` records directly via XML in the theme.** Themes use `theme.website.page`; Odoo handles the copy. Editing `website.page` directly creates records that don't have the theme back-reference and can't be cleanly re-copied.

- **Don't use `noupdate="0"` on theme data files.** All theme XML should be loaded with `noupdate="1"` (or in a `<data>` block without noupdate, since the theme-copy mechanism handles updates differently). `noupdate="0"` on theme data can cause double-copies.

- **Don't rely on `ir.model.data` XML IDs for runtime-copy records.** The XML ID belongs to the theme source. The runtime copy gets its own auto-generated XML ID like `__website_<id>_<source_id>`. Always search by `website_id` + URL/name, not by `env.ref()` on the theme ID.

- **Don't mix theme + non-theme data in the same module.** If your module needs `ir.model.access.csv`, record rules, or custom models, put them in a separate `<brand>_web_catalog` or `<brand>_base` module. Theme modules are copy-on-install; non-theme modules are update-in-place. Mixing breaks both.
