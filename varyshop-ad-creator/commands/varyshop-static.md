---
description: Create a single Varyshop static ad image (LIGHT or DARK)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <topic> [style: light|dark] [size: 1080x1080|1080x1350|1200x628]
---

Create a single Varyshop static ad for: $ARGUMENTS

Use the **create-varyshop-creative** skill in **static** mode.

1. Read the skill + `references/brand-visual-system.md` + `references/copy-rules.md`.
   Anchors: `examples/light-static-quote.html` (LIGHT), `examples/dark-ad.html` (DARK).
2. Pick style: **LIGHT** by default; **DARK** if the user says "tmavý/dark" or it's a performance/ad angle.
   Link the matching shipped CSS (`${CLAUDE_PLUGIN_ROOT}/assets/css/brand.css` or `brand-dark.css`).
3. Default canvas 1080×1080 (or 1080×1350 vertical / 1200×628 landscape if asked).
4. Write `copy.md` first: headline (Inter Tight 900, words end `.`), subhead, CTA, plus Meta Ads Manager
   copy. Hormozi 4, no forbidden phrases, avatar = firmy s týmy, no emoji.
5. Build one HTML, then render:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" static <file.html> --w 1080 --h 1080`.
6. Show the render, run the checklist, deliver the PNG + Meta Ads copy.
