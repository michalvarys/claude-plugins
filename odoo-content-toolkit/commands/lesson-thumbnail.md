---
description: Generate AI thumbnail images for course lessons using Gemini Flash
allowed-tools: Read, Write, Bash, Edit
argument-hint: <channel_id> [--slides 100,101,102] [--model gemini-2.0-flash-exp-image-generation]
---

Generate lesson thumbnails: $ARGUMENTS

Read ALL skills and references in this order:

1. Lesson thumbnail skill:
@${CLAUDE_PLUGIN_ROOT}/skills/lesson-thumbnail/SKILL.md

2. API reference (for slide.slide fields):
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: channel_id (required), optional slide IDs, optional model override
2. Read slides from Odoo to get names and html_content
3. For each non-quiz slide, analyze content and build an image prompt
4. Generate thumbnail with Gemini Flash image generation
5. Upload image_1920 to slide.slide via XML-RPC
6. Report results with slide IDs and status
