---
description: Create a new branded social media post graphic
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <topic>
---

Create a new branded social media post graphic about the topic: $ARGUMENTS

Follow the create-static-post skill instructions:
1. Read the skill and its references for the design system
2. Design a 1080x1080px HTML post with the brand's dark theme, gradient glows, Inter font, and SVG icons
3. NEVER use emoji characters — always use inline SVG icons in styled containers
4. Include prominent "Start a Business" bottom bar (19px bold) with lightning bolt logo (36px) + bold bright "@michalvarys.eu" handle (16px, bold, rgba(255,255,255,0.65)) — handle must be clearly visible and unmissable
5. Render the HTML to PNG using Playwright headless Chromium
6. Generate post text for all platforms (Instagram, TikTok, Threads) with hashtags
7. Save both HTML and PNG to the outputs folder
8. Show the user a preview of the rendered image
