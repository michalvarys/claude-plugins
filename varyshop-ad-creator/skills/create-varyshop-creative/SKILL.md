---
name: create-varyshop-creative
description: >
  Create Varyshop-branded creatives — static ads, multi-slide carousels, and animated reels —
  in the two correct v2 brand styles (LIGHT: white bg + blue #3DA5E0 for carousels/posts;
  DARK: #1A1A1A + blue #6EA8FE + yellow #FFB84E for ads/reels). Handles Hormozi-grade copy,
  the locked brand visual system (self-contained brand.css / brand-dark.css + 18 robots),
  and HTML→PNG / HTML→MP4 rendering via a bundled Node+Puppeteer script.
  Use when the user asks for a "varyshop ad / reklama", "varyshop carousel", "varyshop reel",
  "varyshop static / post", or any Varyshop creative in a given format. CZ + EN.
version: 1.0.0
---

# Create Varyshop Creative

Turn a topic + format request into finished, brand-correct Varyshop creatives. This skill is
**self-contained** — everything (CSS, robots, copy rules, examples, renderer) ships in the plugin.
The user just describes what they want and which format; you produce copy → HTML → rendered files.

## 0. Read first (always)

Before creating anything, read:
1. `references/brand-visual-system.md` — the two styles, which CSS/classes to use, formats
2. `references/copy-rules.md` — Hormozi 4 tests, hooks, forbidden phrases, brand claims, avatar
3. The matching `examples/` file(s) as a layout anchor:
   - `examples/light-carousel-slide.html`, `examples/light-static-quote.html` (LIGHT)
   - `examples/dark-ad.html` (DARK)

`${CLAUDE_PLUGIN_ROOT}` = this plugin's install dir. Expand it to a real absolute path whenever
you write it into an HTML `<link>` or pass it to the renderer.

## 1. Decide format + style

**Format** (ask if the user didn't say):
- **static** — one image ad (1080×1080 default; 1080×1350 vertical; 1200×628 landscape)
- **carousel** — 5–8 slide swipe sequence (1080×1080 each): hook → reality → cost → approach → proof → claim → CTA
- **reel** — animated video (HTML+GSAP → MP4), one or more of 9:16 / 1:1 / 4:5 / 16:9

**Style** — default rule:
- **LIGHT** (`brand.css`) for **carousels and posts** and anything general → default.
- **DARK** (`brand-dark.css`) for **single ads and reels**, or when the user says "tmavý / dark".
- If unsure, state your pick and proceed (light for carousel/post, dark for ad/reel).

Never mix styles inside one deliverable.

## 2. Gather inputs (one message; skip what's already given)

1. **Nabídka / téma** — co prodáváme? (převod webu, AI workflows, multi-pobočky tracking…)
2. **Painpoint** — konkrétní scéna (kdo/kde/kdy/co dělá), ne fráze
3. **Hook angle** — pain-first / kontrast s konkurencí / číslo / curiosity / příběh (see copy-rules)
4. **Formát(y)** a u reelu **poměr(y) stran**
5. **CTA** — co má udělat + doména (default `varyshop.eu` light; ptej se, pokud kampaň jede na jiné)
6. **(Reel)** hudba — cesta k mp3, pokud má být

## 3. Write copy FIRST (copy.md)

Before any HTML, write `copy.md` in the output folder with all text decisions, validated against
the **Hormozi 4 tests** and the **forbidden-phrases scan** in `references/copy-rules.md`:
hooks (5 variants), per-slide/scene text, static headline+sub+CTA, and (for ads) Meta Ads Manager
copy (primary text ≤125 chars sweet spot, headline ≤40, description ≤30, CTA button).

**Avatar lock:** podniky s týmy (ředitel/management), NIKDY OSVČ/jednotlivci.
**No emoji anywhere** — outline SVG icons only.

## 4. Build the HTML

Each HTML file links the correct shipped stylesheet by absolute path:
```html
<link rel="stylesheet" href="${CLAUDE_PLUGIN_ROOT}/assets/css/brand.css">        <!-- LIGHT -->
<link rel="stylesheet" href="${CLAUDE_PLUGIN_ROOT}/assets/css/brand-dark.css">   <!-- DARK  -->
```
Copy the closest `examples/` file and swap the copy. Use the brand classes (don't re-invent tokens):
- **LIGHT:** `.slide`, `.x-line`, `.vs-top`(`.vs-brand`+`.blue-dot` / `.vs-counter`), `.eyebrow-tag`,
  Inter Tight 900 headline (words end `.`), `.vs-italic`, `.vs-bottom`(`.vs-url` `varyshop.eu` + `.vs-swipe`). No robots, no yellow.
- **DARK:** `.ad-glow-blue`/`.ad-glow-yellow`, `.vs-brand-dark`(+yellow `.dot`), `.eyebrow-tag-dark`,
  `.headline-dark`(`.em` blue / `.acc` yellow), `.pain-dark`, `.cta-dark`; robots OK via `${CLAUDE_PLUGIN_ROOT}/assets/robots/{1..18}.png`.

For a **reel**, expose a paused GSAP master timeline as `window.MASTER` (load GSAP from CDN in the HTML);
the renderer seeks it frame by frame. Timing + easing rules are in `references/brand-visual-system.md`.

## 5. Render

The renderer is bundled. First run once per machine: `npm install --prefix "${CLAUDE_PLUGIN_ROOT}/scripts"`
(needs Node + a Chrome/Chromium; set `PUPPETEER_EXECUTABLE_PATH` if you have a system Chrome and want to
skip the download). Reels also need `ffmpeg` on PATH.

```bash
# static (one image)
node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" static <file.html> --w 1080 --h 1080

# carousel (every *.html in a folder → .png beside it)
node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" carousel <folder> --w 1080 --h 1080

# reel (→ mp4). Repeat per aspect ratio with matching --w/--h and a re-laid HTML.
node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" reel <reel-9x16.html> --w 1080 --h 1920 --dur 28 --fps 30 [--audio bg.mp3]
```
Output PNG/MP4 land next to the HTML unless you pass `--out`. Rendering is retina (`deviceScaleFactor: 2`),
so a 1080×1080 canvas yields a 2160×2160 file.

## 6. Verify before reporting done

- Extract/inspect the rendered image (or a reel frame at a scene transition) and eyeball it.
- Run the checklist below. Show the user the key render (carousel: slide 1 + CTA; reel: hook frame).

### Brand checklist (both styles)
- [ ] Links the correct shipped CSS; tokens NOT re-hardcoded
- [ ] **Inter + Inter Tight only** — never Manrope
- [ ] Correct blue (`#3DA5E0` light / `#6EA8FE` dark), yellow `#FFB84E` (not `#5B9DFF`/`#F5A623`)
- [ ] NO emoji — outline SVG icons only
- [ ] Speaks to a company with a team (not OSVČ); director gets it in 3 seconds
- [ ] Copy passes Hormozi 4 (Pain-is-the-Pitch, Value Equation, Validity×Utility, Congruence)
- [ ] No forbidden phrases / fake urgency / fake terms

### If LIGHT
- [ ] White bg; `VARYSHOP.` + blue dot; single blue, no yellow/robots; `varyshop.eu` + SWIPE; words end `.`

### If DARK
- [ ] Bg `#1A1A1A` (not `#0C0F14`); ambient glows; blue+yellow; `VARYSHOP` + yellow dot; robots OK

### If REEL
- [ ] Requested aspect ratios rendered; Scene 1 scroll-stopper (tag+headline by 0.5s); no bounce/elastic

## 7. Deliver

Report the output folder, list files by format/angle, note the recommended A/B hook, and paste the
Meta Ads Manager copy (for ads). Say which style was used and why.

## Anti-patterns (never)
1. Manrope or any non-Inter font
2. Off-palette colors (`#5B9DFF`, `#F5A623`, `#0C0F14`)
3. Re-hardcoding tokens instead of linking the shipped CSS
4. Mixing light + dark in one deliverable
5. Emoji; targeting OSVČ; light-style yellow/robots
6. Cropping a 9:16 reel down to 1:1 — re-lay a separate HTML per ratio
7. Fake terms (48 h / 14 dní) or fake urgency unless verified
8. Publishing without the Step 6 checklist

## Files in this skill
- `references/brand-visual-system.md` — two styles, classes, formats, animation
- `references/copy-rules.md` — Hormozi framework, hooks, claims, forbidden phrases, avatar
- `../../assets/css/brand.css` / `brand-dark.css` — canonical style tokens (self-contained)
- `../../assets/robots/{1..18}.png`, `logo-dark.png`, `logo-light.png`
- `../../scripts/render.mjs` (+ `package.json`) — HTML→PNG/MP4 renderer
- `../../examples/light-carousel-slide.html`, `light-static-quote.html`, `dark-ad.html`
