---
description: Create an animated video post from HTML/CSS
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: <topic> [duration]
---

Create a new animated video post about: $ARGUMENTS

Follow the create-animated-video skill instructions:
1. Read the skill and its references for the animation system and render pipeline
2. Design an HTML page with CSS scene-based animations
3. Use viewport-relative units for responsive sizing across video formats
4. NEVER use emoji characters — always use inline SVG icons
5. Include prominent "Start a Business" branding with bold, bright "@michalvarys.eu" handle (16px+, bold, high contrast — must be unmissable)
6. Render the video using Puppeteer frame capture piped to ffmpeg
7. Default format: 9x16 (1080x1920) for Reels/TikTok. Ask user if they want additional formats.
8. Save HTML and MP4 to the outputs folder
