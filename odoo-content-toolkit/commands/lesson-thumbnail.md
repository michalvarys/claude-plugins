---
description: Generate AI cover image for a course channel using Gemini Flash
allowed-tools: Read, Write, Bash, Edit
argument-hint: <channel_id> [--all] [--model gemini-2.5-flash-image]
---

Generate course cover image: $ARGUMENTS

Read ALL skills and references in this order:

1. Thumbnail skill:
@${CLAUDE_PLUGIN_ROOT}/skills/lesson-thumbnail/SKILL.md

2. API reference (for slide.channel fields):
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: channel_id (required), --all for all channels, optional model override
2. Read channel info (name, description) to understand the course topic
3. Craft a unique visual prompt with distinct colors and metaphors
4. Generate cover image with Gemini Flash (gemini-2.5-flash-image)
5. Upload image_1920 to slide.channel via XML-RPC
6. IMPORTANT: thumbnail goes on slide.channel, NOT slide.slide!
