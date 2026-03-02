---
name: create-static-post
description: >
  Create branded static social media post graphics as HTML rendered to PNG.
  Use when the user asks to "create a post", "design a social media graphic",
  "make an Instagram post", "create a Facebook post image", "design a post about...",
  "new post graphic", or wants a 1080x1080 branded image for social media.
version: 0.1.0
---

# Create Static Post Graphic

Create branded 1080x1080px social media post graphics using HTML/CSS rendered to PNG via Playwright headless Chromium.

## Design System Rules

### CRITICAL: No Emojis
NEVER use emoji characters or unicode icons in HTML designs. Headless Chromium does not render them. ALWAYS use inline SVG icons instead.

### Brand Identity
- **Font**: Inter (Google Fonts) — weights 400–900
- **Canvas**: 1080×1080px
- **Theme**: Dark gradient backgrounds (#0f172a base) with colored glow orbs
- **Style**: Glass-morphism cards, gradient badges, gradient text highlights
- **Branding**: Prominent bottom bar with "Start a Business" (19px, bold) + lightning bolt logo (36px icon), and "@michalvarys.eu" handle (16px, bold, rgba(255,255,255,0.65)) — handle must be bright, bold, and clearly visible

### Typography Requirements — CRITICAL

ALL text in the post MUST be clearly readable. No tiny text, no squinting.

| Text Role | Size | Weight | Color |
|-----------|------|--------|-------|
| **Title / h1** | 48–56px | 900 | `#ffffff` |
| **Subtitle** | 24–28px | 600 | `rgba(255,255,255,0.8)` |
| **Body / Detail text** | 22–26px | 600 | `rgba(255,255,255,0.85)` |
| **Card text / descriptions** | 20–24px | 500–600 | `rgba(255,255,255,0.8)` |
| **Labels / Tags** | 18–20px | 600–700 | `rgba(255,255,255,0.75)` |
| **Badge text** | 15–16px | 700 | `#ffffff` |

**HARD RULES:**
- **NO text below 15px** — anything smaller is unreadable on mobile
- Subtitle text must be **at least 24px** with **at least 0.8 opacity** — NOT 18px/0.5 opacity
- Body text and card descriptions must be **at least 20px**
- **Never use opacity below 0.65** for any visible text
- When in doubt, make text BIGGER — 1080x1080 canvas has plenty of room

### Color Palette
Each post uses a unique accent color. Common combinations:
- Green: #22c55e / #16a34a / #4ade80
- Purple: #a855f7 / #7c3aed
- Cyan: #06b6d4 / #22d3ee
- Blue: #3b82f6 / #2563eb
- Amber: #f59e0b / #d97706
- Red: #ef4444 / #dc2626

### SVG Icon Pattern
Every icon must be an inline SVG wrapped in a styled container:

```html
<div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;">
  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" style="width:28px;height:28px;">
    <!-- SVG path here -->
  </svg>
</div>
```

## HTML Template

Read `references/html-template.md` for the complete HTML template structure.

## Rendering Process

1. Write the HTML file to disk
2. Ensure Playwright is installed: `npm install playwright && npx playwright install chromium`
3. Render to PNG:

```javascript
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1080, height: 1080 });
await page.goto(`file://${htmlFilePath}`, { waitUntil: "networkidle" });
await page.screenshot({ path: outputPng, type: "png" });
await browser.close();
```

4. Save the PNG to the outputs folder
5. Show the user a preview of the rendered image

## Post Text

Always generate accompanying post text with:
- Engaging hook (first line)
- Educational content or tips
- Call-to-action (save, share, comment, follow)
- Relevant hashtags (6-8)

Platform-specific versions:
- **Instagram**: Full text with hashtags
- **TikTok title**: Short hook (max ~150 chars)
- **TikTok description**: Full text
- **Threads title**: Short hook
- **Threads description**: Full text

## File Organization — MANDATORY

Every post MUST be organized into its own folder inside the outputs directory, named by content topic (NOT by post number).

```
outputs/
  dont-sell-your-time/
    dont-sell-your-time.html
    dont-sell-your-time.png
    dont-sell-your-time-captions.md
  value-ladder-strategy/
    value-ladder-strategy.html
    value-ladder-strategy.png
    value-ladder-strategy-captions.md
```

**Folder and file naming**: Use kebab-case descriptive topic slugs (e.g., `dont-sell-your-time`, `hormozi-money-models`). NEVER use generic names like `post15` or `post_16`.

At the beginning of each new post creation:
1. Choose a descriptive slug based on the content topic
2. Create the folder: `mkdir -p outputs/{slug}/`
3. Save ALL assets (HTML, PNG, captions) inside that folder

## Workflow

1. Create the post folder inside outputs/ (descriptive name based on topic)
2. Understand the topic from the user
3. Design the HTML with proper brand styling, SVG icons, and layout
4. Render to PNG via Playwright
5. Generate post text (all platform variants)
6. Save all files to the post folder
7. Show preview to user
