---
description: Update existing e-learning course — fix translations, content, CTAs
allowed-tools: Read, Write, Bash, Grep, WebSearch, WebFetch
argument-hint: <channel_id> [--fix-entities] [--update-cta] [--update-translations]
---

Update existing e-learning course: $ARGUMENTS

Read ALL skills and references in this order:

1. SEO guidelines:
@${CLAUDE_PLUGIN_ROOT}/references/seo-guidelines.md

2. E-Learning creator skill (especially sections 8, 9, 20, 21):
@${CLAUDE_PLUGIN_ROOT}/skills/elearning-creator/SKILL.md

3. API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: channel_id (required), what to update (translations, content, CTAs, entities)
2. Query Odoo to get existing slide IDs and their current data (search_read with channel_id)
3. If --fix-entities: check all CS text fields (name, mt, md) for HTML entities (&#xxx;)
4. Load local course_data.json if available, or build update data from user instructions
5. Map each slide key to its Odoo ID (by sequence order or explicit mapping)
6. Write update Python script using `write` (NOT `create`):
   - EN text fields: call_en('slide.slide', 'write', ...)
   - CS text fields: call_cs('slide.slide', 'write', ...)
   - HTML content: call_en write + update_field_translations for CS
   - Quiz translations: call_cs on slide.question and slide.answer
7. Execute update script
8. Verify: re-read updated fields from Odoo and check for remaining issues
9. Return summary with count of updated records

IMPORTANT:
- This command UPDATES existing records — it does NOT create new ones
- Always query Odoo first to get current state before writing
- For HTML entities fix: use html.unescape() on all non-html fields
- For html_content translations: MUST use update_field_translations (see SKILL.md section 8)
- Domain wrapping: search uses triple list [[[field, =, val]]]
- NEVER auto-publish — keep is_published unchanged
