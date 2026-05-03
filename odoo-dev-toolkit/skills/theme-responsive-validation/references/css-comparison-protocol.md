# CSS Comparison Protocol

Step-by-step protocol for comparing the reference site's responsive CSS to the Odoo theme's SCSS and identifying every discrepancy.

## Step 1: Gather reference CSS

The reference site may have responsive CSS in multiple locations:

### External CSS files
```bash
# Find all CSS files in the static bundle
find <static-bundle-path> -name "*.css" -type f
```

### Inline `<style>` blocks in HTML
```bash
# Extract inline styles from each HTML file
grep -n '@media' <static-bundle-path>/index.html
```

**CRITICAL:** Always check BOTH. Many reference sites have the majority of their responsive CSS in inline `<style>` blocks, not external files. Missing the inline styles means missing most of the responsive rules.

## Step 2: Catalog reference responsive rules

For each `@media (max-width: Npx)` block in the reference, create a structured list:

```
BREAKPOINT: 768px
SELECTORS:
  .hero-logos { margin-bottom: 24px }
  .hero-fabrica { width: 180px; margin-bottom: 24px }
  .hero-logo { width: 280px }
  ...
  .inquiry-inner { grid-template-columns: 1fr; gap: 40px }
  .form-row { grid-template-columns: 1fr }
  .inquiry-form { padding: 28px 20px }
  ...
```

Do this for EVERY breakpoint in the reference.

## Step 3: Catalog Odoo responsive rules

Read `responsive.scss` and create the same structured list:

```
BREAKPOINT: 768px (inside dual-scope wrapper)
SELECTORS:
  .gl-hero-logos { margin-bottom: 24px }
  .gl-hero-fabrica { width: 180px; margin-bottom: 24px }
  ...
```

Note the class name mapping: the reference may use `.hero-logos` while Odoo uses `.gl-hero-logos` (with a brand prefix). Account for this when comparing.

## Step 4: Three-way diff

For each breakpoint, categorize every selector into one of three buckets:

### A. MATCH — same selector, same values
No action needed.

### B. MISMATCH — same selector, different values
Document the exact difference:
```
MISMATCH at 768px:
  Reference: .inquiry-form { padding: 28px 20px }
  Odoo:      .gl-inquiry-form { padding: 24px 16px }
  ACTION: Change Odoo value to match reference
```

### C. EXTRA IN ODOO — selector in Odoo but NOT in reference
This is the most dangerous category. These overrides were added during theme generation but don't exist in the original design. They almost always make the mobile layout worse.

```
EXTRA at 768px:
  Odoo: .gl-review-card { max-width: 280px }  (reference has NO mobile override for review cards)
  ACTION: REMOVE from responsive.scss
```

### D. MISSING IN ODOO — selector in reference but NOT in Odoo
```
MISSING at 768px:
  Reference: .btn-outline { backdrop-filter: blur(10px) }
  ACTION: ADD to responsive.scss
```

## Step 5: Check for extra breakpoints

Verify that Odoo doesn't have breakpoints the reference doesn't use:

```
Reference breakpoints: 1024px, 768px, 480px
Odoo breakpoints:      1024px, 991px, 768px, 480px, 380px

EXTRA breakpoint: 991px — exists in Odoo but NOT reference
ACTION: Check if this is Bootstrap's navbar collapse (legitimate) or an added breakpoint (remove)

EXTRA breakpoint: 380px — check if reference has this
```

Some breakpoints like 991px (Bootstrap navbar) are legitimate Odoo additions for header collapse behavior and should be kept.

## Step 6: Check header and footer separately

Header and footer responsive rules are NOT inside the dual-scope wrapper. They target `#wrapwrap > header` and `#wrapwrap > footer` directly. Compare these separately:

```
REFERENCE footer at 768px:
  .v2-footer-inner { grid-template-columns: 1fr 1fr; gap: 32px }
  .v2-footer-bottom { flex-direction: column; text-align: center; gap: 8px }

ODOO footer at 768px:
  .gl-footer-inner { grid-template-columns: 1fr 1fr; gap: 32px }
  .gl-footer-bottom { flex-direction: column; text-align: center; gap: 8px }
  .gl-footer-brand { grid-column: span 2 }  ← EXTRA, reference doesn't have this
```

## Step 7: Verify asset load order BEFORE making changes

This step prevents wasted effort. If `theme.scss` loads after `responsive.scss` in the compiled CSS, fixing responsive values won't have any effect because the desktop rules will still win.

```javascript
// In browser console:
(() => {
  const sheets = document.styleSheets;
  let results = [];
  for (let i = 0; i < sheets.length; i++) {
    try {
      const rules = sheets[i].cssRules;
      for (let j = 0; j < rules.length; j++) {
        const r = rules[j];
        // Pick a selector that exists in BOTH theme.scss and responsive.scss
        if (r.type !== CSSRule.MEDIA_RULE && r.cssText && r.cssText.includes('TARGET_CLASS')) {
          results.push({index: j, type: 'desktop', text: r.cssText.substring(0, 150)});
        }
        if (r.type === CSSRule.MEDIA_RULE && r.conditionText && r.conditionText.includes('768')) {
          for (let k = 0; k < r.cssRules.length; k++) {
            if (r.cssRules[k].cssText && r.cssRules[k].cssText.includes('TARGET_CLASS')) {
              results.push({index: j, type: 'responsive', text: r.cssRules[k].cssText.substring(0, 150)});
            }
          }
        }
      }
    } catch(e) {}
  }
  return JSON.stringify(results);
})()
```

If `desktop.index > responsive.index`, the load order is WRONG. Fix with `sequence` fields on `theme.ir.asset` records before proceeding.

## Step 8: Apply changes in correct order

1. **First**: Fix asset load order if needed (Step 7)
2. **Second**: Remove ALL extra overrides (Category C) — this alone often fixes most issues
3. **Third**: Fix value mismatches (Category B)
4. **Fourth**: Add missing overrides (Category D)
5. **Fifth**: Upgrade module and clear cache
6. **Sixth**: Verify computed styles in browser
7. **Seventh**: Visual comparison at each breakpoint

## Common Pitfalls

### The "helpful override" trap
During generation, it's tempting to add overrides like "make gallery images smaller on mobile" or "hide decorative elements on mobile." If the reference doesn't do this, DON'T do it. The designer made these choices intentionally.

### Premature column collapse
A common mistake is collapsing 2-column layouts to 1-column at 1024px when the reference only collapses at 768px. This makes tablet layouts look wrong. Always check the EXACT breakpoint the reference uses for each grid collapse.

### Class name mapping
When comparing, account for the prefix the theme uses. The reference might use `.inquiry-inner` while Odoo uses `.gl-inquiry-inner`. These are the same element with different class names.

### Footer and header scoping
Footer/header responsive rules MUST target `#wrapwrap > footer` / `#wrapwrap > header` directly, NOT through the dual-scope wrapper. If they're inside the dual-scope wrapper, they won't have enough specificity to override the desktop styles.

### Missing backdrop-filter
Some reference sites add `backdrop-filter: blur(10px)` to button outlines on mobile for a frosted glass effect. This is easy to miss during comparison but noticeable visually.

### The "it works in DevTools" false positive
Changing a value in browser DevTools proves the CSS property works, but doesn't prove the SCSS file will produce the same result. Always verify by actually upgrading the module and reloading — asset compilation can produce surprises.
