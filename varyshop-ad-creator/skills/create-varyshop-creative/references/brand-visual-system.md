# Varyshop Brand Visual System

> **Two CORRECT v2 styles: LIGHT (default) and DARK.** Both ship inside this plugin.
> Pick LIGHT for carousels / posts / general; DARK for single ads / reels / when the user says "tmavý/dark".
>
> ⚠️ **"Wrong" is NOT "dark".** The only wrong output is drifting off the locked palette/fonts:
> `Manrope` instead of Inter, blue `#5B9DFF` instead of `#6EA8FE`, orange `#F5A623` instead of yellow `#FFB84E`, bluish-black `#0C0F14` instead of neutral `#1A1A1A`. Always `<link>` the shipped CSS; never re-hardcode tokens.

## How to use the shipped CSS (self-contained)

Every creative HTML file must link ONE of the two stylesheets by absolute path resolved at runtime:

```html
<!-- LIGHT (carousels, posts) -->
<link rel="stylesheet" href="${CLAUDE_PLUGIN_ROOT}/assets/css/brand.css">

<!-- DARK (ads, reels) -->
<link rel="stylesheet" href="${CLAUDE_PLUGIN_ROOT}/assets/css/brand-dark.css">
```

`${CLAUDE_PLUGIN_ROOT}` is the plugin's install directory — expand it to the real absolute path when writing the HTML (the render script does this too). Fonts (Inter + Inter Tight) load from Google Fonts via `@import` inside the CSS — needs network at render time.

Robots / logos live at `${CLAUDE_PLUGIN_ROOT}/assets/robots/{1..18}.png`, `logo-dark.png`, `logo-light.png`.

---

## ⭐ LIGHT (`brand.css`) — DEFAULT

### Colors (`:root`)
| Token | Hex | Use |
|---|---|---|
| `--vs-blue` | `#3DA5E0` | **Primary accent** — tags, italics, icons, highlight words |
| `--vs-blue-mid` / `--vs-blue-dark` / `--vs-blue-light` | `#5BB8E8` / `#1E7BB8` / `#B8DEF2` | Shades |
| `--vs-blue-bg` / `-soft` | `#EBF5FB` / `#F5FAFD` | Soft blue panels |
| `--vs-black` | `#1A1A1A` | Headlines, body |
| `--vs-gray` / `--vs-light-gray` | `#6B7280` / `#E5E7EB` | Secondary text / borders |
| `--vs-white` | `#FFFFFF` | **Background (default)** |
| `--vs-accent` | `#FFB84D` | Yellow — **rare accent only** |

### Signature classes (from brand.css — use them, don't redraw)
- **Logo:** `<div class="vs-brand">VARYSHOP<span class="blue-dot">.</span></div>` — black text + **blue dot** (NOT a circle, NOT yellow).
- **Line × marks:** `.x-line` (+ `.lg` / `.sm` / `.dim` / `.faint`) — thin blue crosses in corners.
- **Top bar:** `.vs-top` (`.vs-brand` left + `.vs-counter` "01 / 07" or "CITÁT" right).
- **Bottom bar:** `.vs-bottom` — `.vs-url` `varyshop<span class="blue">.eu</span>` + `.vs-swipe` "SWIPE ↗" or claim. **Domain = `.eu`.**
- **Eyebrow tag:** `.eyebrow-tag` (blue pill, uppercase, `0.18em`).
- **Headline:** Inter Tight 900, `line-height 1.0`, `-0.03em`, **words end with `.`** (`firmy.`, `Excelů.`).
- **Blue italic quote:** `.vs-italic` / `.italic-comment` (Inter italic 600, blue, left border).
- **Icons:** outline SVG `.ic .ic-web/.ic-bolt/.ic-gear/.ic-chart/.ic-check/.ic-x/.ic-clock/.ic-cart/.ic-data...` — **NO emoji, NO 3D robots** in light style.
- **CTA:** `.cta-url-block` / `.btn-tag` (blue bg, white text, arrow).

### Slide skeleton (LIGHT)
`<div class="slide">` (1080×1080, padding ~90px 80px 80px) → `.x-line` decorations + `.content-layer` (`.vs-top` → content → …) + `.vs-bottom`. See `examples/light-carousel-slide.html`.

---

## 🌑 DARK (`brand-dark.css`) — ads / reels

### Colors (`:root`)
| Token | Hex | Use |
|---|---|---|
| `--vs-black` | `#1A1A1A` | **Background** (neutral, NOT `#0C0F14`) |
| `--vs-blue` | `#6EA8FE` | Blue accent (highlight `.em`, pain border, CTA) |
| `--vs-blue-dark` / `-light` | `#3D7BD9` / `#C4D7FF` | Shades |
| `--vs-accent` | `#FFB84E` | **Yellow** — tags, emphasis `.acc`, logo dot, CTA highlight |
| `--vs-white` / muted | `#FFFFFF` / `rgba(255,255,255,.6)` | Text / muted |

### Signature classes (from brand-dark.css)
- **Logo:** `.vs-brand-dark` = `VARYSHOP` white + **yellow `.dot`** (yellow dot is correct HERE, unlike light).
- **Ambient glows:** `.ad-glow-blue` (one corner) + `.ad-glow-yellow` (opposite) — signature depth.
- **Headline:** `.headline-dark` (Inter Tight 900, `-0.045em`), highlight `.em` (blue) / `.acc` (yellow), strike `.strike`.
- **Pain/benefit bullets:** `.pain-dark` (glass card, blue left-border, `.num` ring, `.txt` with `strong`=yellow, `.blue`=blue).
- **Pills:** `.pill-dark` (glass), `.eyebrow-tag-dark` (yellow / `.blue` variant).
- **CTA:** `.cta-dark` (blue) / `.cta-dark.accent` (yellow + glow); `.acc` inside = yellow.
- **× marks:** `.x-mark-dark` (blue, subtle).
- **Robots:** dark style USES them — `.robot-dark` + `${CLAUDE_PLUGIN_ROOT}/assets/robots/{1..18}.png`.
- **Font:** Inter + Inter Tight. **NEVER Manrope.**

### Ad skeleton (DARK)
Root canvas with `background: var(--vs-black)`, `.ad-glow-*` corners, `.vs-brand-dark` + `.eyebrow-tag-dark` top, `.headline-dark`, `.pain-dark` list, `.cta-dark` bottom. See `examples/dark-ad.html`.

---

## Canvas dimensions per format
| Format | Width × Height (@1×) | Use |
|---|---|---|
| Static / carousel slide | 1080 × 1080 | Meta/IG square, carousel |
| Static (vertical) | 1080 × 1350 | IG 4:5, Pinterest |
| Static (landscape) | 1200 × 628 | LinkedIn/FB link preview |
| Reel 9:16 | 1080 × 1920 | IG Reels, TikTok, Stories, YT Shorts |
| Reel 1:1 | 1080 × 1080 | LinkedIn/FB feed video |
| Reel 4:5 | 1080 × 1350 | IG feed video |
| Reel 16:9 | 1920 × 1080 | YouTube, web embed |

Render always uses `deviceScaleFactor: 2` (retina) → output is 2× these numbers.

## GSAP animation (reels, both styles)
- Easing: `power3.out` (entrances), `power2.inOut` (exits). Tag pill `back.out(2.5)`.
- Stagger 0.08–0.12s. Scene transition opacity 0→1 / 1→0 in 0.4s.
- Scene 1 scroll-stopper: tag t=0 (dur 0.35), headline t=0.25 (dur 0.2, stagger 0.12).
- **NEVER** `bounce` / `elastic` — too playful.
- The frame renderer drives a paused master timeline via `window.MASTER` (see render script `--reel`).
