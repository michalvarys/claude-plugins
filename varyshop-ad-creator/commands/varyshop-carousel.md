---
description: Create a Varyshop multi-slide carousel (LIGHT style, hook → CTA)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <topic> [slides, default 7]
---

Create a Varyshop carousel about: $ARGUMENTS

Use the **create-varyshop-creative** skill in **carousel** mode.

1. Read the skill + `references/brand-visual-system.md` (LIGHT section) + `references/copy-rules.md`.
   Anchor: `examples/light-carousel-slide.html`.
2. Style = **LIGHT** (`${CLAUDE_PLUGIN_ROOT}/assets/css/brand.css`), white bg, blue #3DA5E0, `varyshop.eu`.
3. Plan the arc (5–8 slides): hook → reality → cost of chaos → approach → proof/principle → claim → CTA.
   Set `.vs-counter` per slide ("01 / 07" …). Words end with `.`; blue `.vs-italic` comments; `.x-line` corners.
4. Write `copy.md` first (Hormozi 4, no forbidden phrases, avatar = firmy s týmy, no emoji).
5. One 1080×1080 HTML per slide in an output folder, each `<link>`ing brand.css.
6. Render all slides: `node "${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs" carousel <folder> --w 1080 --h 1080`.
7. Show slide 1 + CTA slide, run the checklist, deliver folder + platform post text.
