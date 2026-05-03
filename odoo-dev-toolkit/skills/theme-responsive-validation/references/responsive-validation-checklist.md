# Responsive Validation Checklist

Walk this list before declaring the theme responsive layout ready. Every item is a real bug caught in practice.

## Asset Load Order

- [ ] `theme.ir.asset` records in `data/ir_asset.xml` have explicit `<field name="sequence">` values
- [ ] `theme.scss` has sequence ≤ 100
- [ ] `header.scss` has sequence ≤ 110
- [ ] `footer.scss` has sequence ≤ 120
- [ ] `responsive.scss` has sequence ≥ 200 (MUST be last SCSS in `web.assets_frontend`)
- [ ] **Browser verification**: for any shared selector (e.g. `.gl-form-row`), the responsive `@media` rule index is HIGHER than the desktop rule index in the compiled stylesheet. Check with:

```javascript
(() => {
  const sheets = document.styleSheets;
  let results = [];
  for (let i = 0; i < sheets.length; i++) {
    try {
      const rules = sheets[i].cssRules;
      for (let j = 0; j < rules.length; j++) {
        const r = rules[j];
        if (r.type !== CSSRule.MEDIA_RULE && r.cssText && r.cssText.includes('SELECTOR')) {
          results.push({index: j, type: 'desktop'});
        }
        if (r.type === CSSRule.MEDIA_RULE && r.conditionText && r.conditionText.includes('768')) {
          for (let k = 0; k < r.cssRules.length; k++) {
            if (r.cssRules[k].cssText && r.cssRules[k].cssText.includes('SELECTOR')) {
              results.push({index: j, type: 'responsive'});
            }
          }
        }
      }
    } catch(e) {}
  }
  return JSON.stringify(results);
})()
```

Replace `SELECTOR` with a class that exists in both theme.scss and responsive.scss. The responsive index MUST be higher.

## No Extra Overrides

This is the #1 source of mobile bugs. For each `@media` block in `responsive.scss`, verify that EVERY selector inside it also exists in the reference site's responsive CSS at that same breakpoint.

- [ ] **1024px breakpoint**: every selector in Odoo's 1024px block exists in the reference's 1024px block
- [ ] **991px breakpoint** (if used): every selector matches
- [ ] **768px breakpoint**: every selector in Odoo's 768px block exists in the reference's 768px block
- [ ] **480px breakpoint**: every selector in Odoo's 480px block exists in the reference's 480px block
- [ ] **380px breakpoint** (if used): every selector matches
- [ ] No Odoo breakpoint exists that the reference doesn't have

Common extra overrides to watch for (REMOVE if reference doesn't have them):
- [ ] Font sizes reduced more than reference
- [ ] Padding/margins reduced more than reference
- [ ] Decorative elements hidden that reference keeps visible
- [ ] `flex-direction: column` on button groups
- [ ] Image/iframe heights reduced
- [ ] Section padding reduced
- [ ] Grid columns collapsed at wider breakpoints than reference
- [ ] Review/testimonial card sizes reduced
- [ ] Gallery border-radius or padding changed
- [ ] Footer extra column/gap/padding overrides

## Value Accuracy

For every selector that exists in BOTH Odoo and the reference at the same breakpoint:

- [ ] `grid-template-columns` values match exactly
- [ ] `gap` values match exactly
- [ ] `font-size` values match exactly
- [ ] `padding` values match exactly
- [ ] `width` / `height` / `min-height` values match exactly
- [ ] `display: none` applied to same elements
- [ ] `flex-direction` values match
- [ ] `order` values match (for reordering elements on mobile)
- [ ] `clip-path` values match
- [ ] `backdrop-filter` values match (check if reference has `blur()` on buttons)

## Dual-Scope Wrapper

- [ ] Main content responsive rules are inside `.theme_<brand>_page, body.theme_<brand>_body #wrap { ... }`
- [ ] Header responsive rules target `#wrapwrap > header` directly (NOT dual-scoped)
- [ ] Footer responsive rules target `#wrapwrap > footer` directly (NOT dual-scoped)
- [ ] Scroll-to-top responsive rules are outside the dual-scope wrapper

## Computed Style Verification

At 487px viewport width (or the target mobile width), verify these computed styles in the browser:

### Layout sections that should be single-column on mobile (768px)
- [ ] Inquiry inner: `gridTemplateColumns` is a single value (1fr)
- [ ] Location inner: `gridTemplateColumns` is a single value (1fr)
- [ ] Why grid: `gridTemplateColumns` is a single value (1fr)
- [ ] Form rows: `gridTemplateColumns` is a single value (1fr)

### Layout sections that should be 2-column on mobile (768px)
- [ ] Gallery grid: `gridTemplateColumns` shows 2 columns
- [ ] Footer inner: `gridTemplateColumns` shows 2 columns

### Footer at 480px
- [ ] Footer inner: `gridTemplateColumns` is a single value (1fr)

### Padding and spacing
- [ ] Inquiry form padding matches reference (e.g. `28px 20px`)
- [ ] CTA buttons stack vertically (`flex-direction: column`)
- [ ] Page header padding matches reference

## Visual Verification

At mobile width, scroll through each section and compare with the reference site side-by-side:

- [ ] **Hero**: logo sizes, headline font size, button sizes, slide navigation position
- [ ] **Feature cards / Why section**: single-column layout, card padding, header font size
- [ ] **Gallery**: 2-column grid, proper gap, image border-radius unchanged from desktop
- [ ] **Reviews / Testimonials**: card width unchanged from desktop (NOT shrunk), avatar size unchanged
- [ ] **Location**: single-column, image heights, decorative element positioning
- [ ] **Inquiry form**: single-column layout, full-width fields, reduced padding on form card
- [ ] **CTA**: stacked buttons, proper font sizes, full-width buttons
- [ ] **Footer**: 2-column grid at 768px, 1-column at 480px, centered bottom section
- [ ] **Decorative elements**: check which ones are hidden vs. repositioned vs. unchanged

## Scroll-to-top Button

- [ ] Responsive rule for scroll-to-top is OUTSIDE the dual-scope wrapper
- [ ] At mobile width: smaller size (e.g. 44x44px), adjusted position

## Container Override

- [ ] `.container` max-width and padding overrides are in `theme.scss` (NOT responsive.scss)
- [ ] Container remains full-width with horizontal padding on mobile (no additional responsive override needed if set correctly in theme.scss)

## Body Overflow

- [ ] `body.theme_<brand>_body { overflow-x: hidden; }` is set in `theme.scss` to prevent horizontal scroll from decorative elements or marquee/carousel overflow

## Final Gate

- [ ] ALL items above pass
- [ ] Screenshots of each section at mobile width match the reference
- [ ] No horizontal scroll on mobile
- [ ] No JavaScript errors in browser console at mobile width
- [ ] Form inputs are usable (not too small, not overlapping)
- [ ] Buttons are tappable (minimum 44px touch target)
