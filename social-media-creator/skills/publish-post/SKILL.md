---
name: publish-post
description: >
  Publish social media posts across Instagram, Threads, and TikTok via upload-post.com API.
  Use when the user asks to "publish a post", "post to social media",
  "upload to Instagram", "share on TikTok", "publish across platforms",
  "create a publish script", or wants to distribute content to multiple social networks.
version: 0.1.0
---

# Publish Post

Publish social media posts across Instagram, Threads, and TikTok using the upload-post.com API.

## API Configuration

- **Endpoint**: `https://api.upload-post.com/api/upload_photos`
- **Method**: POST (multipart/form-data)
- **Auth Header**: `Authorization: Apikey <API_KEY>`
- **User**: Set per account (e.g., `varyshop`)

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | string | Account username |
| `title` | string | Main post text (used as fallback) |
| `platform[]` | array | Platforms: `instagram`, `threads`, `tiktok` |
| `photos[]` | file | Image file(s) — use `@filename.png` in curl |
| `media_type` | string | `IMAGE` or `CAROUSEL` |
| `async_upload` | boolean | `true` for async processing |

## Platform-Specific Text Fields

Each platform can have its own optimized text:

| Field | Platform | Notes |
|-------|----------|-------|
| `instagram_title` | Instagram | Full caption with hashtags |
| `tiktok_title` | TikTok | Short hook — max ~150 chars |
| `tiktok_description` | TikTok | Full description |
| `threads_title` | Threads | Short hook line |
| `threads_description` | Threads | Full body text |

## Additional Settings

Always include these fields:

```
privacy_level=PUBLIC_TO_EVERYONE
disable_comment=false
brand_content_toggle=false
brand_organic_toggle=false
post_mode=DIRECT_POST
auto_add_music=false
photo_cover_index=0
threads_long_text_as_post=false
```

## Single Image Post

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'title=Main post text with #hashtags' \
  -F 'platform[]=instagram' \
  -F 'platform[]=threads' \
  -F 'platform[]=tiktok' \
  -F 'async_upload=true' \
  -F 'photos[]=@post_image.png' \
  -F 'instagram_title=Instagram caption with #hashtags' \
  -F 'media_type=IMAGE' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -F 'disable_comment=false' \
  -F 'brand_content_toggle=false' \
  -F 'brand_organic_toggle=false' \
  -F 'tiktok_title=Short TikTok hook text' \
  -F 'post_mode=DIRECT_POST' \
  -F 'auto_add_music=false' \
  -F 'photo_cover_index=0' \
  -F 'tiktok_description=Full TikTok description with #hashtags' \
  -F 'threads_long_text_as_post=false' \
  -F 'threads_title=Short hook' \
  -F 'threads_description=Full threads text with #hashtags' \
  -X POST "https://api.upload-post.com/api/upload_photos"
```

## Carousel Post

For multi-image carousel posts, change `media_type` to `CAROUSEL` and add multiple `photos[]`:

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'title=Carousel post text' \
  -F 'platform[]=instagram' \
  -F 'media_type=CAROUSEL' \
  -F 'async_upload=true' \
  -F 'photos[]=@slide1.png' \
  -F 'photos[]=@slide2.png' \
  -F 'photos[]=@slide3.png' \
  -F 'photos[]=@slide4.png' \
  -F 'instagram_title=Instagram caption...' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -X POST "https://api.upload-post.com/api/upload_photos"
```

## Generating Publish Scripts

When generating a shell script for batch publishing:

1. Set API_KEY and USER variables at the top
2. Add a `sleep 3` between API calls to avoid rate limiting
3. Handle shell escaping — use `'"'"'` for apostrophes in `-F` values
4. Always generate platform-specific text for each platform
5. Generate the script as a `.sh` file the user can run locally

## Text Optimization Per Platform

When creating post text, optimize for each platform:

- **Instagram**: Full text with line breaks, emojis in text (not images), 6-8 hashtags at the end
- **TikTok title**: Punchy one-liner hook (max ~150 chars)
- **TikTok description**: Full text with hashtags
- **Threads title**: Hook/opening line only
- **Threads description**: Full text, slightly more conversational tone

## Publish Metadata — MANDATORY

After every successful publish (or when generating a publish script), **ALWAYS save publish metadata** into the post folder. This is critical for future reposts, analytics, and content tracking.

### Save `publish-meta.json` in the Post Folder

```json
{
  "published_at": "2026-03-01T14:30:00Z",
  "platforms": ["instagram", "threads", "tiktok"],
  "post_type": "video",
  "media_files": ["hormozi-prodavej-bohatum-final.mp4"],
  "captions": {
    "instagram": "Full Instagram caption text...",
    "tiktok_title": "Short TikTok hook...",
    "tiktok_description": "Full TikTok description...",
    "threads_title": "Short Threads hook...",
    "threads_description": "Full Threads text..."
  },
  "api_response": {},
  "source_cache_key": "yt-ZuJryiwxjDw",
  "slug": "hormozi-prodavej-bohatum",
  "tags": ["hormozi", "business", "money"],
  "repost_eligible": true,
  "repost_after_days": 30,
  "repost_history": []
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `published_at` | ISO 8601 | Timestamp when the post was published (or script generated) |
| `platforms` | string[] | Which platforms it was published to |
| `post_type` | string | `image`, `video`, `carousel` |
| `media_files` | string[] | Filenames of published media (relative to post folder) |
| `captions` | object | All platform-specific text used in the publish |
| `api_response` | object | Raw API response (if available), empty `{}` if script-based |
| `source_cache_key` | string\|null | Cache key from `_sources/` if the post was created from an external source |
| `slug` | string | Post folder name |
| `tags` | string[] | Topic tags for content categorization (extracted from captions/content) |
| `repost_eligible` | boolean | Whether this post can be reposted (default: `true`) |
| `repost_after_days` | number | Minimum days before reposting (default: `30`) |
| `repost_history` | array | Array of `{ "date": "ISO", "platforms": [...] }` entries for each repost |

### When to Save

- **After successful API call**: Save immediately with `api_response` populated
- **When generating .sh script**: Save with `api_response: {}` and `published_at` set to the current timestamp (update later when script is actually run if possible)
- **On repost**: Append to `repost_history` array, update `published_at` to latest

### Generating Metadata (Bash)

```bash
# Generate publish-meta.json
cat > outputs/{slug}/publish-meta.json << 'METAEOF'
{
  "published_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": ["instagram", "threads", "tiktok"],
  "post_type": "video",
  "media_files": ["{slug}-final.mp4"],
  "captions": {
    "instagram": "...",
    "tiktok_title": "...",
    "tiktok_description": "...",
    "threads_title": "...",
    "threads_description": "..."
  },
  "api_response": {},
  "source_cache_key": null,
  "slug": "{slug}",
  "tags": [],
  "repost_eligible": true,
  "repost_after_days": 30,
  "repost_history": []
}
METAEOF
```

## Workflow

1. Ensure the image/carousel PNGs are ready
2. Write post text for all platforms
3. Generate a curl command or shell script with all fields
4. Execute the curl command (or provide script for user to run locally)
5. Verify async upload status if needed
6. **Save `publish-meta.json`** to the post folder with all publish details

## Important Notes

- The API may not be reachable from all environments (e.g., VM proxy restrictions). In that case, generate a `.sh` script for the user to run from their local machine.
- Always use `async_upload=true` for reliability.
- The API key and user credentials should be stored securely, not hardcoded in shared files.
- **ALWAYS save publish-meta.json** — even when generating a script instead of calling the API directly.
