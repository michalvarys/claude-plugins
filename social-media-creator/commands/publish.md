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
4. **For videos**: Look for a `thumbnail.png` in the same folder as the video. If found, include it as `-F 'thumbnail=@thumbnail.png'` in the curl command. This prevents blank/black grid previews on all platforms.
5. Ensure post text exists for all target platforms
6. Generate a curl command with all required fields:
   - user, title, platform[], media file, thumbnail (if available)
   - Platform-specific text fields (instagram_title, tiktok_title, facebook_title, youtube_title, youtube_description, threads_title)
   - Platform-specific settings (media_type, privacy_level, post_mode, facebook_media_type, privacyStatus, categoryId, etc.)
7. Either execute the curl command or save it as a .sh script if the API is not reachable from this environment
8. Default platforms: instagram, threads, tiktok, facebook, youtube (unless user specifies otherwise)
9. **Save `publish-meta.json`** to the post folder — read the publish-post skill for the full format. This is mandatory for future reposts and content tracking.
