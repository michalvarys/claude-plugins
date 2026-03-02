---
name: validate-video
description: >
  Validate a rendered video for quality issues before publishing or proceeding to the next video in a series.
  Checks scene overlaps, text viewport overflow, voiceover duration sync, first-animation timing,
  blank frames, and branding presence. This skill runs automatically after video rendering
  in create-video-post, create-video-from-source, and create-video-series workflows.
  Use when the user asks to "validate video", "check video quality", "verify video renders correctly",
  or automatically after any video rendering step.
version: 0.1.0
---

# Validate Video — Post-Render Quality Assurance

This skill validates a rendered video post for common quality issues BEFORE the video is considered complete. It MUST run after every video render — the agent must NOT proceed to the next video in a series or to delivery until all checks pass.

## When This Runs

- **Automatically** after Step 2 (Render Video) and again after Step 5 (final merge) in `create-video-post`
- **Automatically** after each lesson video is rendered in `create-video-series` — the next lesson MUST NOT start until the current one passes validation
- **Automatically** after video render in `create-video-from-source`
- **Manually** when user asks to validate/check a video

## What It Checks

### 1. Scene Overlap Detection (HTML analysis)

Multiple scenes visible at the same frame is the most destructive video bug. The validator checks every 0.5s of the video timeline for scene overlap.

**Method:**
1. Load the video HTML in Puppeteer at the target viewport (e.g., 1080x1920)
2. Pause all animations
3. For each time point (0s, 0.5s, 1.0s, ... up to video duration):
   - Seek all animations to that time
   - Query all `.scene` elements
   - For each scene, check computed styles: `opacity > 0` AND `visibility !== 'hidden'`
   - If MORE THAN ONE scene is visible at any time point → **FAIL: Scene overlap at {time}s**
4. Report which scenes overlap and at what times

**Fix guidance:** Check that base `.scene` class has `visibility: hidden` and NO animation property. Only scene-specific classes (`.scene-1`, `.scene-2`, etc.) should have the `sceneVis` animation.

### 2. Text Viewport Overflow Detection (HTML analysis)

Text outside the viewport is invisible in the rendered video. The validator checks all text elements at key frames.

**Method:**
1. Using the same Puppeteer session, for each scene's active time window:
   - Seek animations to the middle of each scene's duration
   - Query all visible text elements (`h1, h2, h3, h4, h5, h6, p, span, div` that contain text)
   - Get each element's `getBoundingClientRect()`
   - Check: `right > viewport.width` OR `bottom > viewport.height` OR `left < 0` OR `top < 0`
   - If any text element extends beyond viewport → **FAIL: Text overflow at {time}s — element "{text preview}" extends {direction} by {X}px**
2. Also check elements with `position: fixed` or `position: absolute` that might be off-screen

**Fix guidance:** Reduce text size, add padding, or restructure layout. Use `overflow: hidden` on containers as a safety net but prefer fixing the layout.

### 3. Voiceover Duration Sync (audio/video analysis)

The voiceover must be approximately 2 seconds shorter than the video to leave room for the final CTA/branding to linger silently.

**Method:**
1. Use ffprobe to get the video duration:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 {slug}-9x16.mp4
   ```
2. Use ffprobe to get the voiceover duration:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 {slug}-voiceover.mp3
   ```
3. Check constraints:
   - `voiceover_duration > video_duration` → **FAIL: Voiceover is LONGER than video by {X}s — voiceover will be cut off!**
   - `voiceover_duration > (video_duration - 1.5)` → **WARNING: Voiceover leaves less than 1.5s of silence at end — should be ~2s shorter**
   - `voiceover_duration < (video_duration - 5)` → **WARNING: Voiceover ends {X}s before video — too much dead silence at the end**
   - Otherwise → **PASS**

**Fix guidance:** If voiceover is too long, shorten the voiceover script and regenerate. NEVER extend the video to fit the voiceover.

### 4. First Animation Timing (HTML analysis)

The first visual element must appear within 0.3–0.5s. A blank screen at the start creates dead silence with no visual content.

**Method:**
1. In Puppeteer, seek animations to t=0ms
2. Check if any content is visible (any element with opacity > 0 besides background)
3. Seek to t=300ms — at least one text/visual element should be visible or animating in
4. Seek to t=500ms — the hook text MUST be visible by now
5. If no content visible at 500ms → **FAIL: First animation too slow — nothing visible at 0.5s**
6. If content appears between 500ms-1000ms → **WARNING: First animation appears at ~{time}s — should be 0.3-0.5s**

**Fix guidance:** Reduce `animation-delay` on Scene 1 elements to 0.3–0.5s.

### 5. Dead Gap Detection (HTML analysis)

There should be no moment where the screen is completely empty (no visible scene) during the video content portion (excluding the very first 0.3s).

**Method:**
1. For each 0.5s interval from 0.5s to (video_duration - 0.5s):
   - Check if ANY scene or content element is visible
   - If nothing visible → **FAIL: Dead gap at {time}s — no content visible**
2. Specifically check scene transition points (where one scene ends and next begins):
   - Scene N ends at `scene_start + scene_duration`
   - Scene N+1 starts at its `animation-delay`
   - If gap > 0.5s with no overlap → **WARNING: Gap of {X}s between scene {N} and scene {N+1}**

**Fix guidance:** Add 0.5s overlap between consecutive scenes, or reduce the gap between scene end and next scene start.

### 6. Final Video File Integrity (file analysis)

Verify the final output file is a valid, playable video.

**Method:**
1. Check file exists and size > 0:
   ```bash
   ls -la {slug}-final.mp4
   ```
2. Validate with ffprobe:
   ```bash
   ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,duration -of json {slug}-final.mp4
   ```
3. Check:
   - Has video stream (codec_name: h264) → if not, **FAIL: No video stream**
   - Has audio stream (codec_name: aac) → if not, **FAIL: No audio stream** (only if voiceover was generated)
   - Resolution matches target (e.g., 1080x1920) → if not, **WARNING: Unexpected resolution {W}x{H}**
   - Duration matches expected → if off by > 1s, **WARNING: Duration mismatch**
4. Check for black/blank frames at start and end:
   ```bash
   ffmpeg -i {slug}-final.mp4 -vf "blackdetect=d=0.5:pix_th=0.10" -an -f null - 2>&1 | grep blackdetect
   ```
   - If black frames detected in first 1s → **WARNING: Black frames at video start**
   - If black frames detected in content area → **FAIL: Black frames detected at {time}s**

### 7. Branding Presence Check (HTML analysis)

Every video must include the "Start a Business" branding.

**Method:**
1. In Puppeteer, seek to the last scene's active time
2. Search for text content containing "Start a Business" and "@michalvarys.eu"
3. Verify the branding elements are visible (opacity > 0, within viewport)
4. If "Start a Business" not found → **FAIL: Missing brand name**
5. If "@michalvarys.eu" not found → **FAIL: Missing handle**
6. If handle opacity < 0.6 → **WARNING: Handle too subtle — opacity should be 0.65+**

## Validation Script

Read `references/validate-video.mjs` for the complete automated validation script. Run it with:

```bash
node validate-video.mjs <html-file> <video-duration-seconds> <viewport-width> <viewport-height> [voiceover-file] [final-video-file]
```

Example:
```bash
node validate-video.mjs outputs/my-post/my-post-video.html 25 1080 1920 outputs/my-post/my-post-voiceover.mp3 outputs/my-post/my-post-final.mp4
```

## Output Format

The validator outputs a structured report:

```
========================================
VIDEO VALIDATION REPORT
========================================
File: my-post-video.html
Duration: 25s | Viewport: 1080x1920

[PASS] Scene Overlap Detection — no overlaps found
[FAIL] Text Viewport Overflow — 2 elements overflow
  - Scene 2, element ".card-title" extends right by 45px at t=8.0s
  - Scene 3, element ".body-text" extends bottom by 120px at t=16.0s
[PASS] Voiceover Duration — 22.8s voice / 25.0s video (2.2s gap)
[PASS] First Animation — content visible at 0.3s
[WARNING] Dead Gap — 0.7s gap between scene 2 and scene 3
[PASS] File Integrity — h264+aac, 1080x1920, 25.1s
[PASS] Branding — "Start a Business" + "@michalvarys.eu" present

RESULT: 1 FAIL, 1 WARNING — FIX REQUIRED
========================================
```

## Decision Logic After Validation

### If all checks PASS:
- Proceed to next step (voiceover, audio mixing, delivery, or next lesson in series)

### If any check is FAIL:
- **STOP** — do not proceed
- Report the specific failures to the agent
- The agent MUST fix the issues and re-render
- Re-run validation after fixes
- Repeat until all FAILs are resolved

### If only WARNINGs (no FAILs):
- Report warnings to the agent
- Agent should attempt to fix warnings if the fix is simple
- May proceed if warnings are minor and fixing would require significant rework
- Document any accepted warnings in the post folder

## Integration with Series Workflow

When used in `create-video-series`, the validation acts as a **gate** between lessons:

```
Lesson 1: Design → Render → VALIDATE → Voiceover → Mix → VALIDATE final → OK
Lesson 2: Design → Render → VALIDATE → Voiceover → Mix → VALIDATE final → OK
Lesson 3: Design → Render → VALIDATE → Voiceover → Mix → VALIDATE final → OK
...
```

The agent MUST NOT start designing Lesson N+1 until Lesson N passes final validation. This ensures:
1. Each video in the series is verified before moving on
2. Issues are caught early, not after all lessons are rendered
3. Visual consistency problems (like text overflow from a shared template) are fixed once and applied to subsequent lessons

## Running Validation Manually

If the automated script is not available or cannot run, the agent should perform these checks manually:

### Manual Scene Overlap Check
```javascript
// In Puppeteer or browser console, for each 0.5s interval:
const scenes = document.querySelectorAll('.scene');
const visibleScenes = [];
scenes.forEach((s, i) => {
  const style = getComputedStyle(s);
  if (parseFloat(style.opacity) > 0 && style.visibility !== 'hidden') {
    visibleScenes.push(i + 1);
  }
});
if (visibleScenes.length > 1) console.error(`OVERLAP: Scenes ${visibleScenes.join(', ')} visible simultaneously`);
```

### Manual Text Overflow Check
```javascript
// For each visible text element:
const elements = document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,div');
elements.forEach(el => {
  if (el.textContent.trim() && getComputedStyle(el).opacity > '0') {
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) console.error(`Overflow right: "${el.textContent.substring(0,30)}..." by ${rect.right - window.innerWidth}px`);
    if (rect.bottom > window.innerHeight) console.error(`Overflow bottom: "${el.textContent.substring(0,30)}..." by ${rect.bottom - window.innerHeight}px`);
    if (rect.left < 0) console.error(`Overflow left: "${el.textContent.substring(0,30)}..." by ${Math.abs(rect.left)}px`);
    if (rect.top < 0) console.error(`Overflow top: "${el.textContent.substring(0,30)}..." by ${Math.abs(rect.top)}px`);
  }
});
```

### Manual Duration Check
```bash
# Get video duration
ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4

# Get voiceover duration
ffprobe -v error -show_entries format=duration -of csv=p=0 voiceover.mp3

# Calculate: voiceover should be ~2s shorter than video
```
