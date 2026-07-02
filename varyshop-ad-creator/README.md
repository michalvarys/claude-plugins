# Varyshop Ad Creator

Create **Varyshop-branded creatives** — static ads, multi-slide carousels, and animated reels — in the
two correct v2 brand styles, with Hormozi-grade copy. Everything is self-contained: brand CSS, robots,
copy rules, examples, and the renderer all ship inside the plugin. **Just type a command and describe
what you want.**

## Commands

| Command | What it does |
|---|---|
| `/varyshop-ad <describe + format>` | Universal — picks format & style, produces finished files |
| `/varyshop-carousel <topic> [slides]` | Multi-slide carousel (LIGHT style, hook → CTA) |
| `/varyshop-reel <topic> [ratios]` | Animated reel HTML+GSAP → MP4 (DARK style), any aspect ratios |
| `/varyshop-static <topic> [style] [size]` | One static ad image (LIGHT or DARK) |

Examples:
- `/varyshop-carousel proč majitelé více firem tápou v číslech`
- `/varyshop-reel převod webu zdarma 9x16 1x1`
- `/varyshop-static AI workflows jako služba dark`
- `/varyshop-ad tmavá reklama na multi-pobočkový tracking, 1080x1080`

## The two brand styles (both correct)

- **LIGHT** (`assets/css/brand.css`) — white bg, single blue `#3DA5E0`, `VARYSHOP.` + blue dot,
  `varyshop.eu`, line × marks, no robots/yellow. **Default** — carousels, posts, general.
- **DARK** (`assets/css/brand-dark.css`) — bg `#1A1A1A`, blue `#6EA8FE` + yellow `#FFB84E`,
  `VARYSHOP` + yellow dot, ambient glows, robots OK. For **single ads and reels**.

Font is **Inter + Inter Tight** in both. The wrong look is any drift off this palette/font
(e.g. Manrope, `#5B9DFF`, `#F5A623`, `#0C0F14`) — the plugin's locked CSS prevents it.

## Requirements

- **Node.js** + **Chrome/Chromium** (for rendering). First use per machine:
  ```
  npm install --prefix "<plugin-dir>/scripts"
  ```
  Set `PUPPETEER_EXECUTABLE_PATH` to reuse a system Chrome instead of downloading one.
- **ffmpeg** on PATH (only for reels).
- Network at render time (fonts load from Google Fonts).

## What's inside

```
varyshop-ad-creator/
├── commands/                     4 slash commands
├── skills/create-varyshop-creative/
│   ├── SKILL.md                  the full workflow
│   └── references/               brand-visual-system.md, copy-rules.md
├── assets/
│   ├── css/                      brand.css (light), brand-dark.css (dark)
│   └── robots/                   1..18.png, logo-dark/light.png
├── scripts/                      render.mjs (HTML→PNG/MP4) + package.json
└── examples/                     light-carousel-slide, light-static-quote, dark-ad
```

Author: Michal Varys.
