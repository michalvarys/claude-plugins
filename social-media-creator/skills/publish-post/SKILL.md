---
name: publish-post
description: >
  Publish social media posts across Instagram, Threads, TikTok, Facebook, and YouTube
  via upload-post.com API. Use when the user asks to "publish a post", "post to social media",
  "upload to Instagram", "share on TikTok", "publish across platforms", "post to Facebook",
  "upload to YouTube", "create a publish script", or wants to distribute content to multiple social networks.
version: 0.3.0
---

# Publish Post

Publish social media posts across Instagram, Threads, TikTok, Facebook, and YouTube using the upload-post.com API.

## API Configuration

- **Auth Header**: `Authorization: Apikey <API_KEY>`
- **User**: Set per account (e.g., `varyshop`, `ezopeach`)
- **Credentials**: Load from `.env` file in the project folder. Expected vars: `UPLOAD_POST_API_KEY`, `UPLOAD_POST_PROFILE`

### Endpoints — Choose by Content Type

| Content Type | Endpoint | When to Use |
|---|---|---|
| **Image / Carousel** | `POST https://api.upload-post.com/api/upload_photos` | Static post PNGs, carousel slides |
| **Video** | `POST https://api.upload-post.com/api/upload` | MP4 videos (Reels, TikTok, YouTube, etc.) |

Both endpoints accept multipart/form-data.

## Supported Platforms

| Platform | `platform[]` value | Required Extra Fields |
|---|---|---|
| Instagram | `instagram` | `media_type` |
| Threads | `threads` | — |
| TikTok | `tiktok` | `privacy_level`, `post_mode` |
| Facebook | `facebook` | `facebook_page_id` (auto-detected if only one page) |
| YouTube | `youtube` | `title` (REQUIRED — generic fallback field) + `youtube_title` |

Default platforms: `instagram`, `threads`, `tiktok`, `facebook`, `youtube`

## CRITICAL API GOTCHAS

> **These are hard-won lessons from real API failures. Read carefully.**

1. **YouTube REQUIRES the generic `title` field** — Setting only `youtube_title` is NOT enough. The API rejects the ENTIRE upload (all platforms, not just YouTube) with: `{"success":false,"message":"Title is required for Youtube. Provide a title."}`. You MUST always include `-F "title=..."` when YouTube is in the platform list.

2. **Facebook `facebook_title` max 255 characters** — The API rejects the ENTIRE upload if `facebook_title` exceeds 255 chars: `{"success":false,"message":"Facebook title is too long (XXX characters). Maximum allowed is 255."}`. Always count characters before sending. Keep Facebook text concise.

3. **API validation is all-or-nothing** — If ANY platform field fails validation, NO platforms get published. A single error blocks the entire upload.

4. **Always check API response for `"success":true`** — The curl command returns 200 even on validation failures. Scripts MUST parse the JSON response and check `success` field.

5. **`async_upload=true` always** — The API processes uploads in background. Response only confirms the upload was accepted, not that it was published.

## Required Fields (All Endpoints)

| Field | Type | Description |
|-------|------|-------------|
| `user` | string | Account username (e.g., `ezopeach`) |
| `title` | string | **REQUIRED** — Main post text / fallback for all platforms. YouTube will fail without this. |
| `platform[]` | array | Platforms to publish to |
| `async_upload` | boolean | Always `true` |

### Image-Specific (`/upload_photos`)

| Field | Type | Description |
|-------|------|-------------|
| `photos[]` | file(s) | Image file(s) — use `@filename.png` in curl |
| `media_type` | string | Instagram: `FEED`, `CAROUSEL`, `STORIES` |

### Video-Specific (`/upload`)

| Field | Type | Description |
|-------|------|-------------|
| `video` | file | Video file — use `@filename.mp4` in curl |
| `media_type` | string | Instagram: `FEED`, `REELS`, `STORIES` |

## Platform-Specific Text Fields

Each platform can have its own optimized text. Platform-specific fields override the generic `title`.

| Field | Platform | Notes | Max Length |
|-------|----------|-------|-----------|
| `instagram_title` | Instagram | Full caption with hashtags | ~2200 chars |
| `tiktok_title` | TikTok | Short hook | ~150 chars |
| `facebook_title` | Facebook | Full post text | **255 chars MAX** |
| `youtube_title` | YouTube | Video title (also set generic `title`!) | ~100 chars |
| `youtube_description` | YouTube | Video description | ~5000 chars |
| `threads_title` | Threads | Short hook line | ~500 chars |

### First Comment Fields (Optional)

| Field | Platform |
|-------|----------|
| `instagram_first_comment` | Instagram |
| `facebook_first_comment` | Facebook |
| `threads_first_comment` | Threads |
| `youtube_first_comment` | YouTube |

## Platform-Specific Settings

### TikTok

```
privacy_level=PUBLIC_TO_EVERYONE
post_mode=DIRECT_POST
disable_comment=false
brand_content_toggle=false
brand_organic_toggle=false
auto_add_music=false
photo_cover_index=0
```

### Facebook

```
facebook_media_type=FEED          # or STORIES, REELS
facebook_page_id=<auto or ID>     # auto-detected if user has one page
```

To get Facebook page IDs: `GET /uploadposts/facebook/pages` with auth header.

### YouTube

```
youtube_description=Full video description with keywords
tags[]=tag1&tags[]=tag2           # video tags array
privacyStatus=PUBLIC              # PUBLIC, UNLISTED, or PRIVATE
categoryId=22                     # default Education
selfDeclaredMadeForKids=false
containsSyntheticMedia=false      # set true if AI-generated
```

### Threads

```
threads_long_text_as_post=false
```

## Example: Publish Video to All Platforms

```bash
#!/bin/bash
set -e

# Load credentials from .env
API_KEY="${UPLOAD_POST_API_KEY}"
USER="${UPLOAD_POST_PROFILE}"

RESPONSE=$(curl -s \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'platform[]=threads' \
  -F 'platform[]=tiktok' \
  -F 'platform[]=facebook' \
  -F 'platform[]=youtube' \
  -F 'async_upload=true' \
  -F 'video=@video-final.mp4' \
  -F 'media_type=REELS' \
  -F "title=YouTube Video Title" \
  -F 'instagram_title=Instagram caption with #hashtags' \
  -F 'tiktok_title=Short TikTok hook' \
  -F 'facebook_title=Facebook post text (max 255 chars!)' \
  -F 'facebook_media_type=REELS' \
  -F 'youtube_title=YouTube Video Title' \
  -F 'youtube_description=Full YouTube description' \
  -F 'tags[]=business' \
  -F 'tags[]=entrepreneurship' \
  -F 'privacyStatus=PUBLIC' \
  -F 'categoryId=22' \
  -F 'selfDeclaredMadeForKids=false' \
  -F 'threads_title=Threads hook text' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -F 'post_mode=DIRECT_POST' \
  -F 'disable_comment=false' \
  -F 'brand_content_toggle=false' \
  -F 'brand_organic_toggle=false' \
  -F 'auto_add_music=false' \
  -X POST "https://api.upload-post.com/api/upload")

echo "$RESPONSE"

# Check for success
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "Upload successful!"
else
  echo "ERROR: Upload failed!"
  exit 1
fi
```

## Example: Publish Image to All Platforms

```bash
RESPONSE=$(curl -s \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'platform[]=threads' \
  -F 'platform[]=tiktok' \
  -F 'platform[]=facebook' \
  -F 'async_upload=true' \
  -F 'photos[]=@post-image.png' \
  -F 'media_type=FEED' \
  -F "title=Post title text" \
  -F 'instagram_title=Instagram caption with #hashtags' \
  -F 'tiktok_title=Short TikTok hook' \
  -F 'facebook_title=Facebook post text (max 255 chars!)' \
  -F 'facebook_media_type=FEED' \
  -F 'threads_title=Threads hook text' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -F 'post_mode=DIRECT_POST' \
  -F 'disable_comment=false' \
  -F 'brand_content_toggle=false' \
  -F 'brand_organic_toggle=false' \
  -F 'auto_add_music=false' \
  -F 'photo_cover_index=0' \
  -X POST "https://api.upload-post.com/api/upload_photos")

echo "$RESPONSE"
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "Upload successful!"
else
  echo "ERROR: Upload failed!"
  exit 1
fi
```

## Carousel Post

For multi-image carousel posts, use `media_type=CAROUSEL` and add multiple `photos[]`:

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'media_type=CAROUSEL' \
  -F 'async_upload=true' \
  -F "title=Carousel post" \
  -F 'photos[]=@slide1.png' \
  -F 'photos[]=@slide2.png' \
  -F 'photos[]=@slide3.png' \
  -F 'instagram_title=Instagram caption...' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -X POST "https://api.upload-post.com/api/upload_photos"
```

## Generating Publish Scripts

When generating a shell script for batch publishing:

1. Set API_KEY and USER variables at the top (load from `.env` if available)
2. Add a `sleep 3` between API calls to avoid rate limiting
3. Handle shell escaping — use `'"'"'` for apostrophes in `-F` values
4. Always generate platform-specific text for each platform
5. Generate the script as a `.sh` file the user can run locally
6. Choose the correct endpoint based on content type (video vs image)
7. **ALWAYS include `title` field** when YouTube is a target platform
8. **ALWAYS keep `facebook_title` under 255 characters**
9. **ALWAYS capture the API response and check `"success":true`** before reporting success
10. **ALWAYS validate text lengths before making the API call**

## Text Optimization Per Platform

When creating post text, optimize for each platform:

- **Instagram**: Full text with line breaks, emojis in text (not images), 6-8 hashtags at the end
- **TikTok title**: Punchy one-liner hook (max ~150 chars)
- **Facebook**: Concise text (MAX 255 CHARS including hashtags), professional/educational tone, 2-3 hashtags
- **YouTube title**: Concise, keyword-rich title (max 100 chars)
- **YouTube description**: Full description with keywords, timestamps if relevant, links
- **Threads title**: Hook/opening line only, conversational

## Publish Metadata — MANDATORY

After every successful publish (or when generating a publish script), **ALWAYS save publish metadata** into the post folder. This is critical for future reposts, analytics, and content tracking.

### Save `publish-meta.json` in the Post Folder

```json
{
  "published_at": "2026-03-01T14:30:00Z",
  "platforms": ["instagram", "threads", "tiktok", "facebook", "youtube"],
  "post_type": "video",
  "media_files": ["slug-final.mp4"],
  "captions": {
    "instagram": "Full Instagram caption...",
    "tiktok_title": "Short TikTok hook...",
    "facebook": "Full Facebook text...",
    "youtube_title": "YouTube Video Title...",
    "youtube_description": "Full YouTube description...",
    "threads_title": "Short Threads hook..."
  },
  "api_response": {},
  "source_cache_key": null,
  "slug": "post-slug",
  "tags": [],
  "repost_eligible": true,
  "repost_after_days": 30,
  "repost_history": []
}
```

### When to Save

- **After successful API call**: Save immediately with `api_response` populated
- **When generating .sh script**: Save with `api_response: {}` and `published_at` set to the current timestamp
- **On repost**: Append to `repost_history` array, update `published_at` to latest

## Workflow

1. Identify content type: image, carousel, or video
2. Choose the correct endpoint (`/upload` for video, `/upload_photos` for images)
3. Write post text optimized for each platform — **check character limits** (Facebook 255, TikTok 150)
4. **ALWAYS include the generic `title` field** (YouTube requires it)
5. Generate a curl command or shell script with all required fields
6. Execute the curl command (or provide script for user to run locally)
7. **Parse the API response — check for `"success":true`** before confirming success
8. **Save `publish-meta.json`** to the post folder

## Important Notes

- The API may not be reachable from all environments (e.g., VM proxy restrictions). In that case, generate a `.sh` script for the user to run from their local machine.
- Always use `async_upload=true` for reliability.
- The API key and user credentials should be stored in `.env` file, not hardcoded in shared files.
- **YouTube REQUIRES the generic `title` field** — `youtube_title` alone is NOT enough. The API rejects the ENTIRE upload without `title`.
- **Facebook `facebook_title` MUST be under 255 characters** — The API rejects the ENTIRE upload if exceeded.
- **API validation is all-or-nothing** — one invalid field blocks ALL platforms from publishing.
- Facebook page ID is auto-detected if the user has only one page. Otherwise use `GET /uploadposts/facebook/pages` to find the correct ID.
- **ALWAYS save publish-meta.json** — even when generating a script instead of calling the API directly.
- **ALWAYS check the `success` field in the API response** — HTTP 200 does NOT mean success.
