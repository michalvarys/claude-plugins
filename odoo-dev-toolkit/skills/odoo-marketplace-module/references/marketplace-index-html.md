# Marketplace index.html Template (SEO-Optimized)

## Template Structure

The `static/description/index.html` is the sales page on apps.odoo.com. Structure for maximum impact and SEO.

```html
<!-- Section 1: Hero banner with tagline -->
<section class="oe_container">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Module Display Name</h2>
        <h3 class="oe_slogan">One-line value proposition with keywords</h3>
        <div class="oe_centered">
            <img class="oe_picture oe_screenshot" src="screenshot_overview.png"
                 alt="Descriptive alt text with keywords"/>
        </div>
    </div>
</section>

<!-- Section 2: Feature grid (3 columns) - dark background -->
<section class="oe_container oe_dark">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Key Features</h2>
        <div class="oe_span4">
            <div class="text-center">
                <span style="font-size:48px; color:#875A7B;">EMOJI</span>
            </div>
            <h3 class="text-center">Feature Name</h3>
            <p class="text-center">2-3 sentence description of the feature
               and its benefit to the user.</p>
        </div>
        <div class="oe_span4">
            <!-- Second feature -->
        </div>
        <div class="oe_span4">
            <!-- Third feature -->
        </div>
    </div>
</section>

<!-- Section 3: Detailed feature with screenshot -->
<section class="oe_container">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Feature Detail</h2>
        <p class="oe_mt32 text-center" style="font-size:16px;">
            Detailed description of a key feature. Include relevant
            keywords naturally: Odoo 18, carrier name, integration, API.
        </p>
        <div class="oe_centered">
            <img class="oe_picture oe_screenshot" src="screenshot_feature.png"
                 alt="Feature description"/>
        </div>
    </div>
</section>

<!-- Section 4: Setup steps - dark background -->
<section class="oe_container oe_dark">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Easy Setup</h2>
        <p class="oe_mt32 text-center" style="font-size:16px;">
            1. Install the module<br/>
            2. Configure in Settings<br/>
            3. Enter API credentials<br/>
            4. Start using!
        </p>
    </div>
</section>

<!-- Section 5: Technical highlights -->
<section class="oe_container">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Technical Details</h2>
        <p class="oe_mt32 text-center" style="font-size:16px;">
            Official REST API integration. No third-party middleware.
            Compatible with Odoo 18 Community and Enterprise.
        </p>
    </div>
</section>

<!-- Section 6: Support -->
<section class="oe_container">
    <div class="oe_row oe_spaced">
        <h2 class="oe_slogan" style="color:#875A7B;">Support</h2>
        <p class="text-center" style="font-size:16px;">
            Need help? Contact us at
            <a href="mailto:info@michalvarys.eu">info@michalvarys.eu</a>
        </p>
    </div>
</section>
```

## SEO Keywords to Include

Weave these naturally into headings and text:
- Module name + "Odoo 18"
- Carrier/service name
- "integration", "connector", "shipping", "delivery"
- "Odoo Apps", "Odoo module"
- Country names where relevant (Czech Republic, Slovakia)
- Problem keywords: "automate shipping", "print labels", "track parcels"

## CSS Classes Reference

| Class | Purpose |
|---|---|
| `oe_container` | Main section wrapper (white background) |
| `oe_container oe_dark` | Section with gray background |
| `oe_row oe_spaced` | Content row with vertical padding |
| `oe_slogan` | Large centered heading |
| `oe_span4` | 1/3 width column (for 3-column grids) |
| `oe_span6` | 1/2 width column |
| `oe_span12` | Full width |
| `oe_mt32` | Margin-top 32px |
| `oe_centered` | Centered block |
| `oe_picture` | Image styling |
| `oe_screenshot` | Screenshot with border/shadow |
| `text-center` | Bootstrap centered text |

## Image Requirements

| Image | Size | Purpose |
|---|---|---|
| `cover.png` | 898x542px | Marketplace listing banner (REQUIRED) |
| `icon.png` | 256x256px | Module icon in Apps list |
| `screenshot_*.png` | ~1200px wide | Feature screenshots in index.html |

## Best Practices

1. **Alternate light/dark sections** for visual rhythm
2. **Use emoji in feature icons** - they render well and don't need image files
3. **Include at least 2 screenshots** - overview and detail
4. **Keep text scannable** - short paragraphs, bullet points
5. **End with support contact** - builds trust
6. **Mention "Odoo 18" explicitly** - buyers filter by version
7. **No JavaScript** - marketplace strips it
8. **No external CSS** - only Odoo's built-in classes
