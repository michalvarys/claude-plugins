---
description: Create a Varyshop animated reel (HTML+GSAP → MP4, DARK style, chosen aspect ratios)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <topic> [ratios: 9x16 1x1 4x5 16x9, default 9x16]
---

Create a Varyshop reel about: $ARGUMENTS

Use the **create-varyshop-creative** skill in **reel** mode.

1. Read the skill + `references/brand-visual-system.md` (DARK section + GSAP animation) + `references/copy-rules.md`.
   Anchor visual: `examples/dark-ad.html`.
2. Style = **DARK** (`${CLAUDE_PLUGIN_ROOT}/assets/css/brand-dark.css`) unless the user says light.
   Bg #1A1A1A, blue #6EA8FE + yellow #FFB84E, robots OK, Inter/Inter Tight (never Manrope).
3. Write `copy.md` first — 5-scene timeline (Hook 0–5s, Pain 5–10s, Benefits 10–17s, Mantra 17–22s, CTA 22–28s).
   Hormozi 4, no fake urgency, avatar = firmy s týmy, no emoji.
4. Build one HTML per requested aspect ratio (don't crop — re-lay each). Load GSAP from CDN and expose a
   **paused** master timeline as `window.MASTER`; the renderer seeks it frame by frame. Scene 1 must scroll-stop by 0.5s.
5. Render each ratio, e.g.:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" reel <reel-9x16.html> --w 1080 --h 1920 --dur 28 --fps 30 [--audio bg.mp3]`
   (1x1 → 1080×1080, 4x5 → 1080×1350, 16x9 → 1920×1080). Needs Node+Chrome+ffmpeg; first run `npm install --prefix "${CLAUDE_PLUGIN_ROOT}/scripts"`.
6. Extract the hook frame, run the checklist, deliver the MP4s.
