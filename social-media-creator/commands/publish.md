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
4. Ensure post text exists for all target platforms
5. Generate a curl command with all required fields:
   - user, title, platform[], media file
   - Platform-specific text fields (instagram_title, tiktok_title, facebook_title, youtube_title, youtube_description, threads_title)
   - Platform-specific settings (media_type, privacy_level, post_mode, facebook_media_type, privacyStatus, categoryId, etc.)
6. Either execute the curl command or save it as a .sh script if the API is not reachable from this environment
7. Default platforms: instagram, threads, tiktok, facebook, youtube (unless user specifies otherwise)
8. **Save `publish-meta.json`** to the post folder — read the publish-post skill for the full format. This is mandatory for future reposts and content tracking.
