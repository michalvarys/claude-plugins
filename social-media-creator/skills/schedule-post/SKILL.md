---
name: schedule-post
description: >
  Schedule social media posts for specific dates and times, and create automated
  publishing pipelines that generate content from sources on a recurring schedule.
  Use when the user asks to "schedule a post", "publish at a specific time",
  "set up daily posting", "automate content publishing", "post every day at 13:00",
  or wants to create a recurring content pipeline.
version: 0.1.0
---

# Schedule Post

Schedule social media posts for specific dates/times, and create automated pipelines that generate + publish content on a recurring basis.

## Two Modes

### 1. Schedule a Ready Post

Schedule an already-created post (image/video + text) for publishing at a specific date and time.

Uses the `create_scheduled_task` MCP tool to create a one-time or recurring task.

#### One-Time Scheduled Post

```
Task ID: publish-post14-march5
Cron: 0 13 5 3 *    (March 5 at 13:00 local time)
Prompt: Publish the post at /path/to/post14.png with the text from /path/to/post14_text.md
        to Instagram, Threads, and TikTok using the publish-post skill.
```

#### Recurring Schedule (e.g., every day at 13:00)

```
Task ID: daily-post-13h
Cron: 0 13 * * *    (every day at 13:00 local time)
Prompt: Check for the next scheduled post in /path/to/queue/ folder,
        publish it using the publish-post skill, then move to /path/to/published/.
```

### 2. Automated Content Pipeline

Create a full pipeline that:
1. Takes a content source (topic list, RSS feed, content calendar)
2. Generates a video post (HTML animation + voiceover + bg music)
3. Publishes at the scheduled time

#### Pipeline Task Example

```
Task ID: daily-video-pipeline
Cron: 0 10 * * *    (every day at 10:00 — gives 3h buffer before 13:00 publish)
Prompt: |
  1. Read the next topic from /path/to/content-calendar.md (pick the first unmarked topic)
  2. Use the create-video-post workflow to generate a complete video:
     - Design animated HTML with the topic
     - Generate English voiceover explaining the concept
     - Generate background music matching the mood
     - Render to MP4 (9x16 format)
     - Mix voiceover + bg music + video
  3. Generate post text for all platforms
  4. Publish to Instagram, Threads, and TikTok using the publish-post skill
  5. Mark the topic as completed in the content calendar
```

## Cron Expression Reference

All times are in **local timezone** (NOT UTC).

| Schedule | Cron Expression |
|---|---|
| Every day at 13:00 | `0 13 * * *` |
| Weekdays at 9:00 | `0 9 * * 1-5` |
| Every Monday at 10:00 | `0 10 * * 1` |
| Mon, Wed, Fri at 13:00 | `0 13 * * 1,3,5` |
| Twice daily (9:00 + 18:00) | `0 9,18 * * *` |
| First day of month at 10:00 | `0 10 1 * *` |
| Every 2 hours | `0 */2 * * *` |
| Specific date: Mar 15 at 14:30 | `30 14 15 3 *` |

Format: `minute hour dayOfMonth month dayOfWeek`

## Content Queue Structure

For recurring posting, maintain a queue folder:

```
content-queue/
  ├── ready/           # Posts ready to publish
  │   ├── post15/
  │   │   ├── video-9x16.mp4
  │   │   ├── post_text.md
  │   │   └── metadata.json    # { "platforms": ["instagram","threads","tiktok"], "scheduledFor": "2026-03-05T13:00" }
  │   └── post16/
  │       └── ...
  ├── published/       # Already published (moved here after success)
  └── sources/         # Content sources
      └── content-calendar.md
```

### metadata.json Format

```json
{
  "title": "Post 15 — Value Pricing",
  "platforms": ["instagram", "threads", "tiktok"],
  "scheduledFor": "2026-03-05T13:00:00",
  "contentType": "video",
  "topic": "Why value-based pricing beats hourly rates",
  "status": "ready"
}
```

## Content Calendar Format

For the automated pipeline, maintain a markdown content calendar:

```markdown
# Content Calendar — March 2026

| Date | Topic | Status |
|------|-------|--------|
| Mar 3 | Why discounts kill your brand | published |
| Mar 4 | 5 signs your offer is too cheap | published |
| Mar 5 | How to build a value stack | ready |
| Mar 6 | The psychology of free bonuses | pending |
| Mar 7 | Guarantee frameworks that convert | pending |
```

The pipeline reads the next "ready" or "pending" topic, generates content, publishes, and updates status.

## Setting Up a Scheduled Task

Use the `create_scheduled_task` MCP tool:

```
Tool: create_scheduled_task
Parameters:
  taskId: "daily-video-post"
  description: "Generate and publish a video post every day at 13:00"
  cronExpression: "0 13 * * *"
  prompt: "Read the content calendar at /path/to/calendar.md, pick the next pending topic, generate a complete video post using the create-video-post workflow, and publish to all platforms."
```

## Managing Scheduled Tasks

- **List tasks**: `list_scheduled_tasks` — see all active schedules
- **Update schedule**: `update_scheduled_task` with new cronExpression
- **Pause**: `update_scheduled_task` with `enabled: false`
- **Resume**: `update_scheduled_task` with `enabled: true`

## Workflow

### Quick Schedule (ready post)
1. User has a completed post (image/video + text)
2. Create a scheduled task with one-time cron for the target date/time
3. Task publishes at the scheduled time

### Full Pipeline (source → video → publish)
1. Set up content calendar with topics
2. Create a recurring scheduled task (e.g., daily at 10:00)
3. Each run: pick topic → generate video → add voiceover + music → publish at target time
4. Mark topic as completed

### Batch Scheduling
1. Generate multiple posts in advance
2. Place them in the content queue with metadata
3. Create a recurring task that picks the next ready post and publishes it
