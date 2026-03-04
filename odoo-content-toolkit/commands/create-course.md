---
description: Create e-learning course with lessons and quizzes in Odoo 18
allowed-tools: Read, Write, Bash, Grep, WebSearch, WebFetch
argument-hint: <topic> [--type training|documentation] [--scope short|medium|large]
---

Create e-learning course: $ARGUMENTS

Read ALL skills and references in this order:

1. SEO guidelines:
@${CLAUDE_PLUGIN_ROOT}/references/seo-guidelines.md

2. E-Learning creator skill:
@${CLAUDE_PLUGIN_ROOT}/skills/elearning-creator/SKILL.md

3. API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: topic, type (default: training), scope (default: medium 8-12 lessons)
2. Research topic if needed (use deep-research skill)
3. Create course outline (sections → lessons → quizzes) and present to user
4. After user approval, write HTML content for each lesson
5. Create quiz questions for each section
6. Create Python script to publish to Odoo via XML-RPC
7. Execute script via osascript (VM Bash has ENOSPC)
8. Return course summary with Odoo admin link
9. NEVER auto-publish — admin reviews and publishes manually
