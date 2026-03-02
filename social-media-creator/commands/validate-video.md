---
description: Validate a rendered video for quality issues (overlaps, overflow, voiceover sync)
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
argument-hint: <post-folder-path> [video-duration-seconds]
---

Validate the video in: $ARGUMENTS

This command runs quality assurance checks on a rendered video post to catch common issues before publishing.

## Steps

1. Read the **validate-video** skill for full check details and the validation script
2. Locate the post folder and identify files:
   - `{slug}-video.html` — the source HTML
   - `{slug}-9x16.mp4` or similar — the rendered silent video
   - `{slug}-voiceover.mp3` — voiceover audio (if exists)
   - `{slug}-final.mp4` — final merged video (if exists)
3. Determine video duration from the HTML or ffprobe
4. Run the validation script:
   ```bash
   node validate-video.mjs <html-file> <duration> 1080 1920 [voiceover.mp3] [final.mp4]
   ```
5. If the script is not available, perform manual checks as described in the skill
6. Report results and fix any FAIL issues before proceeding
