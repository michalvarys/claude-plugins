---
description: Create a complete video post with voiceover and background music
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task
argument-hint: <topic> [duration]
---

Create a complete video post with voiceover and background music about: $ARGUMENTS

This is the full video production pipeline. Follow these steps IN ORDER:

## Step 0: Set Up Post Folder
1. Choose a descriptive kebab-case slug based on the content topic (e.g., `dont-sell-your-time`, `hormozi-money-models`)
2. NEVER use generic names like `post15` or `post_16` — name by content
3. Create folder: `mkdir -p outputs/{slug}/`
4. ALL files for this post go into this folder

## Step 1: Design Animated HTML
1. Read the create-animated-video skill and its references
2. Design an HTML page with CSS scene-based animations matching the topic
3. Use viewport-relative units for responsive sizing
4. NEVER use emoji characters — always use inline SVG icons
5. Include the "Start a Business" branding with prominent "@michalvarys.eu" handle
6. **CRITICAL — Typography**: ALL body text, descriptions, and labels must be large and readable:
   - Body/detail text: `clamp(1.2rem, 3.2vh, 3.5rem)` minimum, weight 600+, opacity 0.85+
   - Labels/tags: `clamp(0.9rem, 2.2vh, 2.5rem)` minimum, weight 600+, opacity 0.75+
   - NO text below `clamp(0.8rem, 1.8vh, 2rem)` — anything smaller is unreadable on mobile
   - When in doubt, make it BIGGER. We have plenty of space on 9:16.
7. **CRITICAL — First Animation Speed**: Scene 1 elements MUST appear within 0.3–0.5s. No slow fade-in at the start — the voiceover starts speaking immediately and the first text must be visible instantly.
8. **CRITICAL — No Dead Gaps**: Every scene transition should overlap by ~0.5s so there's always something visible while voiceover is speaking.
9. Save HTML to the post folder

## Step 2: Render Video
1. Use Playwright to capture frames from the HTML animation
2. Pipe frames to ffmpeg to encode MP4
3. Default format: 9x16 (1080x1920) for Reels/TikTok
4. Save the silent video to the post folder

## Step 2.5: Validate Rendered Video (MANDATORY)
1. Read the **validate-video** skill
2. Run the validation script on the HTML + silent video:
   ```bash
   node validate-video.mjs outputs/{slug}/{slug}-video.html {duration} 1080 1920
   ```
3. If any check **FAILs** — STOP, fix the HTML, re-render, and re-validate
4. Do NOT proceed to voiceover generation until validation passes
5. WARNINGs should be fixed if the fix is simple, otherwise document and continue

## Step 3: Generate Voiceover
1. Read the generate-voiceover skill
2. Write a voiceover script: ~2.5 words/second, targeting ~2s shorter than video (e.g., 25s video → ~57 words for ~23s)
3. First sentence is an immediate hook (NO filler intro)
4. Generate audio via ElevenLabs TTS API (use browser JS if sandbox blocks API)
5. Save voiceover MP3 and script to the post folder

## Step 3.5: Verify Voiceover Duration & Adjust Video (MANDATORY GATE)
**TTS output duration is unpredictable — you MUST verify and adjust.**
1. Check actual voiceover duration:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 {slug}-voiceover.mp3
   ```
2. **If voiceover > (video_duration - 2s): EXTEND THE VIDEO** (this is the most common case!)
   - New duration = `ceil(voiceover_duration) + 2`
   - Rescale ALL CSS `animation-delay` values and `sceneVis` durations: multiply by `new_duration / old_duration`
   - Update DURATION in render script
   - Re-render the silent video at the new duration
   - Do NOT try to regenerate TTS to hit an exact duration — it's unreliable and wastes API credits
3. **If voiceover < (video_duration - 5s):** Shorten video or regenerate with longer script
4. **Do NOT proceed** until: `video_duration - voiceover_duration` is between 1.5s and 5s

## Step 4: Generate Background Music
1. Read the generate-background-music skill
2. Choose a music prompt matching the content mood
3. Generate ambient background music via ElevenLabs Sound Effects API
4. Duration should match the video length
5. Save bg music MP3 to the post folder

## Step 5: Mix and Merge Audio
1. Mix voiceover (100% volume) + background music (**1.5% volume**) using ffmpeg:
   ```
   ffmpeg -y -i voiceover.mp3 -i bg_music.mp3 \
     -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=0.015[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[out]" \
     -map "[out]" -c:a aac -b:a 192k mixed_audio.m4a
   ```
   **The voiceover MUST be at 100% volume — NEVER reduce it. Bg music at 1.5%.**
   **CRITICAL: `normalize=0` is mandatory — without it, amix auto-halves the voiceover volume.**
2. Merge mixed audio with the video:
   ```
   ffmpeg -y -i video.mp4 -i mixed_audio.m4a \
     -c:v copy -c:a aac -b:a 192k -shortest \
     -map 0:v:0 -map 1:a:0 {slug}-final.mp4
   ```

## Step 5.5: Validate Final Video (MANDATORY)
1. Run the full validation including voiceover and final video:
   ```bash
   node validate-video.mjs outputs/{slug}/{slug}-video.html {duration} 1080 1920 outputs/{slug}/{slug}-voiceover.mp3 outputs/{slug}/{slug}-final.mp4
   ```
2. This checks: scene overlaps, text overflow, voiceover duration sync, first animation timing, dead gaps, branding, file integrity, and black frames
3. If any check **FAILs** — STOP, fix the issue, and re-validate
4. Only proceed to delivery after all checks pass

## Step 5.7: Generate Thumbnail (MANDATORY)
1. Use Puppeteer to screenshot the HTML at **3 seconds** (Scene 1 hook fully visible):
   ```javascript
   await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });
   await new Promise(r => setTimeout(r, 3000));
   await page.screenshot({ path: "thumbnail.png", type: "png" });
   ```
2. Save as `thumbnail.png` in the post folder
3. This prevents blank/black grid previews when publishing to platforms

## Step 6: Generate Post Text
1. Write platform-specific post text:
   - Instagram: full caption with hashtags
   - TikTok title: short hook (~150 chars)
   - TikTok description: full text with hashtags
   - Threads title: short hook
   - Threads description: full text
2. Save to the post folder as `{slug}-captions.md`

## Step 7: Deliver
1. Show user the final video file
2. List all generated files
3. Ask if user wants additional formats (4x5, 1x1, 16x9)
4. Ask if user wants to publish or schedule the post
