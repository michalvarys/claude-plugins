---
name: generate-voiceover
description: >
  Generate voiceover audio for social media videos using ElevenLabs TTS API.
  Use when the user asks to "generate voiceover", "create narration",
  "add voice to video", "text-to-speech for video", "generate audio narration",
  or wants spoken audio for their video content. Supports Czech and English.
version: 0.1.0
---

# Generate Voiceover

Generate professional voiceover audio using the ElevenLabs Text-to-Speech API. Supports multiple languages including Czech and English via the multilingual v2 model.

## Requirements

- ElevenLabs API key (stored in `.env` file as `ELEVENLABS_API_KEY`)
- Node.js 18+ (for native fetch)

## Configuration

- **Model**: `eleven_multilingual_v2` — handles Czech, English, and many other languages
- **Default Voice ID**: `P5JJg65WdWQglOCyt8cr`
- **Voice Settings**:
  - stability: 0.5
  - similarity_boost: 0.75
  - style: 0.3
  - use_speaker_boost: true
- **Output Format**: MP3

## API Call Pattern

```javascript
import { readFileSync, writeFileSync } from "fs";

const API_KEY = "your-elevenlabs-api-key";
const VOICE_ID = "P5JJg65WdWQglOCyt8cr";

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
  {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: voiceoverText,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  }
);

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
}

const arrayBuffer = await response.arrayBuffer();
writeFileSync(outputPath, Buffer.from(arrayBuffer));
```

## Writing Voiceover Scripts

### Duration Rule — CRITICAL

**The voiceover MUST be shorter than the video.** The last ~2 seconds should show CTA/branding silently.

**Target script length:** Aim for ~2.5 words/second. For a 25s video, target ~57 words (~23s of speech).

- Video = 25s → voiceover script targets ~23s
- Video = 30s → voiceover script targets ~28s
- Video = 45s → voiceover script targets ~43s

### MANDATORY: Verify Duration After Generation

**TTS output duration is unpredictable** — the same word count can produce wildly different durations depending on pacing, pauses, and language. You MUST check the actual voiceover duration with ffprobe immediately after generating:

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 voiceover.mp3
```

**If voiceover is LONGER than (video_duration - 2s):**
1. **Extend the video** to `ceil(voiceover_duration) + 2` seconds
2. Proportionally rescale ALL CSS animation timings: multiply every `animation-delay` value and every `sceneVis` duration by `new_duration / old_duration`
3. Update the render script's DURATION constant
4. Re-render the video at the new duration
5. This is the correct approach because re-generating TTS to hit an exact duration is unreliable and wastes API credits

**If voiceover is much SHORTER than video (gap > 5s):**
- Shorten the video duration or add more content to the voiceover script and regenerate

**NEVER ship a video where voiceover is longer than the video** — the audio will be cut off mid-sentence in the final output.

### Voiceover Must Start Immediately

The voiceover begins speaking from the very first moment of the video. There should be **no silent intro** — the first word of the voiceover aligns with the first animation appearing (at 0.3–0.5s into the video). This means the hook line must be punchy and start right away.

### Guidelines

- Match text to the video scene timeline
- Use short, punchy sentences for natural speech rhythm
- Add line breaks between sections for natural pauses
- Avoid complex words that might trip up TTS
- For Czech: write naturally, the multilingual model handles pronunciation well
- Aim for ~2.5 words per second when estimating duration
- **First sentence = immediate hook, no filler** ("Stop selling your time" NOT "Hey everyone, today we're going to talk about...")

### Example Timeline Mapping

For a 45-second video with 6 scenes:

```
Scene 1 (0-8s): Hook — grab attention immediately
Scene 2 (7.5-14.5s): Pain points — amplify the problem
Scene 3 (14-21s): Pivot — transition to the solution
Scene 4 (20.5-27.5s): Solution — present the offering
Scene 5 (27-38s): CTA — call to action with details
Scene 6 (37.5-45s): Outro — closing statement
```

### Example Script (Czech)

```
Jste podnikatel a váš WordPress se načítá celou věčnost? Pravděpodobně přicházíte o zákazníky.

Neustálé chyby. Pluginy se rozbijí po každém updatu. Tři sekundy načítání zabíjí prodeje.

Co když existuje lepší cesta?

Proto tu je Varyshop. Jedna platforma pro správu celého byznysu.

Převedeme váš WordPress k nám zdarma. Neváhejte.
```

## Workflow

1. Write voiceover script matching the video timeline (~2.5 words/sec)
2. Set the ELEVENLABS_API_KEY in .env file
3. Call the ElevenLabs TTS API with the script
4. Save the MP3 output
5. **MANDATORY: Check voiceover duration** with ffprobe
6. **If voiceover > (video - 2s): extend the video** — rescale HTML timings proportionally, update DURATION, re-render
7. **If voiceover < (video - 5s): regenerate** with a longer script or shorten the video
8. Mix audio and merge with video (see create-animated-video and generate-background-music skills)

## Integrating Audio with Video

After generating the MP3, pass it to the video render pipeline:

```javascript
// In render-video.mjs SOURCES array:
["LABEL", "video.html", "output-prefix", 45, "voiceover.mp3"]
```

The render script automatically detects the audio file and mixes it into the MP4.
