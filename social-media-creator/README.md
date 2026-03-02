# Social Media Creator Plugin

Create branded social media content — static posts, animated videos, carousels, voiceovers, background music — with scheduling and automated publishing pipelines.

Designed for the **Start a Business** brand (@michalvarys.eu).

## Skills

| Skill | Description |
|-------|-------------|
| **create-static-post** | Design 1080x1080 branded post graphics (HTML → PNG) |
| **create-animated-video** | Create animated videos from HTML/CSS animations (→ MP4) |
| **create-carousel** | Design multi-slide carousel posts |
| **generate-voiceover** | Generate voiceover audio via ElevenLabs TTS (Czech/English) |
| **generate-background-music** | Generate ambient background music via ElevenLabs Sound Effects API |
| **publish-post** | Publish posts across platforms via upload-post.com API |
| **schedule-post** | Schedule posts and create automated content pipelines |

## Commands

| Command | Description |
|---------|-------------|
| `/new-post <topic>` | Create a new branded post graphic |
| `/new-video <topic>` | Create an animated video post |
| `/new-carousel <topic>` | Create a multi-slide carousel |
| `/create-video-post <topic>` | **Full pipeline**: animated video + voiceover + background music |
| `/publish <image>` | Publish to Instagram, Threads & TikTok |
| `/schedule <action>` | Schedule a post or set up automated publishing |

## Requirements

- **Node.js 18+**
- **Playwright** (`npm install playwright && npx playwright install chromium`)
- **ffmpeg** (for video rendering and audio mixing)
- **ElevenLabs API key** in `.env` file (for voiceover and background music generation)
- **upload-post.com API key** (for publishing)

## Design System

- Dark gradient backgrounds with colored glow orbs
- Inter font family (Google Fonts)
- Inline SVG icons only — never emojis (headless Chromium doesn't render them)
- Glass-morphism cards with subtle borders
- Gradient badges and text highlights
- **Prominent branding bar**: "Start a Business" (19px bold) + lightning bolt logo (36px) + **"@michalvarys.eu"** (16px bold, bright white 65% opacity — must be clearly visible)

## Full Video Pipeline (`/create-video-post`)

1. Design animated HTML with CSS scene-based animations
2. Render to MP4 via Playwright frame capture → ffmpeg
3. Generate voiceover via ElevenLabs TTS
4. Generate background music via ElevenLabs Sound Effects
5. Mix audio: voiceover (100%) + bg music (~12% volume)
6. Merge mixed audio with video → final MP4
7. Generate post text for all platforms

## Scheduling & Automation

- **One-time scheduling**: Publish a ready post at a specific date/time
- **Recurring pipeline**: Auto-generate + publish content daily/weekly from a content calendar
- Uses `create_scheduled_task` MCP tool with cron expressions (local timezone)
- Content queue system with metadata.json for batch scheduling

## Setup

1. Install the plugin in Claude
2. Ensure Node.js, Playwright, and ffmpeg are available
3. For voiceover & music: set `ELEVENLABS_API_KEY` in a `.env` file
4. For publishing: configure API key and username in publish scripts
