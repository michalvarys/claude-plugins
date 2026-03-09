---
description: Publish a post to Instagram, Threads, TikTok, Facebook & YouTube
allowed-tools: Read, Write, Bash, Glob
argument-hint: <media-file> [platforms]
---

Publish a social media post using: $ARGUMENTS

Follow the publish-post skill instructions:
1. Read the skill for API details and required fields
2. Identify the media file to publish (image or video)
3. Choose the correct API endpoint:
   - Video (MP4): `POST /api/upload`
   - Image/Carousel (PNG): `POST /api/upload_photos`
4. **For videos — platform covers (CRITICAL)**:
   - **Instagram**: `-F 'thumb_offset=3000'` — Reel cover frame at 3s. Without this → blank/black grid.
   - **TikTok**: `-F 'cover_timestamp=3000'` — Cover frame at 3s. Default 1000ms may show blank.
   - **YouTube**: `-F 'thumbnail=@thumbnail.png'` — Look for `thumbnail.png` in video folder.
   - **Facebook**: `thumbnail_url` needs a hosted URL (only with `facebook_media_type=VIDEO`, not REELS).
   - **Threads**: No cover parameter — auto-selected by platform.
   - Always set `thumb_offset` and `cover_timestamp` to the same value for consistency.
6. Ensure post text exists for all target platforms
7. Generate a curl command with all required fields:
   - user, title, platform[], media file, thumb_offset, thumbnail (if available)
   - Platform-specific text fields (instagram_title, tiktok_title, facebook_title, youtube_title, youtube_description, threads_title)
   - Platform-specific settings (media_type, privacy_level, post_mode, facebook_media_type, privacyStatus, categoryId, etc.)
8. Either execute the curl command or save it as a .sh script if the API is not reachable from this environment
9. Default platforms: instagram, threads, tiktok, facebook, youtube (unless user specifies otherwise)
10. **Save `publish-meta.json`** to the post folder — read the publish-post skill for the full format. This is mandatory for future reposts and content tracking.
