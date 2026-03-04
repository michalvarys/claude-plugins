---
description: Write SEO-optimized blog article and publish to Odoo 18
allowed-tools: Read, Write, Bash, Grep, WebSearch, WebFetch
argument-hint: <topic> [--format how-to|listicle|info|comparison] [--length short|medium|long]
---

Write blog article: $ARGUMENTS

Read ALL skills and references in this order:

1. SEO guidelines:
@${CLAUDE_PLUGIN_ROOT}/references/seo-guidelines.md

2. Blog writer skill:
@${CLAUDE_PLUGIN_ROOT}/skills/blog-writer/SKILL.md

3. API reference:
@${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md

Steps:
1. Parse: topic, format (default: info), length (default: medium ~1500 words)
2. Research topic using WebSearch if needed
3. Prepare SEO metadata (title, meta_title, meta_description, meta_keywords, slug, teaser)
4. Write HTML article content following SEO guidelines
5. Create Python script to publish to Odoo via XML-RPC
6. Execute script via osascript (VM Bash has ENOSPC)
7. Return summary with Odoo admin link
8. NEVER auto-publish — admin reviews and publishes manually
