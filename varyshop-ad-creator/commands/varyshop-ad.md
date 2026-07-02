---
description: Create any Varyshop creative — you describe the topic + format, it does the rest
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <describe the creative + format, e.g. "reel na převod webu zdarma, 9:16 + 1:1">
---

Create a Varyshop creative for: $ARGUMENTS

Use the **create-varyshop-creative** skill. This is the universal entry point — figure out the
format and style from the request, then produce finished, brand-correct files.

1. Read the skill and its references (`brand-visual-system.md`, `copy-rules.md`) and the matching example.
2. Determine **format** (static / carousel / reel) and **style** (LIGHT default for carousel/post,
   DARK for single ad/reel, or whatever the user asked). If the format is genuinely ambiguous, ask once.
3. Write `copy.md` first — validate against the Hormozi 4 tests and forbidden-phrases scan. Avatar = firmy s týmy.
4. Build the HTML linking the shipped CSS (`${CLAUDE_PLUGIN_ROOT}/assets/css/brand.css` or `brand-dark.css`).
5. Render with `${CLAUDE_PLUGIN_ROOT}/scripts/render.mjs` (static / carousel / reel mode).
6. Run the brand checklist, show the key render, and deliver the folder + Meta Ads copy.

Never use emoji (outline SVG only). Never use Manrope or off-palette colors. Never mix light + dark.
