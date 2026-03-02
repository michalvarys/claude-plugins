---
description: Create a video post from a YouTube video, PDF, or article
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task
argument-hint: <youtube-url | pdf-path | article-url> [angle/focus]
---

Create a video post based on content from: $ARGUMENTS

This command extracts key content from an external source and transforms it into a single branded video post with voiceover and background music.

## Step 0: Extract Content from Source (with Caching)

1. Read the **extract-content** skill carefully — it contains the ONLY working method for YouTube transcripts AND the source caching system
2. **Check source cache first**:
   - Determine the cache key (e.g., `yt-{VIDEO_ID}`, `article-{slug}`, `pdf-{slug}`)
   - Check if `outputs/_sources/{cache-key}/` exists
   - **If cached**: Read `transcript.txt`/`raw-content.txt` and `content-brief.md` from cache — skip extraction entirely
   - **If not cached**: Extract content (see below), then save to `outputs/_sources/{cache-key}/`
3. If extraction is needed, identify the source type:
   - **YouTube URL** (contains youtube.com or youtu.be) → **MUST use youtubetotranscript.com** (see extract-content skill for details). Extract video ID, navigate Chrome to `https://youtubetotranscript.com/transcript?v={VIDEO_ID}`, extract text from `#transcript` element via `javascript_tool`. Do NOT try to extract transcript directly from youtube.com — it will fail.
   - **PDF file** (ends with .pdf or is a file path) → use Read tool or pdf skill to extract text
   - **Article URL** (any other URL) → use WebFetch to extract article content
4. **Save to source cache** (if newly extracted):
   - `mkdir -p outputs/_sources/{cache-key}/`
   - Save raw content as `transcript.txt` (YouTube) or `raw-content.txt` (article/PDF)
   - Save `content-brief.md` and `metadata.json`
5. Create a **Content Brief** following the extract-content skill format (or load existing from cache):
   - Key points (ordered by importance)
   - Quotable lines / hooks
   - Suggested video angle
   - Suggested opening hook
6. **Show the Content Brief to the user** and ask for approval / adjustments before proceeding
7. If the user specifies an angle or focus, prioritize that over the default extraction

### Source-Specific Notes

**YouTube:**
- **ALWAYS use youtubetotranscript.com** — navigate Chrome to `https://youtubetotranscript.com/transcript?v={VIDEO_ID}` and extract from `#transcript` element via `javascript_tool`
- The transcript can be 30-50K+ chars — chunk extraction (12K per chunk) and save to file
- Extract the core message, not the entire transcript
- If the video is long (>10min), focus on the most impactful 3-5 points
- Adapt the speaker's style — if it's Hormozi, keep the direct/punchy tone
- If English source → Czech target: translate naturally, keep business terms

**PDF:**
- Focus on headings, conclusions, and key data points
- Long PDFs: prioritize executive summary and key chapters
- Extract statistics and concrete examples for visual scenes

**Article:**
- Extract the main thesis, supporting arguments, and any data
- Use the article's headline as inspiration for the hook (but make it punchier)
- Focus on unique insights, skip general knowledge

## Step 1: Plan the Video

Based on the Content Brief:

1. **Choose 3-6 key points** that fit a 25-45 second video
2. **Write the video script** — map content to scenes:
   - Scene 1: Hook (from the source's most compelling point)
   - Scenes 2-4: Key arguments/data/examples
   - Scene 5: Takeaway/pivot
   - Scene 6: CTA + branding
3. **Estimate duration**: ~4-7 seconds per scene
4. **Choose a visual angle**: What makes this visually interesting? Numbers? Contrast? Before/after?

## Step 2: Set Up Post Folder

1. Choose a descriptive kebab-case slug from the content (e.g., `hormozi-100m-offers`, `jak-zvysit-konverze`)
2. Create folder: `mkdir -p outputs/{slug}/`
3. Save the Content Brief and script in the folder

## Step 3: Create the Video

Follow Steps 1–6 from `create-video-post`:

### Design HTML
- Read create-animated-video skill + references
- Design HTML matching the extracted content
- Use the source's key data/quotes as visual elements
- NEVER use emoji — always inline SVG icons
- Include "Start a Business" branding + "@michalvarys.eu"
- **Source attribution**: Include a subtle "Zdroj: {source name}" text in the last scene or as a small label
- Follow all typography rules (body: `clamp(1.2rem, 3.2vh, 3.5rem)+`, no text below `clamp(0.8rem, 1.8vh, 2rem)`)
- First animation at 0.3–0.5s, no dead gaps

### Render Video
- Playwright + ffmpeg, 1080x1920 (9:16)

### Validate Rendered Video (MANDATORY)
1. Read the **validate-video** skill
2. Run the validation script on the HTML + silent video:
   ```bash
   node validate-video.mjs outputs/{slug}/{slug}-video.html {duration} 1080 1920
   ```
3. If any check **FAILs** — STOP, fix the HTML, re-render, and re-validate before generating voiceover
4. Do NOT proceed until validation passes

### Generate Voiceover
- Read generate-voiceover skill
- Voiceover ~2s shorter than video
- Script based on the Content Brief, first sentence = immediate hook
- Language matches target audience (usually Czech)

### Generate Background Music
- Read generate-background-music skill
- Upbeat, energetic prompt
- Duration matches video

### Mix Audio
```bash
ffmpeg -y -i voiceover.mp3 -i bg_music.mp3 \
  -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=0.015[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k mixed_audio.m4a
```
Voiceover at 100%, bg at 1.5%, `normalize=0` mandatory.

### Merge with Video
```bash
ffmpeg -y -i video.mp4 -i mixed_audio.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest \
  -map 0:v:0 -map 1:a:0 {slug}-final.mp4
```

### Validate Final Video (MANDATORY)
1. Run full validation with voiceover and final video:
   ```bash
   node validate-video.mjs outputs/{slug}/{slug}-video.html {duration} 1080 1920 outputs/{slug}/{slug}-voiceover.mp3 outputs/{slug}/{slug}-final.mp4
   ```
2. If any check **FAILs** — fix and re-validate before proceeding
3. Only generate captions and deliver after validation passes

### Generate Captions
- Platform-specific text for Instagram, TikTok, Threads
- Reference the original source if appropriate (e.g., "Inspirováno videem od @hormozi")

## Step 4: Deliver

1. Show the final video + captions
2. List all files in the post folder
3. Ask if user wants to publish, schedule, or adjust
