---
description: Schedule a post or set up automated content pipeline
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
argument-hint: <action> [details]
---

Schedule or automate social media posting: $ARGUMENTS

Read the schedule-post skill for full documentation on scheduling options.

## Actions

### Schedule a ready post
If the user has a completed post and wants to publish at a specific time:
1. Identify the post files (image/video + text)
2. Determine the target date, time, and timezone
3. Add `scheduled_date` (ISO-8601) and `timezone` (IANA, e.g., `Europe/Prague`) to the normal publish API call
4. Choose the correct endpoint: `/api/upload` for video, `/api/upload_photos` for images
5. The API returns a `job_id` — save it for tracking
6. Default platforms: instagram, threads, tiktok, facebook, youtube

### Add to queue (auto-assign next slot)
If the user wants to add a post to the publishing queue:
1. Use `add_to_queue=true` instead of `scheduled_date` in the API call
2. The API auto-assigns the next available time slot based on queue settings

### Set up a recurring pipeline
If the user wants automated content generation + publishing:
1. Help set up a content calendar (topics list)
2. Create the recurring scheduled task using `create_scheduled_task` MCP tool
3. The task should use the create-video-post workflow to generate content
4. Configure publishing to target platforms via the API
5. Explain how to manage the schedule (pause, resume, update)

### Manage scheduled posts
If the user wants to view, modify, or cancel scheduled posts:
- **List**: `GET /uploadposts/schedule`
- **Check status**: `GET /uploadposts/status?job_id=<id>`
- **Edit**: `PATCH /uploadposts/schedule/<job_id>` — update date, title, caption
- **Cancel**: `DELETE /uploadposts/schedule/<job_id>`

## Important
- Use `scheduled_date` + `timezone` in the API call for scheduling ready posts — do NOT use `create_scheduled_task` for this
- `create_scheduled_task` is only for recurring content generation pipelines where Claude needs to generate new content
- `scheduled_date` and `add_to_queue` are mutually exclusive
- Default timezone: `Europe/Prague`
