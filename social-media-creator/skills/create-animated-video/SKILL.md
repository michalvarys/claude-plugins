---
name: create-animated-video
description: >
  Create animated video posts from HTML/CSS animations rendered to MP4.
  Use when the user asks to "create a video", "make an animated post",
  "render a video for social media", "create a Reel", "make a TikTok video",
  "create an animated social media video", or wants video content from HTML/CSS animations.
version: 0.1.0
---

# Create Animated Video Post

Create animated video posts using HTML/CSS animations captured frame-by-frame via Puppeteer and encoded to MP4 with ffmpeg.

## Requirements

- Node.js 18+
- Puppeteer: `npm install puppeteer`
- ffmpeg installed on system

## Video Formats

| Name | Width | Height | Use Case |
|------|-------|--------|----------|
| 9x16 | 1080 | 1920 | Instagram Reels, TikTok, Stories |
| 4x5 | 1080 | 1350 | Instagram Feed |
| 1x1 | 1080 | 1080 | Facebook, Instagram Square |
| 16x9 | 1920 | 1080 | YouTube, Facebook Video |

## Encoding Settings

- FPS: 30
- Codec: libx264
- Pixel format: yuv420p
- CRF: 18 (high quality)
- Preset: slow
- Audio (optional): AAC 192k

## Video-Voiceover Synchronization — CRITICAL

### Timing Rules

1. **Voiceover must be ~2 seconds shorter than video duration.** If video is 25s, voiceover script should target ~23s of speech. This leaves breathing room at the end for the CTA/branding to linger without speech.

2. **First animation must be FAST (within 0.3-0.5s).** The voiceover starts speaking immediately — the first text/visual element must appear almost instantly so there is no dead silence with a blank screen. Scene 1 elements should have `animation-delay: 0.3s` to `0.5s`, NOT 1-2 seconds.

3. **No long silent gaps.** Every scene transition should overlap slightly (0.5s) so the viewer always sees content while the voiceover is speaking. Dead air with no text visible = bad.

4. **Video duration is the master clock.** Design the video first, then write the voiceover script to FIT the video timing. If the voiceover is longer than (video - 2s), shorten the script — do NOT extend the video.

### Animation Speed Guidelines

| Scene Position | First element delay | Animation duration |
|---|---|---|
| **Scene 1 (Hook)** | 0.3–0.5s | 0.5–0.7s (fast!) |
| **Middle scenes** | scene_start + 0.3s | 0.6–0.8s |
| **Last scene (CTA)** | scene_start + 0.3s | 0.6s |

### Example: 25s Video Timeline

```
Scene 1 (0–5s):    Hook text appears at 0.3s — voiceover starts immediately
Scene 2 (4.5–11s): Content slides in at 4.8s — no gap between scenes
Scene 3 (10.5–19s): Next point at 10.8s
Scene 4 (18.5–23s): Key insight at 18.8s
Scene 5 (22.5–25s): CTA + branding — voiceover ends here (~23s), branding lingers
```

## CSS Animation System

### Scene-Based Structure — CRITICAL RULES

Videos use a scene-based system. Each scene is a `<div>` that becomes visible at a specific time using CSS animation-delay. Getting this wrong causes scenes to overlap (both visible at once) which is the most common and destructive bug in video rendering.

**Why this matters:** Puppeteer renders videos frame-by-frame by setting `document.getAnimations().forEach(a => a.currentTime = t)`. This means ALL animations exist simultaneously and their timing is controlled externally. If the base `.scene` class isn't set up correctly, multiple scenes can be visible at the same frame, creating ugly overlaps.

#### Base `.scene` class — MANDATORY pattern

The base `.scene` class controls scene hiding/showing. It must:
1. Start with `opacity: 0` and `visibility: hidden` so scenes are invisible by default
2. Have NO animation on the base class — only scene-specific classes (`.scene-1`, `.scene-2`, etc.) get the `sceneVis` animation

```css
/* Base scene — MUST have visibility:hidden and NO animation */
.scene {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  /* NO animation property here! */
}

/* Master scene visibility keyframe */
@keyframes sceneVis {
  0%, 100% { opacity: 0; visibility: hidden; }
  0.1%, 99.9% { opacity: 1; visibility: visible; }
}

/* Scene timing — only scene-specific classes get animation */
.scene-1 { animation: sceneVis 7s ease forwards; animation-delay: 0s; }
.scene-2 { animation: sceneVis 8.5s ease forwards; animation-delay: 6.5s; }
.scene-3 { animation: sceneVis 8s ease forwards; animation-delay: 14.5s; }
.scene-4 { animation: sceneVis 7s ease forwards; animation-delay: 22s; }
.scene-5 { animation: sceneVis 6.5s ease forwards; animation-delay: 28.5s; }
```

**Common mistakes that cause scene overlap:**
- Adding `animation: sceneVis 0.8s ease-out forwards;` to the base `.scene` class — this makes ALL scenes briefly visible at load
- Forgetting `visibility: hidden` on the base `.scene` class — scenes default to visible
- Using a fade-in/fade-out sceneVis variant without `visibility: hidden` toggling — opacity alone isn't enough because Puppeteer's frame-by-frame capture can catch intermediate states

### Common Animation Keyframes

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
```

### Element Animation Delays — ABSOLUTE, Not Relative

Inner elements (titles, cards, text blocks) within each scene must use ABSOLUTE animation-delays calculated from the video timeline start (time 0), NOT relative delays from the element's own load time.

**Why this is critical:** Puppeteer controls animation timing by setting `currentTime` on all animations simultaneously. A relative delay of `0.3s` means the element's animation completes at 0.3s + duration — long before the parent scene becomes visible at, say, 14.5s. By the time the scene appears, the element's entrance animation has already finished, so it just pops into view instantly. Worse, during the brief crossfade window between scenes, elements from the NEXT scene can be visible because their animations already completed.

**Formula: `element_delay = scene_start_time + offset_within_scene`**

```css
/* Scene 2 starts at 6.5s */
.scene.scene-2 { animation: sceneVis 8.5s ease forwards; animation-delay: 6.5s; }

/* Inner elements use ABSOLUTE delays: scene_start (6.5s) + offset */
.scene-2 .scene-title {
  opacity: 0;
  animation: fadeSlideDown 0.6s ease forwards;
  animation-delay: 6.8s;  /* 6.5 + 0.3 = title appears 0.3s after scene */
}

.scene-2 .card:nth-child(1) {
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
  animation-delay: 7.5s;  /* 6.5 + 1.0 = first card at 1.0s into scene */
}

.scene-2 .card:nth-child(2) {
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
  animation-delay: 8.3s;  /* 6.5 + 1.8 = second card at 1.8s into scene */
}

.scene-2 .card:nth-child(3) {
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
  animation-delay: 9.1s;  /* 6.5 + 2.6 = third card at 2.6s into scene */
}
```

**WRONG — relative delays (causes overlap and instant-pop):**
```css
/* DO NOT DO THIS — delays fire immediately at page load, not when scene appears */
.scene-2 .scene-title { animation-delay: 0.3s; }
.scene-2 .card:nth-child(1) { animation-delay: 0.5s; }
.scene-2 .card:nth-child(2) { animation-delay: 0.7s; }
.scene-2 .card:nth-child(3) { animation-delay: 0.9s; }
```

### Viewport & Layout Rules — CRITICAL

The video renders at a fixed pixel size (e.g. 1080×1920). There is no scrolling, no responsive resizing, and no overflow recovery. Content that doesn't fit is simply cut off.

1. **All content must fit within the viewport.** Test layouts mentally: if you have 3 cards in a row at 1080px wide with padding, each card gets roughly 280px. If cards need more space, stack them vertically instead.

2. **No CSS media queries.** The viewport is fixed at render time. Media queries like `@media (max-width: 800px)` are meaningless and can cause unexpected layout changes. Remove them entirely.

3. **No overflow: scroll or overflow: auto.** The viewer can't scroll a video. Use `overflow: hidden` if needed, but prefer designing content to fit.

4. **Generous padding matters.** Use `padding: 80px 60px` or similar on scene content containers to keep text away from edges. Mobile viewers crop differently than desktop.

5. **Prefer vertical stacking.** On 9:16 format (1080×1920), you have massive vertical space but limited horizontal space. When in doubt, stack elements vertically (`flex-direction: column`) rather than horizontally (`grid-template-columns: repeat(3, 1fr)`).

6. **Test card/grid layouts against pixel budget:**
   - 1080px width - 120px padding (60px each side) = 960px usable
   - 2 columns with 40px gap: ~460px each — usually fine
   - 3 columns with 40px gap: ~293px each — too tight for most card designs, use single column instead

### Multi-Format Sizing

Use `clamp()` with viewport-relative units for text sizing so the same HTML can work across 9:16, 1:1, and 16:9 formats. Do NOT use `@media` queries — the viewport is fixed at render time and media queries cause unpredictable layout issues.

### Typography Requirements — CRITICAL

ALL text in the video MUST be clearly readable on a mobile phone. No squinting, no tiny text.

| Text Role | Minimum Size (clamp) | Weight | Color | Notes |
|-----------|---------------------|--------|-------|-------|
| **Headline / Hook** | `clamp(2.5rem, 8vh, 9rem)` | 900 | `#ffffff` | Main attention-grabbing text |
| **Scene Title** | `clamp(1.8rem, 5vh, 5rem)` | 800 | `#ffffff` | Each scene's heading |
| **Body / Detail text** | `clamp(1.2rem, 3.2vh, 3.5rem)` | 600–700 | `rgba(255,255,255,0.85)` | Explanations, descriptions, supporting points |
| **Small labels / Tags** | `clamp(0.9rem, 2.2vh, 2.5rem)` | 600–700 | `rgba(255,255,255,0.75)` | Badges, captions, category labels |
| **Badge text** | `clamp(0.8rem, 1.8vh, 2rem)` | 700 | `#ffffff` | Inside gradient pill badges |

**HARD RULES:**
- **NO text below `clamp(0.8rem, 1.8vh, 2rem)`** — anything smaller is unreadable on mobile
- Body text and descriptions MUST be **at least `clamp(1.2rem, 3.2vh, 3.5rem)`** — this is the most common violation, do NOT make body text smaller
- All text MUST have **good contrast** against the dark background — use `rgba(255,255,255, 0.75)` minimum for any secondary text, `rgba(255,255,255, 0.85)` or higher preferred
- **Never use opacity below 0.65** for any visible text element
- When in doubt, make text BIGGER — we have plenty of vertical space on 9:16 format

```css
/* CORRECT example sizes */
.headline {
  font-size: clamp(2.5rem, 8vh, 9rem);
  font-weight: 900;
  line-height: 0.95;
}
.scene-title {
  font-size: clamp(1.8rem, 5vh, 5rem);
  font-weight: 800;
}
.body-text {
  font-size: clamp(1.2rem, 3.2vh, 3.5rem);
  font-weight: 600;
  color: rgba(255,255,255,0.85);
}
.label {
  font-size: clamp(0.9rem, 2.2vh, 2.5rem);
  font-weight: 700;
  color: rgba(255,255,255,0.75);
}
```

## Branding Requirements

Every video MUST include the "Start a Business" branding in the final scene (CTA/outro):

- **Brand name**: "Start a Business" — 19px+ equivalent, bold, white 50% opacity
- **Logo**: Lightning bolt SVG in 36px+ gradient container
- **Handle**: "@michalvarys.eu" — 16px+ equivalent, **bold**, rgba(255,255,255,0.65) — must be bright and clearly visible, NOT subtle
- Use `clamp()` with viewport units for responsive sizing across formats
- The handle must be prominent and unmissable — this is a hard requirement

### Branding HTML Pattern (for video scenes)
```html
<div class="footer" style="display:flex;flex-direction:column;align-items:center;gap:clamp(4px,0.8vh,8px);">
  <div style="display:flex;align-items:center;gap:clamp(8px,1.2vw,14px);">
    <div style="width:clamp(28px,4vh,44px);height:clamp(28px,4vh,44px);border-radius:9px;background:linear-gradient(135deg,ACCENT1,ACCENT2);display:flex;align-items:center;justify-content:center;">
      <svg viewBox="0 0 20 20" fill="none" style="width:60%;height:60%;"><path d="M11.5 2L5 10.5H9L8 18L15 9H11Z" fill="white"/></svg>
    </div>
    <span style="color:rgba(255,255,255,0.5);font-size:clamp(0.9rem,1.8vh,1.6rem);font-weight:700;">Start a Business</span>
  </div>
  <span style="color:rgba(255,255,255,0.65);font-size:clamp(0.8rem,1.5vh,1.4rem);font-weight:700;letter-spacing:0.02em;">@michalvarys.eu</span>
</div>
```

## Rendering Pipeline

Read `references/render-pipeline.md` for the complete rendering script.

### Quick Reference

```javascript
// 1. Launch Puppeteer
const browser = await puppeteer.launch({
  headless: true,
  args: [`--window-size=${width},${height}`, "--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"],
});

// 2. Load HTML and pause animations
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle0" });
await page.evaluate(() => {
  document.getAnimations({ subtree: true }).forEach((a) => a.pause());
});

// 3. Spawn ffmpeg and pipe frames
const ffmpeg = spawn("ffmpeg", [
  "-y", "-f", "image2pipe", "-framerate", "30", "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow",
  "-vf", `scale=${width}:${height}`, "-r", "30", outputFile,
], { stdio: ["pipe", "inherit", "inherit"] });

// 4. Capture each frame
for (let i = 0; i < totalFrames; i++) {
  await page.evaluate((t) => {
    document.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = t; });
  }, i * (1000 / 30));
  const png = await page.screenshot({ type: "png", encoding: "binary" });
  ffmpeg.stdin.write(png);
}

// 5. Finalize
ffmpeg.stdin.end();
await browser.close();
```

## Static Frame Export

To render a static PNG from the same animated HTML (e.g. for thumbnails or image posts):

```javascript
await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle0" });
await page.screenshot({ path: "output.png", type: "png" });
```

## Audio Integration

To add voiceover or music, add audio input to ffmpeg args:

```javascript
const ffmpegArgs = [
  "-y", "-f", "image2pipe", "-framerate", "30", "-i", "-",
  "-i", audioFilePath,  // Add audio input
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow",
  "-c:a", "aac", "-b:a", "192k", "-shortest",  // Audio encoding
  "-vf", `scale=${width}:${height}`, "-r", "30", outputFile,
];
```

## File Organization — MANDATORY

Every post MUST be organized into its own folder inside the outputs directory. Never dump all files into a flat outputs/ folder.

```
outputs/
  dont-sell-your-time/
    dont-sell-your-time-video.html
    dont-sell-your-time-9x16.mp4
    dont-sell-your-time-voiceover.mp3
    dont-sell-your-time-bg-music.mp3
    dont-sell-your-time-mixed-audio.m4a
    dont-sell-your-time-final.mp4
    dont-sell-your-time-captions.md
  hormozi-money-models/
    hormozi-money-models-video.html
    ...
```

**Folder and file naming**: Use kebab-case descriptive topic slugs (e.g., `dont-sell-your-time`, `hormozi-money-models`). NEVER use generic names like `post15` or `post_16`. Name files by what the content IS about.

At the beginning of each new post creation:
1. Choose a descriptive slug based on the content topic
2. Create the folder: `mkdir -p outputs/{slug}/`
3. Save ALL assets (HTML, MP4, MP3, captions, etc.) inside that folder

## Workflow

1. Create the post folder inside outputs/
2. Design the animated HTML with scene-based CSS animations
3. Test by opening in browser (animations play normally)
4. Run render script to capture frames and encode MP4
5. Optionally generate voiceover (see generate-voiceover skill) and re-render with audio
6. Export in desired format(s): 9x16, 4x5, 1x1, 16x9
7. Save all files to the post folder

## Batch Rendering from JSON Data

When generating multiple videos (e.g. e-learning lessons, video series),
use a data-driven pipeline:

1. **Prepare JSON data** with all lesson/video metadata (titles, content,
   section info, icons, colors)
2. **Create HTML template** with CSS variables and scene-based animations
3. **Generate HTML files** via Python script that fills template per entry
4. **Batch render** all HTML files to MP4 via Node.js render script

### JSON Data Structure

For e-learning or series content, structure data as:
- sections[] with title, color, icon_svg, description
- lessons[] with section_id, title, subtitle, key_points[], duration

### HTML Template System

Use a single HTML template with placeholder tokens like {{TITLE}},
{{SUBTITLE}}, {{SECTION_COLOR}}, {{ICON_SVG}}, {{KEY_POINTS_HTML}}.
The generation script replaces these per lesson.

Key template features:
- CSS custom properties for per-section theming (--accent-color, --bg-gradient)
- Scene-based animations with @keyframes (scene1, scene2, scene3...)
- Inline SVG icons (never unicode emojis - they fail in headless Chromium)
- Fixed 1080x1920 viewport, 30 second duration

### Render Script (Node.js + Puppeteer + ffmpeg)

The render script (render-lesson-videos.mjs) does:
1. Scan outputs/lesson-videos/ for folders containing *-video.html
2. For each: launch headless Chrome at 1080x1920
3. Pause all CSS animations, then step through frame-by-frame at 30fps
4. Pipe PNG frames to ffmpeg (libx264, CRF 18, yuv420p)
5. Output *-9x16.mp4 in same folder

Render settings: 30fps, 30s duration = 900 frames, ~80s render time per video.

Important: The render script must be run on Mac host (needs Chrome + ffmpeg).
Use a wrapper shell script with explicit nvm PATH:
  export PATH=$HOME/.nvm/versions/node/v20.19.5/bin:/opt/homebrew/bin:$PATH

For batch rendering of many videos, launch as background process via
Python subprocess.Popen(start_new_session=True) and monitor /tmp/render_log.txt.

### Per-Section SVG Icons

Each section/category should have a unique inline SVG icon.
Do NOT use unicode emojis - they render as empty boxes in headless Chromium.
Instead, create simple SVG icons (24x24 viewBox) with stroke-based designs.
Store icon SVG strings in the JSON data and inject into templates.
