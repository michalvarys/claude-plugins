---
name: extract-content
description: >
  Extract key content from external sources (YouTube videos, PDFs, web articles) for video creation.
  Use when the user provides a YouTube link, PDF file, or article URL and wants to create video content from it.
  Supports Czech and English content. Outputs a structured content brief for downstream video skills.
version: 0.1.0
---

# Extract Content from Sources

Extract and structure content from YouTube videos, PDF documents, and web articles into a format ready for video creation.

## Supported Source Types

| Source | How to Extract | Notes |
|--------|---------------|-------|
| **YouTube video** | Use **youtubetotranscript.com** via Chrome browser to extract transcript | Extract full spoken content, then title/description via WebFetch |
| **PDF file** | Use `Read` tool on the PDF file path, or use pdf skill for complex PDFs | Extract headings, key sections, main arguments |
| **Web article** | Use `WebFetch` on the article URL | Extract title, headings, key paragraphs, main takeaways |

## YouTube Transcript Extraction — CRITICAL

**DO NOT try to extract transcripts directly from youtube.com** — it will NOT work (YouTube blocks automated transcript access, sandbox blocks direct API calls, and captions DOM is not reliably accessible).

**ALWAYS use youtubetotranscript.com** — this is the ONLY reliable method.

### Step-by-step:

1. **Extract the video ID** from the YouTube URL:
   - `https://www.youtube.com/watch?v=ZuJryiwxjDw` → video ID = `ZuJryiwxjDw`
   - `https://youtu.be/ZuJryiwxjDw` → video ID = `ZuJryiwxjDw`

2. **Navigate to the transcript page** in Chrome browser:
   ```
   https://youtubetotranscript.com/transcript?v={VIDEO_ID}
   ```

3. **Extract the transcript** from the `#transcript` element using Chrome browser JS:
   ```javascript
   // The transcript text is inside the #transcript element
   // It can be large (50K+ chars), so extract in chunks if needed
   const text = document.querySelector('#transcript')?.innerText || '';

   // For large transcripts, chunk it:
   const chunks = [];
   const chunkSize = 12000;
   for (let i = 0; i < text.length; i += chunkSize) {
     chunks.push(text.substring(i, i + chunkSize));
   }
   window.__transcript_chunks = chunks;
   ```

4. **Read each chunk** via separate JS calls:
   ```javascript
   window.__transcript_chunks[0]  // first chunk
   window.__transcript_chunks[1]  // second chunk
   // ... etc
   ```

5. **Save the full transcript** to a file in the post folder

### Important Notes:
- The page has a LOT of text — always target the `#transcript` CSS selector specifically
- Do NOT use `get_page_text` or `read_page` on this page — too much noise. Use `javascript_tool` with the `#transcript` selector
- Transcripts can be 30K-50K+ characters for long videos — always chunk the extraction
- The transcript is plain text without timestamps (which is fine for our video creation pipeline)

## Content Structuring

After extracting raw content, structure it into a **Content Brief**:

```markdown
# Content Brief

## Source
- Type: [youtube | pdf | article]
- URL/Path: [source location]
- Original Title: [title from source]
- Language: [cs | en]

## Key Points (ordered by importance)
1. [Most important takeaway]
2. [Second key point]
3. [Third key point]
...

## Detailed Summary
[2-3 paragraph summary of the full content]

## Quotable Lines
- "[Direct quote or paraphrase that works as a hook]"
- "[Another strong statement]"

## Suggested Video Angle
[1-2 sentences on the best angle for a social media video]

## Suggested Hook
[Opening line that grabs attention in the first 2 seconds]
```

## Content Brief for Video Series

When extracting for a multi-lesson series, add:

```markdown
## Series Breakdown
### Lesson 1: [Title]
- Key points: [...]
- Duration estimate: [X seconds]

### Lesson 2: [Title]
- Key points: [...]
- Duration estimate: [X seconds]

[... etc]

## Series Arc
- Opening lesson hook: [how to introduce the series]
- Progression: [how lessons build on each other]
- Finale: [how the series concludes with a strong CTA]
```

## Guidelines for Content Extraction

### From YouTube
- Focus on the speaker's main arguments, not filler
- Identify the "hook" — what made this video compelling
- Note timestamps for key topic changes
- If the video is in English and target is Czech, translate key points to Czech
- Preserve the speaker's energy and style when adapting

### From PDFs
- Focus on headings, bold text, and conclusions first
- Extract data points, statistics, and concrete examples
- Ignore boilerplate (headers, footers, page numbers, legal text)
- For long PDFs, prioritize the executive summary and key chapters

### From Articles
- Extract the headline, subheadings, and key paragraphs
- Focus on unique insights, not general knowledge
- Note any data, statistics, or quotes worth featuring
- Identify the article's main thesis in one sentence

## Language Handling

- If the source is in English and the target audience is Czech:
  - Translate key points naturally (not literal translation)
  - Adapt idioms and cultural references for Czech audience
  - Keep technical terms that are commonly used in Czech business context (e.g., "startup", "marketing", "brand")
- If the source is in Czech, keep it as-is
- The Content Brief should always be in the **target language** (usually Czech)

## Source Caching

Extracted sources are **cached at the root level** of the outputs folder so they can be reused across multiple posts/series without re-extraction.

### Cache Location

```
outputs/
├── _sources/                          ← shared source cache
│   ├── yt-ZuJryiwxjDw/               ← YouTube video (keyed by video ID)
│   │   ├── transcript.txt             ← raw transcript
│   │   ├── content-brief.md           ← structured Content Brief
│   │   └── metadata.json              ← title, URL, language, extraction date
│   ├── article-abc123/                ← article (keyed by URL slug/hash)
│   │   ├── raw-content.txt            ← extracted article text
│   │   ├── content-brief.md
│   │   └── metadata.json
│   └── pdf-my-document/               ← PDF (keyed by filename slug)
│       ├── raw-content.txt
│       ├── content-brief.md
│       └── metadata.json
├── hormozi-prodavej-bohatum/          ← post folder (uses cached source)
├── hormozi-offers-lekce/              ← series folder (uses same cached source)
└── ...
```

### Cache Key Convention

| Source Type | Cache Folder Name | Key |
|---|---|---|
| YouTube | `yt-{VIDEO_ID}` | Video ID from URL (e.g., `yt-ZuJryiwxjDw`) |
| Article | `article-{slug}` | Slugified domain+path, max 60 chars (e.g., `article-forbes-com-ai-trends-2026`) |
| PDF | `pdf-{filename-slug}` | Slugified filename without extension (e.g., `pdf-startup-handbook`) |

### metadata.json Format

```json
{
  "type": "youtube",
  "source_url": "https://www.youtube.com/watch?v=ZuJryiwxjDw",
  "title": "If You Want More Money In 2026 Do This First",
  "language": "en",
  "extracted_at": "2026-02-28T14:30:00Z",
  "cache_key": "yt-ZuJryiwxjDw"
}
```

### Check-Before-Extract Logic

**ALWAYS check the cache before extracting from any source:**

1. Determine the cache key from the source URL/path
2. Check if `outputs/_sources/{cache-key}/` exists
3. **If cached**: Read existing `transcript.txt` / `raw-content.txt` and `content-brief.md` — skip extraction
4. **If not cached**: Extract content using the appropriate method, then save to cache:
   - `mkdir -p outputs/_sources/{cache-key}/`
   - Save raw content as `transcript.txt` (YouTube) or `raw-content.txt` (article/PDF)
   - Save the Content Brief as `content-brief.md`
   - Save `metadata.json` with source info and extraction timestamp

### Cache Key Generation (Bash)

```bash
# YouTube — extract video ID
VIDEO_ID="ZuJryiwxjDw"
CACHE_KEY="yt-${VIDEO_ID}"

# Article — slugify URL
URL="https://www.forbes.com/sites/ai-trends-2026"
CACHE_KEY="article-$(echo "$URL" | sed 's|https\?://||;s|www\.||;s|[^a-zA-Z0-9]|-|g;s|-\+|-|g;s|^-||;s|-$||' | cut -c1-60)"

# PDF — slugify filename
FILENAME="Startup Handbook.pdf"
CACHE_KEY="pdf-$(echo "${FILENAME%.*}" | tr '[:upper:]' '[:lower:]' | sed 's|[^a-z0-9]|-|g;s|-\+|-|g;s|^-||;s|-$||')"
```

### When Content Brief Needs Update

If the user requests a **different angle, focus, or series breakdown** from the same source, you have two options:
- **Reuse the raw content** (transcript/article text) — always reuse, never re-extract
- **Generate a new Content Brief** — save as `content-brief-{angle-slug}.md` alongside the original

## Workflow

1. Identify the source type (YouTube, PDF, article)
2. **Check source cache** (`outputs/_sources/{cache-key}/`) — if cached, load existing content
3. If not cached: extract raw content using the appropriate method and **save to cache**
4. Structure into a Content Brief (or load existing one from cache)
5. If for a series: break down into lesson-sized chunks
6. Pass the Content Brief to the video creation command
