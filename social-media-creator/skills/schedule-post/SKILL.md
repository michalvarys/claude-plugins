---
name: schedule-post
description: >
  Schedule social media posts for specific dates and times via upload-post.com API,
  and create automated publishing pipelines that generate content from sources on a recurring schedule.
  Use when the user asks to "schedule a post", "publish at a specific time",
  "set up daily posting", "automate content publishing", "post every day at 13:00",
  "schedule for tomorrow", "publish next Monday", or wants to create a recurring content pipeline.
version: 0.2.0
---

# Schedule Post

Schedule social media posts for specific dates/times using the upload-post.com API's native scheduling, and create automated pipelines that generate + publish content on a recurring basis.

## Two Modes

### 1. Schedule a Ready Post (API-Native Scheduling)

Schedule an already-created post for publishing at a specific date and time. The upload-post.com API handles the actual scheduled delivery — no local cron tasks needed.

Add `scheduled_date` and `timezone` fields to the same publish curl command. The API returns HTTP 202 with a `job_id` that can be used to check status, edit, or cancel.

#### How It Works

Instead of creating a local scheduled task, just add two fields to the normal publish API call:

| Field | Format | Description |
|-------|--------|-------------|
| `scheduled_date` | ISO-8601 (e.g., `2026-03-15T14:30:00`) | When to publish (max 365 days in future) |
| `timezone` | IANA (e.g., `Europe/Prague`) | Timezone for the scheduled_date |

The `scheduled_date` and `add_to_queue` fields are mutually exclusive — use one or the other, never both.

#### Example: Schedule a Video for March 15 at 14:30 CET

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'platform[]=threads' \
  -F 'platform[]=tiktok' \
  -F 'platform[]=facebook' \
  -F 'platform[]=youtube' \
  -F 'async_upload=true' \
  -F 'video=@video-final.mp4' \
  -F 'scheduled_date=2026-03-15T14:30:00' \
  -F 'timezone=Europe/Prague' \
  -F 'media_type=REELS' \
  -F 'instagram_title=Instagram caption with #hashtags' \
  -F 'tiktok_title=Short TikTok hook' \
  -F 'facebook_title=Facebook post text' \
  -F 'facebook_media_type=REELS' \
  -F 'youtube_title=YouTube Video Title' \
  -F 'youtube_description=Full YouTube description' \
  -F 'tags[]=business' \
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
  -X POST "https://api.upload-post.com/api/upload"
```

#### Example: Schedule an Image Post

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'platform[]=threads' \
  -F 'platform[]=tiktok' \
  -F 'platform[]=facebook' \
  -F 'async_upload=true' \
  -F 'photos[]=@post-image.png' \
  -F 'scheduled_date=2026-03-15T14:30:00' \
  -F 'timezone=Europe/Prague' \
  -F 'media_type=FEED' \
  -F 'instagram_title=Instagram caption...' \
  -F 'tiktok_title=TikTok hook...' \
  -F 'facebook_title=Facebook text...' \
  -F 'threads_title=Threads hook...' \
  -F 'privacy_level=PUBLIC_TO_EVERYONE' \
  -F 'post_mode=DIRECT_POST' \
  -F 'disable_comment=false' \
  -X POST "https://api.upload-post.com/api/upload_photos"
```

#### API Response for Scheduled Posts

The API returns HTTP 202 with:
```json
{
  "success": true,
  "job_id": "abc123",
  "scheduled_date": "2026-03-15T14:30:00Z"
}
```

Save the `job_id` — you'll need it to check status, edit, or cancel.

### 2. Automated Content Pipeline

For recurring content generation + publishing, use local `create_scheduled_task` MCP tool to trigger the content creation workflow, which then uses the API (with or without `scheduled_date`) to publish.

This is the only case where `create_scheduled_task` is appropriate — when you need Claude to **generate** content (not just schedule an existing post).

#### Pipeline Task Example

```
Task ID: daily-video-pipeline
Cron: 0 10 * * *    (every day at 10:00 — generates content for same-day publish)
Prompt: |
  1. Read the next topic from /path/to/content-calendar.md
  2. Use the create-video-post workflow to generate a complete video
  3. Generate post text for all platforms
  4. Publish immediately to all platforms using the publish-post skill
  5. Mark the topic as completed in the content calendar
```

## Managing Scheduled Posts via API

### List Scheduled Posts

```bash
curl -H "Authorization: Apikey $API_KEY" \
  "https://api.upload-post.com/api/uploadposts/schedule"
```

### Check Status of a Scheduled/Async Post

```bash
curl -H "Authorization: Apikey $API_KEY" \
  "https://api.upload-post.com/api/uploadposts/status?job_id=abc123"
```

### Edit a Scheduled Post

Update the scheduled date, title, or caption of a pending scheduled post:

```bash
curl -H "Authorization: Apikey $API_KEY" \
  -X PATCH \
  -H "Content-Type: application/json" \
  -d '{"scheduled_date": "2026-03-16T15:00:00", "title": "Updated text"}' \
  "https://api.upload-post.com/api/uploadposts/schedule/abc123"
```

### Cancel a Scheduled Post

```bash
curl -H "Authorization: Apikey $API_KEY" \
  -X DELETE \
  "https://api.upload-post.com/api/uploadposts/schedule/abc123"
```

## Queue System (Alternative to Manual Scheduling)

The API also has a queue system that auto-assigns the next available time slot. Use `add_to_queue=true` instead of `scheduled_date`:

```bash
curl \
  -H "Authorization: Apikey $API_KEY" \
  -F "user=$USER" \
  -F 'platform[]=instagram' \
  -F 'video=@video.mp4' \
  -F 'add_to_queue=true' \
  -F 'media_type=REELS' \
  -F 'title=Post text...' \
  -X POST "https://api.upload-post.com/api/upload"
```

### Queue Management

```bash
# Get queue settings
curl -H "Authorization: Apikey $API_KEY" \
  "https://api.upload-post.com/api/uploadposts/queue/settings?profile=$USER"

# Preview upcoming slots
curl -H "Authorization: Apikey $API_KEY" \
  "https://api.upload-post.com/api/uploadposts/queue/preview?profile=$USER"

# Get next available slot
curl -H "Authorization: Apikey $API_KEY" \
  "https://api.upload-post.com/api/uploadposts/queue/next-slot?profile=$USER"

# Configure queue slots
curl -H "Authorization: Apikey $API_KEY" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "profile_username": "varyshop",
    "timezone": "Europe/Prague",
    "slots": [{"time": "13:00"}],
    "days_of_week": [0, 1, 2, 3, 4, 5, 6]
  }' \
  "https://api.upload-post.com/api/uploadposts/queue/settings"
```

## Content Queue Structure (for Pipelines)

For recurring content generation pipelines, maintain a local queue folder:

```
content-queue/
  ├── ready/           # Posts ready to publish
  │   ├── post15/
  │   │   ├── video-9x16.mp4
  │   │   ├── post_text.md
  │   │   └── metadata.json
  │   └── post16/
  ├── published/       # Already published (moved here after success)
  └── sources/
      └── content-calendar.md
```

## Content Calendar Format

```markdown
# Content Calendar — March 2026

| Date | Topic | Status |
|------|-------|--------|
| Mar 3 | Why discounts kill your brand | published |
| Mar 4 | 5 signs your offer is too cheap | published |
| Mar 5 | How to build a value stack | ready |
| Mar 6 | The psychology of free bonuses | pending |
```

## Decision Guide: Which Approach to Use

| Situation | Approach |
|---|---|
| Ready post, schedule for specific date/time | Use `scheduled_date` in the API call |
| Ready post, auto-assign next slot | Use `add_to_queue=true` in the API call |
| Need to generate content first, then publish | Use `create_scheduled_task` MCP tool to trigger pipeline |
| Batch schedule multiple ready posts | Generate shell script with multiple API calls, each with its own `scheduled_date` |

## Workflow

### Quick Schedule (ready post)
1. User has a completed post (image/video + text)
2. Add `scheduled_date` and `timezone` to the normal publish API call
3. Save the returned `job_id` for tracking
4. Save `publish-meta.json` with `scheduled_for` field

### Batch Scheduling
1. Generate multiple posts in advance
2. Create a shell script with one API call per post, each with different `scheduled_date`
3. Run the script — each post gets queued server-side

### Full Pipeline (source → video → publish)
1. Set up content calendar with topics
2. Create a recurring scheduled task via `create_scheduled_task` MCP tool
3. Each run: pick topic → generate video → publish via API (immediately or with `scheduled_date`)
4. Mark topic as completed
