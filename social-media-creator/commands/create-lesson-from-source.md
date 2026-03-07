---
description: Create a lesson series from a YouTube video, PDF, or article
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task
argument-hint: <youtube-url | pdf-path | article-url> [number-of-lessons] [duration-per-lesson]
---

Create a series of lesson videos based on content from: $ARGUMENTS

This command extracts content from an external source and breaks it into a multi-part lesson series — connected videos that teach the topic step by step.

## Step 0: Extract Content from Source (with Caching)

1. Read the **extract-content** skill carefully — it contains the ONLY working method for YouTube transcripts AND the source caching system
2. **Check source cache first**:
   - Determine the cache key (e.g., `yt-{VIDEO_ID}`, `article-{slug}`, `pdf-{slug}`)
   - Check if `outputs/_sources/{cache-key}/` exists
   - **If cached**: Read `transcript.txt`/`raw-content.txt` and `content-brief.md` from cache — skip extraction entirely
   - **If not cached**: Extract content (see below), then save to `outputs/_sources/{cache-key}/`
3. If extraction is needed, identify the source type:
   - **YouTube URL** → **MUST use youtubetotranscript.com**. Extract video ID from URL, navigate Chrome to `https://youtubetotranscript.com/transcript?v={VIDEO_ID}`, extract text from `#transcript` element via `javascript_tool` (chunk in 12K pieces for large transcripts). Do NOT try to extract transcript directly from youtube.com — it will fail.
   - **PDF file** → Read tool or pdf skill
   - **Article URL** → WebFetch
4. **Save to source cache** (if newly extracted):
   - `mkdir -p outputs/_sources/{cache-key}/`
   - Save raw content as `transcript.txt` (YouTube) or `raw-content.txt` (article/PDF)
   - Save `content-brief.md` and `metadata.json`
5. Create a **Content Brief** with the full **Series Breakdown** (see extract-content skill) — or load existing from cache
6. The extraction should be thorough — we need enough material for multiple lessons

### Extraction Depth by Source Length

| Source Length | Recommended Lessons | Notes |
|---|---|---|
| Short article / 5-10min video | 3 lessons | Focus on depth, not breadth |
| Medium article / 10-30min video | 4-5 lessons | Natural chapter breaks |
| Long PDF / 30min+ video | 5-8 lessons | Group related topics |
| Book / course material | 8-12 lessons | One lesson per chapter/module |

## Step 1: Plan the Series

1. Based on the Content Brief, **break the source into lesson-sized chunks**
2. Each lesson should cover **one clear concept** (not too much, not too little)
3. Plan the **series arc**:
   - Lesson 1: Hook + Why this matters — set the stage, create urgency
   - Middle lessons: Core teaching — one concept per lesson, building complexity
   - Final lesson: Recap + actionable CTA — bring it all together
4. Write a **Series Outline** (see format below)
5. **Show the outline to the user and get approval** before creating any videos

### Series Outline Format

```markdown
# Series: {Series Title}
## Source: {source type} — {source title/URL}
## Lessons: {count}
## Duration per lesson: {duration}s

---

### Lesson 1: {Title}
- **Source section**: [which part of the source this covers]
- **Key points**: [point 1], [point 2], [point 3]
- **Hook**: "[opening line]"
- **Connects to next**: "[teaser for lesson 2]"

### Lesson 2: {Title}
- **Source section**: [which part of the source this covers]
- **Key points**: [point 1], [point 2], [point 3]
- **Recap from previous**: "[brief callback]"
- **Connects to next**: "[teaser for lesson 3]"

[... etc]

### Lesson {N}: {Title} (Finale)
- **Source section**: [final section / summary]
- **Key points**: [key takeaway 1], [key takeaway 2]
- **Series recap**: "[what we learned]"
- **CTA**: "[call to action]"
```

## Step 2: Set Up Series Folder

1. Choose a descriptive kebab-case slug (e.g., `hormozi-offers-lekce`, `seo-zaklady-serie`)
2. Create series root: `mkdir -p outputs/{series-slug}/`
3. Each lesson subfolder: `outputs/{series-slug}/lesson-01-{lesson-slug}/`
4. Save the series outline + Content Brief in the root folder

## Step 3: Design Series Visual Style

Define consistent visual identity BEFORE creating individual lessons:

1. **Color palette** — derived from the source topic, consistent across all lessons
2. **HTML template** — shared layout structure for all lessons
3. **Lesson number badge** — "Lekce X/Y" visible in every video (top-right corner)
4. **Series title** — shown at start of each video
5. **Source attribution** — subtle "Zdroj: {source}" in the last scene of each video
6. **Branding** — "@michalvarys.eu" + "Start a Business" in every video
7. **End teaser** — last scene of each lesson (except final) teases the next topic

### Lesson Badge CSS
```css
.lesson-badge {
  position: fixed;
  top: 3vh;
  right: 4vw;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 0.8vh 2vw;
  font-size: clamp(0.9rem, 2.2vh, 2.5rem);
  font-weight: 700;
  color: rgba(255,255,255,0.9);
  z-index: 100;
}
```

## Step 4: Create Each Lesson Video

For EACH lesson, follow the full video pipeline:

### Design HTML
- Use the series template, customize for this lesson's content
- Include lesson number badge ("Lekce X/Y")
- Map source content to visual scenes (key quotes, data, examples from the source)
- Follow all typography rules (body: `clamp(1.2rem, 3.2vh, 3.5rem)+`)
- First animation at 0.3–0.5s, no dead gaps
- NEVER use emoji — always inline SVG icons

### Render Video
- Playwright + ffmpeg, 1080x1920 (9:16)

### Validate Rendered Video (MANDATORY)
1. Read the **validate-video** skill
2. Run validation on the HTML + silent video:
   ```bash
   node validate-video.mjs outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-video.html {duration} 1080 1920
   ```
3. If any check **FAILs** — STOP, fix HTML, re-render, re-validate
4. Do NOT proceed to voiceover until validation passes

### Generate Voiceover
- Read generate-voiceover skill
- Write script targeting ~2s shorter than video (~2.5 words/sec)
- Content derived from the source material for this lesson
- Reference the series: "V této lekci se podíváme na...", "V minulé lekci jsme zjistili..."
- First sentence = immediate hook, no filler

### Verify Voiceover Duration & Adjust Video (MANDATORY)
**TTS output duration is unpredictable — you MUST verify and adjust.**
```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 voiceover.mp3
```
- **If voiceover > (video - 2s): EXTEND THE VIDEO**
  - New duration = `ceil(voiceover_duration) + 2`
  - Rescale ALL `animation-delay` and `sceneVis` durations by `new_duration / old_duration`
  - Update DURATION in render script, re-render
  - Do NOT regenerate TTS — extend the video instead
- **If voiceover < (video - 5s):** Regenerate with longer script or shorten video
- Proceed only when gap is 1.5–5s

### Generate Background Music
- Read generate-background-music skill
- Use the **SAME music prompt** for all lessons (consistent feel across the series)
- Upbeat, energetic style
- Duration matches the (possibly extended) video

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
1. Run full validation:
   ```bash
   node validate-video.mjs outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-video.html {duration} 1080 1920 outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-voiceover.mp3 outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-final.mp4
   ```
2. If any check **FAILs** — fix and re-validate
3. **Do NOT start the next lesson** until this one passes all checks

### Generate Captions
- Platform-specific text with series context
- Include "Lekce X/Y" in every caption
- Reference the source: "Inspirováno: {source title}"
- Consistent series hashtag across all lessons

## Step 5: Deliver

1. Show ALL lesson videos to the user
2. Display the full folder structure
3. Ask the user:
   - Publish all at once or schedule?
   - Suggested cadence: one lesson per day or Mon/Wed/Fri
   - Any adjustments to specific lessons?
4. If scheduling, use the schedule-post skill
