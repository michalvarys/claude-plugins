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
2. Determine the target date and time
3. Use `create_scheduled_task` MCP tool with appropriate cron expression
4. Confirm the schedule with the user

### Set up a recurring pipeline
If the user wants automated content generation + publishing:
1. Help set up a content calendar (topics list)
2. Create the recurring scheduled task using `create_scheduled_task`
3. The task should use the create-video-post workflow to generate content
4. Configure publishing to target platforms
5. Explain how to manage the schedule (pause, resume, update)

### Manage existing schedules
If the user wants to view, modify, or cancel schedules:
1. Use `list_scheduled_tasks` to show current schedules
2. Use `update_scheduled_task` to modify cron, enable/disable, or change prompts

## Important
- All cron times are in LOCAL timezone (not UTC)
- For one-time posts, use a specific date cron (e.g., `30 14 15 3 *` = Mar 15 at 14:30)
- For recurring, use standard patterns (e.g., `0 13 * * *` = daily at 13:00)
