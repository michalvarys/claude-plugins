# Theme Responsive Validation

Validates that an Odoo theme module renders identically to the reference static site across all breakpoints. This skill is the final gate before a theme migration is declared complete — it blocks release until every section matches the reference at every viewport width.

## When to use

- After `static-to-odoo-theme` generates the theme module and it installs successfully
- After any CSS/SCSS change to an existing theme
- As the final step of the `web-to-odoo` pipeline (Stage 4.5, after install, before handoff)

## Prerequisites

1. The theme module is installed and running in a Docker Odoo instance (use `odoo-docker-dev` skill)
2. The reference static site is accessible (either locally via `file://` or hosted, e.g., GitHub Pages)
3. A Chrome/Chromium browser is connected via the `chromedebug` MCP tool (or screenshots can be taken manually)

## Before you start

Read these reference files:

1. `references/responsive-validation-checklist.md` — The full checklist of what to verify at each breakpoint
2. `references/css-comparison-protocol.md` — Step-by-step protocol for comparing reference CSS to Odoo SCSS, identifying discrepancies, and fixing them

## Core Principles

1. **The reference site is the source of truth.** If the reference doesn't have a mobile override for a section, the Odoo theme must NOT add one. Extra overrides are the #1 cause of broken mobile layouts.
2. **Compare CSS rule-by-rule, not visually.** Visual checks catch obvious issues but miss subtle spacing/font-size differences. Always do a systematic CSS comparison first, then verify visually.
3. **Asset load order matters.** In Odoo, `responsive.scss` must load AFTER `theme.scss` in the compiled output. Use `sequence` fields on `theme.ir.asset` records to guarantee this (e.g., theme=100, responsive=200). Verify by inspecting the compiled CSS rule index in the browser.
4. **Never add overrides that don't exist in the reference.** The most common mistake is adding "helpful" mobile overrides (shrinking fonts, reducing padding, hiding elements) that the reference site doesn't have. These make sections look cramped and wrong.
5. **Test at exact reference breakpoints.** The reference site defines specific `@media (max-width: ...)` breakpoints. Test at those exact widths, not arbitrary phone sizes.

## Workflow

### Step 1: Identify breakpoints from the reference

Read the reference site's CSS (both `<style>` blocks in HTML and external CSS files) and catalog all `@media` breakpoints used:

```
Common breakpoints:
- 1024px (tablet)
- 991px (Bootstrap navbar collapse)
- 768px (mobile)
- 480px (small mobile)
- 380px (extra small)
```

For each breakpoint, list which selectors are overridden. This becomes the "expected" set.

### Step 2: Catalog Odoo theme responsive overrides

Read `responsive.scss` and catalog every `@media` block and every selector within it. This is the "actual" set.

### Step 3: Compare and identify discrepancies

For each breakpoint, compare:

1. **Missing in Odoo** — selectors that the reference overrides but Odoo doesn't. These need to be added.
2. **Extra in Odoo** — selectors that Odoo overrides but the reference doesn't. These need to be REMOVED. This is the most common and damaging category.
3. **Value mismatches** — same selector overridden in both, but with different values. These need to be corrected to match the reference.

### Step 4: Verify asset load order

Before fixing any CSS, verify that responsive overrides actually take effect:

```javascript
// In browser console, check that responsive rules come AFTER desktop rules
// for the same selector. If desktop rules have higher index, responsive
// overrides are being silently ignored.
```

If responsive rules load before desktop rules, add `sequence` fields to `theme.ir.asset` records in `data/ir_asset.xml`:

```xml
<record id="theme_<brand>_theme_scss" model="theme.ir.asset">
    <field name="sequence">100</field>
    ...
</record>
<record id="theme_<brand>_responsive_scss" model="theme.ir.asset">
    <field name="sequence">200</field>
    ...
</record>
```

### Step 5: Apply fixes

1. Remove all extra overrides first
2. Fix value mismatches
3. Add missing overrides
4. Upgrade the module and clear asset cache:

```bash
docker compose exec -T db psql -U <user> -d <db> -c \
    "DELETE FROM ir_attachment WHERE url LIKE '/web/assets/%';"
docker compose stop web && \
    docker compose run --rm -T web odoo -u theme_<brand> --stop-after-init -d <db> && \
    docker compose start web
```

### Step 6: Visual verification

For each breakpoint width, scroll through every section of every page and verify visually against the reference. Use the `chromedebug` MCP tool to:

1. Set viewport width to the breakpoint
2. Scroll to each section
3. Take a screenshot
4. Compare side-by-side with the reference

Sections to check on a typical homepage:
- Hero
- Feature cards / Why section
- Gallery
- Reviews / Testimonials
- Location / Map
- Contact / Inquiry form
- CTA
- Footer

### Step 7: Verify computed styles programmatically

For critical layout properties, verify in the browser that the computed value matches the reference:

```javascript
(() => {
  const el = document.querySelector('.selector');
  const cs = getComputedStyle(el);
  return JSON.stringify({
    gridTemplateColumns: cs.gridTemplateColumns,
    padding: cs.padding,
    fontSize: cs.fontSize,
    display: cs.display
  });
})()
```

This catches cases where the CSS rule exists but is overridden by specificity or load order.

### Step 8: Gate — do not proceed until all checks pass

Run through `references/responsive-validation-checklist.md`. Every item must pass. If any item fails:

1. Identify the root cause (extra override? missing override? load order? specificity?)
2. Fix it
3. Re-run the full checklist

Only declare the theme ready when ALL items pass.

## Key Lessons Learned

These are real bugs caught during theme migrations:

### Asset load order (CRITICAL)
Odoo compiles all SCSS in the same bundle. The file order in `ir_asset.xml` does NOT guarantee load order in the compiled output. Without explicit `sequence` fields, `theme.scss` can load AFTER `responsive.scss`, causing all responsive overrides to be silently ignored because they have the same specificity but appear earlier in the cascade.

**Fix:** Always add `<field name="sequence">N</field>` to every `theme.ir.asset` record. Use 100 for theme.scss, 110 for header.scss, 120 for footer.scss, 200 for responsive.scss.

### Extra mobile overrides (CRITICAL)
The most common and damaging mistake. During theme generation, it's tempting to add "helpful" mobile overrides like:
- Shrinking font sizes more than the reference
- Reducing padding/margins
- Hiding decorative elements
- Forcing flex-direction: column on button groups
- Reducing image heights

If the reference doesn't have these overrides, they make the mobile layout look cramped, too small, or broken. **The reference is always right.**

### Dual-scope specificity
Both `theme.scss` and `responsive.scss` use the dual-scope wrapper (`.theme_<brand>_page, body.theme_<brand>_body #wrap { ... }`). This means desktop and responsive rules have identical specificity. The ONLY thing that determines which wins is source order in the compiled CSS — which is why asset load order is critical.

### Inline styles in reference HTML
The reference site may have CSS in TWO places: external CSS files AND inline `<style>` blocks in the HTML. Always check both when cataloging the reference's responsive rules.

### Container override
If the reference site has a custom `.container` max-width or padding, this must be set in `theme.scss` inside the dual-scope wrapper, not in `responsive.scss`. The container is a global layout element, not a responsive override.

### Footer and header are NOT dual-scoped
Footer responsive rules target `#wrapwrap > footer` directly, not through the dual-scope wrapper. Same for header rules targeting `#wrapwrap > header`. These are separate from the main content responsive rules.
