---
name: create-carousel
description: >
  Create multi-slide carousel posts for Instagram and social media.
  Use when the user asks to "create a carousel", "make a swipe post",
  "design carousel slides", "multi-slide post", "Instagram carousel",
  or wants a series of connected slides on a topic.
version: 0.1.0
---

# Create Carousel Post

Create multi-slide carousel posts using the same HTML→PNG design system as static posts, but with multiple connected slides.

## Carousel Structure

A typical carousel has 4-10 slides:

1. **Cover slide** — Hook/title that makes people swipe
2. **Content slides** (2-8) — Educational content, one concept per slide
3. **CTA slide** — Call to action (follow, save, share, visit link)

## Design Consistency

All slides in a carousel must share:
- Same background gradient and glow colors
- Same font (Inter) and weight scheme
- Same accent color throughout
- Same prominent bottom branding bar — "Start a Business" (19px bold) + "@michalvarys.eu" (16px bold, bright white 65% opacity) — must be clearly visible
- Consistent slide numbering or progress indicator

## Typography Requirements — CRITICAL

ALL text must be clearly readable on mobile. Same rules as static posts:

| Text Role | Size | Weight | Color |
|-----------|------|--------|-------|
| **Title / Headline** | 48–56px | 900 | `#ffffff` |
| **Subtitle / Subheading** | 24–28px | 600–700 | `rgba(255,255,255,0.8)` |
| **Body / Detail text** | 22–26px | 600 | `rgba(255,255,255,0.85)` |
| **Card text** | 20–24px | 500–600 | `rgba(255,255,255,0.8)` |
| **Labels / Slide numbers** | 18–20px | 600–700 | `rgba(255,255,255,0.75)` |

**HARD RULES:**
- **NO text below 15px**
- Body and descriptions at least **20px** with **at least 0.75 opacity**
- Subtitle at least **24px** with **at least 0.8 opacity**
- **Never use opacity below 0.65** for any visible text

## Slide Template

Each slide is a separate 1080×1080px HTML file following the same design system as static posts. Use the same SVG icon approach — never emojis.

### Cover Slide Pattern
- Large, bold title text
- Subtitle hinting at the value inside
- "Swipe →" indicator or slide count badge

### Content Slide Pattern
- Slide number indicator (e.g., "01/06")
- Clear heading for the concept
- Supporting text or visual
- One key takeaway per slide

### CTA Slide Pattern
- Summary of key points
- Clear call to action
- Profile handle / brand name
- "Save this post" or "Follow for more"

## Rendering

Render each HTML slide to PNG individually using the same Playwright process:

```javascript
for (const slideHtml of slideFiles) {
  await page.goto(`file://${slideHtml}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `slide${i}.png`, type: "png" });
}
```

## Publishing as Carousel

Use media_type=CAROUSEL with the publish-post skill:

```bash
-F 'media_type=CAROUSEL' \
-F 'photos[]=@slide1.png' \
-F 'photos[]=@slide2.png' \
-F 'photos[]=@slide3.png' \
```

## File Organization — MANDATORY

Every carousel MUST be organized into its own folder, named by content topic.

```
outputs/
  5-ways-to-validate-idea/
    slide-01-cover.html
    slide-01-cover.png
    slide-02-research.html
    slide-02-research.png
    ...
    captions.md
```

**Folder and file naming**: Use kebab-case descriptive topic slugs. NEVER use generic names like `post15` or `carousel_3`.

## Workflow

1. Create the carousel folder inside outputs/ (descriptive topic name)
2. Plan the carousel topic and slide breakdown
3. Create HTML files for each slide with consistent styling
4. Render all slides to PNG
5. Generate post text for all platforms
6. Save all files to the carousel folder
7. Publish as carousel via upload-post.com API
