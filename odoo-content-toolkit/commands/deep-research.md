---
description: Deep research on any topic with structured output
allowed-tools: Read, Write, Bash, Grep, WebSearch, WebFetch
argument-hint: <topic> [--depth overview|standard|deep] [--output report|blog-brief|course-outline]
---

Deep research: $ARGUMENTS

Read the deep-research skill:

1. Deep research skill:
@${CLAUDE_PLUGIN_ROOT}/skills/deep-research/SKILL.md

Steps:
1. Parse: topic, depth (default: standard), output format (default: report)
2. Run multi-source web research (3-5 queries)
3. Deep-dive into top 3-5 sources
4. Synthesize findings from multiple sources
5. Structure output based on format:
   - report: standalone Markdown research report
   - blog-brief: SEO analysis + article structure + key facts
   - course-outline: course structure with lesson content
6. Save output file and present to user
7. If output is blog-brief or course-outline, suggest next step (blog-writer or elearning-creator)
