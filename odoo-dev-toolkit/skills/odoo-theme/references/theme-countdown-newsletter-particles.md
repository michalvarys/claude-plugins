# Odoo 18 Theme: Countdown Page, Newsletter & Canvas Particles

Patterns for a "coming soon" / countdown landing page with newsletter subscription (integrated with Odoo's mailing module) and performance-optimized canvas particle effects.

## Countdown Page Structure

### Snippet Template (views/snippets/s_countdown.xml)

The section carries `data-end-time` (epoch seconds) for the editor's datetimepicker, and the inner `.countdown` div carries `data-target` (ISO string) for the frontend JS timer.

```xml
<odoo>
<template id="s_countdown" name="Countdown">
    <section class="ea-hero ea-countdown-hero"
             data-snippet="s_countdown" data-name="Countdown"
             data-end-time="1776340800">
        <div class="ea-hero-bg-img">
            <img src="/theme_x/static/src/img/hero-bg.avif" alt=""/>
        </div>
        <div class="ea-hero-bg-overlay"/>
        <canvas class="ea-hero-particles" aria-hidden="true"/>

        <div class="ea-hero-content">
            <h1 class="ea-hero-title">
                <img src="/theme_x/static/src/img/logo.png"
                     alt="Brand" class="ea-hero-logo"/>
            </h1>

            <p class="ea-hero-sub">Odpočet do otevření</p>

            <!-- Countdown timer -->
            <div class="ea-countdown" id="ea-countdown"
                 data-target="2026-04-16T12:00:00+02:00">
                <div class="ea-countdown-item">
                    <div class="ea-countdown-value" id="ea-cd-days">00</div>
                    <div class="ea-countdown-label">Dnů</div>
                </div>
                <div class="ea-countdown-sep">:</div>
                <div class="ea-countdown-item">
                    <div class="ea-countdown-value" id="ea-cd-hours">00</div>
                    <div class="ea-countdown-label">Hodin</div>
                </div>
                <div class="ea-countdown-sep">:</div>
                <div class="ea-countdown-item">
                    <div class="ea-countdown-value" id="ea-cd-mins">00</div>
                    <div class="ea-countdown-label">Minut</div>
                </div>
                <div class="ea-countdown-sep">:</div>
                <div class="ea-countdown-item">
                    <div class="ea-countdown-value" id="ea-cd-secs">00</div>
                    <div class="ea-countdown-label">Sekund</div>
                </div>
            </div>

            <!-- Newsletter form -->
            <div class="ea-newsletter" id="ea-newsletter">
                <h3 class="ea-newsletter-title">
                    Buď u toho <span class="ea-accent">první</span>
                </h3>
                <p class="ea-newsletter-text">
                    Zanech nám email a dozvíš se o otevření jako první.
                </p>
                <form class="ea-newsletter-form" id="ea-newsletter-form" action="#">
                    <div class="ea-newsletter-input-wrap">
                        <!-- inline SVG mail icon -->
                        <input type="email" name="email" required="required"
                               placeholder="tvuj@email.cz"
                               class="ea-newsletter-input"
                               autocomplete="email"/>
                    </div>
                    <button type="submit" class="ea-btn-primary ea-newsletter-btn">
                        Odebírat novinky
                    </button>
                </form>
                <div class="ea-newsletter-msg" id="ea-newsletter-msg"></div>
            </div>
        </div>
    </section>
</template>
</odoo>
```

### Countdown Page Definition (views/pages.xml)

```xml
<template id="countdown_page_view" name="Countdown Page">
    <t t-call="website.layout">
        <t t-set="additional_title">Brand | Již brzy</t>
        <t t-set="no_header" eval="True"/>
        <div id="wrap" class="oe_structure ea-page">
            <t t-call="theme_x.s_countdown"/>
        </div>
    </t>
</template>

<record id="countdown_page" model="theme.website.page">
    <field name="url">/countdown</field>
    <field name="view_id" ref="countdown_page_view"/>
    <field name="is_published" eval="True"/>
</record>
```

## Snippet Options — Date Picker in Editor

### Options XML (views/snippets/s_countdown_options.xml)

Uses Odoo's built-in `we-datetimepicker` widget. The `data-js` value must match the JS options registry key.

```xml
<odoo>
<template id="s_countdown_options" name="Countdown Options"
          inherit_id="website.snippet_options">
    <xpath expr="." position="inside">
        <div data-js="EaCountdown" data-selector=".ea-countdown-hero">
            <we-datetimepicker string="Datum otevření"
                               data-select-data-attribute="0"
                               data-attribute-name="endTime"/>
        </div>
    </xpath>
</template>
</odoo>
```

### Options JS (static/src/snippets/s_countdown/options.js)

Syncs the epoch timestamp from the datetimepicker into the `.ea-countdown` child's `data-target` ISO string.

```javascript
/** @odoo-module **/
import options from "@web_editor/js/editor/snippets.options";

options.registry.EaCountdown = options.Class.extend({
    updateUI: async function () {
        await this._super(...arguments);
        const endTime = parseInt(this.$target[0].dataset.endTime);
        const cdEl = this.$target[0].querySelector('.ea-countdown');
        if (cdEl && endTime) {
            cdEl.dataset.target = new Date(endTime * 1000).toISOString();
        }
    },
});
```

### Asset Registration (data/ir_asset.xml)

Register the options JS in the **editor-only** bundle:

```xml
<record id="asset_countdown_options" model="theme.ir.asset">
    <field name="key">theme_x_countdown_options</field>
    <field name="name">theme_x countdown options</field>
    <field name="bundle">website.assets_wysiwyg</field>
    <field name="path">theme_x/static/src/snippets/s_countdown/options.js</field>
</record>
```

## Newsletter Controller — Odoo Mailing Integration

### CRITICAL: JSON-RPC Format

Odoo `type='json'` controllers expect the **JSON-RPC 2.0 wrapper**, NOT plain JSON.

**Frontend JS must send:**
```javascript
body: JSON.stringify({
    jsonrpc: "2.0",
    method: "call",
    params: { email },
})
```

**Frontend JS must read:**
```javascript
const json = await resp.json();
const data = json.result || {};  // actual return value is inside .result
if (json.error) { /* server error */ }
```

**Common mistake:** Sending `{ email: "..." }` directly → controller receives `email=None` → returns error or crashes.

### Controller (controllers/newsletter.py)

Writes to `mailing.contact` + `mailing.subscription` (Odoo's native Email Marketing).

```python
import re
from odoo import http
from odoo.http import request

MAILING_LIST_NAME = 'Brand Newsletter'

class NewsletterController(http.Controller):

    @http.route(
        '/brand/newsletter/subscribe',
        type='json',
        auth='public',
        methods=['POST'],
        csrf=False,
    )
    def subscribe(self, email=None, **kw):
        if not email or not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
            return {'success': False, 'message': 'Zadejte platný email.'}

        email = email.strip().lower()

        # IMPORTANT: .sudo() goes on the model, NOT on request.env
        # request.env.sudo() raises AttributeError in Odoo 18
        MailingList = request.env['mailing.list'].sudo()
        mailing_list = MailingList.search(
            [('name', '=', MAILING_LIST_NAME)], limit=1
        )
        if not mailing_list:
            mailing_list = MailingList.create({'name': MAILING_LIST_NAME})

        Subscription = request.env['mailing.subscription'].sudo()
        Contact = request.env['mailing.contact'].sudo()
        contact = Contact.search([('email', '=', email)], limit=1)
        if contact:
            sub = Subscription.search([
                ('contact_id', '=', contact.id),
                ('list_id', '=', mailing_list.id),
            ], limit=1)
            if sub:
                if sub.opt_out:
                    sub.opt_out = False
                    return {'success': True, 'message': 'Odběr obnoven.'}
                return {'success': True, 'message': 'Email již registrován.'}

        if not contact:
            contact = Contact.create({'email': email})
        Subscription.create({
            'contact_id': contact.id,
            'list_id': mailing_list.id,
        })
        return {'success': True, 'message': 'Děkujeme! Budeme vás informovat.'}
```

### Manifest Dependency

```python
'depends': [
    'theme_common',
    'website',
    'mass_mailing',  # Required for mailing.contact, mailing.list, mailing.subscription
],
```

**DO NOT create a custom model** (e.g. `newsletter_subscriber`) for email collection. Always use `mailing.contact` + `mailing.subscription` so subscribers appear in Odoo's Email Marketing app and can be targeted with campaigns.

## Canvas Particles — Performance-Optimized

Two-layer particle system: small embers (sharp dots floating up) + large bokeh blobs (soft camera-blur effect).

### Performance Constraints

- **`prefers-reduced-motion`** → skip entirely (accessibility)
- **Mobile count**: 15 embers + 4 bokeh; Desktop: 30 embers + 7 bokeh
- **30fps cap** via timestamp delta (not full 60fps rAF)
- **IntersectionObserver** pauses animation when hero scrolls off-screen (zero CPU)
- **Debounced resize** (200ms)
- **Canvas at 1x DPR** — no retina overhead for blurry blobs
- **Bokeh blur via radial gradient**, NOT `ctx.filter: blur()` (GPU-expensive)
- **Zero network cost** — pure JS, no images/sprites

### HTML

Add inside the hero section, after overlays, before content:

```xml
<canvas class="ea-hero-particles" aria-hidden="true"/>
```

### CSS

```scss
.ea-hero-particles {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}
```

### JavaScript

```javascript
function eaInitParticles() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvases = document.querySelectorAll(".ea-hero-particles");
    if (!canvases.length) return;

    const isMobile = window.innerWidth < 768;
    const EMBER_COUNT = isMobile ? 15 : 30;
    const BOKEH_COUNT = isMobile ? 4 : 7;
    const FPS_INTERVAL = 1000 / 30;

    canvases.forEach((canvas) => {
        const hero = canvas.closest(".ea-hero");
        if (!hero || canvas.dataset.eaInit) return;
        canvas.dataset.eaInit = "1";

        const ctx = canvas.getContext("2d");
        let w, h, embers, bokehs, rafId = 0, visible = true, lastFrame = 0;

        function resize() {
            w = canvas.width = hero.offsetWidth;
            h = canvas.height = hero.offsetHeight;
        }

        function createEmber() {
            return {
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -(Math.random() * 0.5 + 0.2),
                a: Math.random() * 0.7 + 0.2,
                da: (Math.random() - 0.5) * 0.01,
            };
        }

        function createBokeh() {
            return {
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * 40 + 20,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.1,
                a: Math.random() * 0.06 + 0.02,
                da: (Math.random() - 0.5) * 0.001,
            };
        }

        // Bokeh: radial gradient = cheap GPU blur (no ctx.filter)
        function drawBokeh(p) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
            g.addColorStop(0, `rgba(255, 106, 0, ${p.a})`);
            g.addColorStop(0.5, `rgba(255, 106, 0, ${p.a * 0.4})`);
            g.addColorStop(1, "rgba(255, 106, 0, 0)");
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        }

        function draw(ts) {
            rafId = visible ? requestAnimationFrame(draw) : 0;
            if (ts - lastFrame < FPS_INTERVAL) return;
            lastFrame = ts;

            ctx.clearRect(0, 0, w, h);

            for (const b of bokehs) {
                b.x += b.vx; b.y += b.vy; b.a += b.da;
                if (b.a <= 0.01 || b.a >= 0.09) b.da = -b.da;
                if (b.x < -b.r) b.x = w + b.r;
                if (b.x > w + b.r) b.x = -b.r;
                if (b.y < -b.r) b.y = h + b.r;
                if (b.y > h + b.r) b.y = -b.r;
                drawBokeh(b);
            }

            for (const p of embers) {
                p.x += p.vx; p.y += p.vy; p.a += p.da;
                if (p.a <= 0.1 || p.a >= 0.9) p.da = -p.da;
                if (p.y < -10 || p.x < -10 || p.x > w + 10) {
                    p.x = Math.random() * w; p.y = h + 10;
                    p.a = Math.random() * 0.5 + 0.2;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 106, 0, ${p.a})`;
                ctx.fill();
            }
        }

        // Pause when off-screen
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !rafId) { lastFrame = 0; rafId = requestAnimationFrame(draw); }
        }, { threshold: 0 });
        observer.observe(hero);

        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 200);
        });

        resize();
        embers = Array.from({ length: EMBER_COUNT }, createEmber);
        bokehs = Array.from({ length: BOKEH_COUNT }, createBokeh);
        rafId = requestAnimationFrame(draw);
    });
}
```

## Countdown Timer CSS

```scss
.ea-countdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin: 2rem 0 2.5rem;
    flex-wrap: wrap;
}
.ea-countdown-item {
    background: var(--ea-card-bg);
    border: 1px solid var(--ea-card-border);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    min-width: 80px;
    text-align: center;
}
.ea-countdown-value {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 900;
    color: var(--ea-accent);
    line-height: 1;
    font-variant-numeric: tabular-nums;
}
.ea-countdown-label {
    font-size: 0.7rem;
    color: var(--ea-muted);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-top: 0.4rem;
}
.ea-countdown-sep {
    font-size: 2rem;
    font-weight: 700;
    color: rgba(255, 106, 0, 0.3);
    padding-bottom: 1rem;
}
.ea-countdown-done .ea-countdown-value {
    color: #22c55e;
}
```

## Newsletter CSS

```scss
.ea-newsletter {
    max-width: 480px;
    margin: 0 auto 2.5rem;
    padding: 2rem;
    background: var(--ea-card-bg);
    border: 1px solid var(--ea-card-border);
    border-radius: 16px;
}
.ea-newsletter-form {
    display: flex;
    gap: 0.5rem;
}
.ea-newsletter-input {
    width: 100%;
    padding: 0.7rem 0.75rem 0.7rem 38px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--ea-card-border);
    border-radius: 8px;
    color: var(--ea-fg);
    font-size: 0.85rem;
    &:focus { border-color: var(--ea-accent); }
}
.ea-newsletter-msg {
    &.ea-success { color: #22c55e; }
    &.ea-error { color: #ef4444; }
}
@media (max-width: 480px) {
    .ea-newsletter-form { flex-direction: column; }
}
```

## Key Gotchas

1. **JSON-RPC wrapper is mandatory** for `type='json'` Odoo controllers — plain `fetch` with `{email}` body will silently fail, controller receives `email=None`
2. **`data-end-time` uses epoch seconds** (not milliseconds) — multiply by 1000 in JS
3. **Snippet options JS goes in `website.assets_wysiwyg` bundle** (editor-only), NOT `web.assets_frontend`
4. **`we-datetimepicker` sets epoch seconds** on the snippet section's `data-end-time` attribute — the options JS must sync this to the countdown element's `data-target` as ISO string
5. **Always use `mailing.contact` + `mailing.subscription`** instead of custom models — subscribers then appear in Odoo Email Marketing for campaigns
6. **Bokeh via `createRadialGradient`** is much cheaper than `ctx.filter = 'blur(Npx)'` — the latter forces per-frame GPU compositing
7. **IntersectionObserver on hero** prevents particle animation from burning CPU when scrolled past
8. **`prefers-reduced-motion: reduce`** must skip particles entirely — never ignore accessibility preferences
9. **`request.env.sudo()` does NOT work in Odoo 18** — `Environment` has no `.sudo()` method. Always call `.sudo()` on the model recordset: `request.env['mailing.contact'].sudo()`, NOT `request.env.sudo()['mailing.contact']`
