---
description: Publish a post to Instagram, Threads & TikTok
allowed-tools: Read, Write, Bash, Glob
argument-hint: <image-file> [platforms]
---

Publish a social media post using: $ARGUMENTS

Follow the publish-post skill instructions:
1. Read the skill for API details and required fields
2. Identify the image file to publish
3. Ensure post text exists for all target platforms
4. Generate a curl command with all required fields:
   - user, title, platform[], photos[], media_type
   - Platform-specific text fields (instagram_title, tiktok_title, tiktok_description, threads_title, threads_description)
   - Standard settings (privacy_level, post_mode, etc.)
5. Either execute the curl command or save it as a .sh script if the API is not reachable from this environment
6. Default platforms: instagram, threads, tiktok (unless user specifies otherwise)
7. **Save `publish-meta.json`** to the post folder — read the publish-post skill for the full format. This is mandatory for future reposts and content tracking.
