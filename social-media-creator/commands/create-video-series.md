---
description: Create a series of connected lesson videos on a topic
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch, Task
argument-hint: <topic> [number-of-lessons] [duration-per-lesson]
---

Create a series of connected lesson videos about: $ARGUMENTS

This command creates multiple videos that form a coherent learning series — each video builds on the previous one and they share consistent branding, style, and numbering.

## Step 0: Plan the Series

1. **Define the topic and scope** based on user input
2. **If the user provides an external source** (YouTube URL, PDF, article), check the **source cache** first:
   - Read the **extract-content** skill for cache location and key conventions
   - Check if `outputs/_sources/{cache-key}/` exists — if so, load cached content instead of re-extracting
   - If not cached, extract and save to cache following the extract-content skill instructions
3. **Determine number of lessons** (default: 5 if not specified)
4. **Plan the series arc**:
   - Lesson 1: Hook + Introduction — grab attention, explain what the series covers
   - Lessons 2–(N-1): Core content — each lesson teaches one clear concept
   - Lesson N: Summary + CTA — recap key points, strong call to action
5. **Create a series outline** with:
   - Series title (e.g., "Jak založit e-shop" / "5 kroků k prvnímu zákazníkovi")
   - Each lesson: number, title, key points, estimated duration
   - How lessons connect to each other (references, callbacks)
6. **Save the outline** as `{series-slug}/series-outline.md`
7. **Show the outline to the user and get approval** before creating any videos

### Series Outline Format

```markdown
# Series: {Series Title}
## Topic: {topic}
## Lessons: {count}
## Target duration per lesson: {duration}s

---

### Lesson 1: {Title}
- **Key points**: [point 1], [point 2], [point 3]
- **Hook**: "[opening line]"
- **Connects to next**: "[teaser for lesson 2]"

### Lesson 2: {Title}
- **Key points**: [point 1], [point 2], [point 3]
- **Recap from previous**: "[brief callback to lesson 1]"
- **Connects to next**: "[teaser for lesson 3]"

[... etc]

### Lesson {N}: {Title} (Finale)
- **Key points**: [summary point 1], [summary point 2]
- **Series recap**: "[what we learned across all lessons]"
- **CTA**: "[strong call to action]"
```

## Step 1: Set Up Series Folder

1. Choose a descriptive kebab-case slug for the series (e.g., `jak-zalozit-eshop`, `5-kroku-k-zakaznikovi`)
2. Create the series root folder: `mkdir -p outputs/{series-slug}/`
3. Each lesson gets a subfolder: `outputs/{series-slug}/lesson-01-{lesson-slug}/`
4. Save the series outline in the root folder

## Step 2: Design Consistent Visual Style

Before creating individual lessons, define the **series visual identity**:

1. **Color palette** — consistent across all lessons
2. **Layout structure** — same basic HTML template for each lesson
3. **Lesson number badge** — prominent "Lekce 1/5", "Lekce 2/5" etc. visible in every video
4. **Series title** — shown at the start and/or end of each video (e.g., "Série: Jak založit e-shop")
5. **Consistent branding** — "@michalvarys.eu" handle + "Start a Business" in every video
6. **End-of-lesson teaser** — last scene of each lesson (except final) teases the next lesson
7. **Intro consistency** — every lesson starts with the series title + lesson number before the hook

### Lesson Number Badge (must be in every video)
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

## Step 3: Create Each Lesson Video

**CRITICAL: Each lesson MUST be fully validated before starting the next one.** Do NOT start Lesson N+1 until Lesson N passes all validation checks. This ensures issues are caught early and fixes from one lesson can be applied to subsequent lessons.

For EACH lesson, follow the full video creation pipeline (from create-video-post):

1. **Design HTML** — use the series template, customize content for this lesson
   - Include lesson number badge
   - First lesson: add series intro scene
   - Middle lessons: brief recap reference at start
   - Last lesson: add series recap + strong CTA
   - All lessons except last: add "next lesson teaser" at the end
2. **Render to MP4** via Playwright + ffmpeg
3. **VALIDATE rendered video (MANDATORY GATE)**:
   - Read the **validate-video** skill
   - Run validation:
     ```bash
     node validate-video.mjs outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-video.html {duration} 1080 1920
     ```
   - If any check **FAILs** — STOP, fix the HTML, re-render, re-validate
   - If the fix involves the shared series template, apply the fix to all subsequent lessons too
   - Do NOT proceed to voiceover until this passes
4. **Generate voiceover** (read generate-voiceover skill):
   - Voiceover ~2s shorter than video
   - First sentence is an immediate hook
   - Reference the series context ("V dnešní lekci...", "V minulé lekci jsme si ukázali...")
5. **Generate background music** (read generate-background-music skill):
   - Use the SAME music prompt for all lessons in the series (consistent feel)
   - Upbeat, energetic style
6. **Mix audio**: voiceover at 100%, bg music at 1.5%, `normalize=0`
7. **VALIDATE final video (MANDATORY GATE)**:
   - Run full validation:
     ```bash
     node validate-video.mjs outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-video.html {duration} 1080 1920 outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-voiceover.mp3 outputs/{series-slug}/lesson-{NN}-{slug}/lesson-{NN}-final.mp4
     ```
   - If any check **FAILs** — fix and re-validate
   - **Only after this lesson passes** → proceed to next lesson
8. **Generate captions** for each platform

### Typography Rules (same as create-video-post)
- Body/detail: `clamp(1.2rem, 3.2vh, 3.5rem)` minimum
- Labels/tags: `clamp(0.9rem, 2.2vh, 2.5rem)` minimum
- NO text below `clamp(0.8rem, 1.8vh, 2rem)`
- First animation at 0.3–0.5s, no dead gaps

### Audio Rules (same as create-video-post)
```bash
ffmpeg -y -i voiceover.mp3 -i bg_music.mp3 \
  -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=0.015[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k mixed_audio.m4a
```

## Step 4: Generate Series Captions

For each lesson, generate platform-specific text that:
- References the series name and lesson number
- Includes "Lekce X/Y" in the caption
- Links/references other lessons in the series
- Uses consistent hashtags across all lessons + series-specific hashtag

### Caption Template
```
{Series emoji placeholder} {Series Title} — Lekce {X}/{Y}: {Lesson Title}

{Lesson-specific caption text}

{Series hashtag} #StartABusiness #Podnikani #michalvaryseu
{Lesson-specific hashtags}
```

## Step 5: Deliver

1. Show the user ALL generated lesson videos
2. List the full folder structure
3. Ask if user wants to:
   - Publish all at once
   - Schedule them (e.g., one per day)
   - Make adjustments to any specific lesson
4. If scheduling, suggest a posting cadence (e.g., Mon/Wed/Fri or daily)
