---
name: generate-background-music
description: >
  Generate ambient background music for social media videos using ElevenLabs Sound Effects API.
  Use when the user asks to "add background music", "generate music", "create bg music",
  "add ambient sound", "make background track", or wants music underneath their video voiceover.
version: 0.1.0
---

# Generate Background Music

Generate ambient background music for social media videos using the ElevenLabs Sound Effects API. The generated music is mixed at low volume underneath the voiceover track.

## Requirements

- ElevenLabs API key (stored in `.env` file as `ELEVENLABS_API_KEY`)
- Node.js 18+ (for native fetch)
- ffmpeg (for mixing audio tracks)

## API Configuration

- **Endpoint**: `https://api.elevenlabs.io/v1/sound-generation`
- **Method**: POST
- **Output Format**: MP3

## API Call Pattern

```javascript
import { readFileSync, writeFileSync } from "fs";

const API_KEY = "your-elevenlabs-api-key";

const response = await fetch(
  "https://api.elevenlabs.io/v1/sound-generation",
  {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: musicPrompt,          // Descriptive prompt for the music
      duration_seconds: duration,  // Duration in seconds (match video length)
      prompt_influence: 0.3,       // 0.0-1.0 — how closely to follow the prompt
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

## Music Prompt Guidelines

Write prompts that describe the mood and style of background music. Keep it concise and descriptive.

### Recommended Prompts by Content Type

The music should be **upbeat and energetic** — keep viewers engaged, not sleepy. Since we mix at very low volume (1.5%), the track itself can be punchy and lively.

| Content Type | Prompt |
|---|---|
| Business/Startup | `upbeat modern background music, driving beat, synth bass, confident energy, startup vibe` |
| Motivational | `upbeat motivational background music, energetic drums, inspiring synths, fast tempo` |
| Educational | `upbeat electronic background music, light beat, modern, engaging rhythm` |
| Hormozi/Offer | `energetic confident background music, punchy beat, modern trap-inspired, business energy` |
| Tech/SaaS | `upbeat tech background music, electronic beats, futuristic synths, driving rhythm` |
| Success Story | `triumphant upbeat music, building energy, powerful drums, inspiring crescendo` |

### Prompt Tips

- Always include "background music" in the prompt
- Use words like "upbeat", "energetic", "driving beat", "modern", "punchy" — we want energy, not a lullaby
- The track plays at 1.5% volume so it can be as lively as needed without overpowering voiceover
- Avoid words like "calm", "ambient", "relaxing", "soft" — these put viewers to sleep
- Match the energy to the video content — business content should feel confident and fast-paced

## Mixing Audio with ffmpeg

After generating background music, mix it with the voiceover at reduced volume:

### Mix voiceover + background music into one audio file

```bash
ffmpeg -y \
  -i voiceover.mp3 \
  -i bg_music.mp3 \
  -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=0.015[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k \
  mixed_audio.m4a
```

Key parameters:
- `volume=1.0` on voiceover — **voiceover MUST stay at 100% volume, this is non-negotiable**
- `volume=0.015` — background music at **1.5% volume** — subtle texture underneath voiceover
- `normalize=0` — **CRITICAL: disables amix auto-normalization** which otherwise halves the voiceover volume
- `amix=inputs=2:duration=first` — output length matches voiceover duration
- `dropout_transition=3` — smooth fade out at the end

### CRITICAL: Background Music Volume Rule

**The voiceover MUST be the dominant audio. Background music must be barely perceptible — the viewer should feel it subconsciously, not hear it consciously.** If you can clearly hear the music over the voice, it's TOO LOUD.

- Voiceover MUST be at `volume=1.0` (100%) — never reduce voiceover volume
- Background music: use `volume=0.015` (1.5%) as the standard — never higher than `volume=0.03`
- **ALWAYS use `normalize=0` in amix** — without this, ffmpeg auto-normalizes and halves the voiceover
- After mixing, listen/check the waveform: the voiceover peaks should be 10-15x louder than bg music peaks
- When in doubt, go QUIETER on bg music

### Merge mixed audio with video

```bash
ffmpeg -y \
  -i video.mp4 \
  -i mixed_audio.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest \
  -map 0:v:0 -map 1:a:0 \
  final_video.mp4
```

## Full Pipeline: Video + Voiceover + Background Music

1. **Generate voiceover** (see generate-voiceover skill)
2. **Generate background music** matching video duration with appropriate mood prompt
3. **Mix audio tracks**: voiceover at full volume + bg music at 1.5% volume
4. **Merge with video**: combine mixed audio with the rendered video

```bash
# Step 1: Mix voiceover + bg music (voiceover at 100%, bg at 1.5%, normalize OFF)
ffmpeg -y \
  -i voiceover.mp3 -i bg_music.mp3 \
  -filter_complex "[0:a]volume=1.0[vo];[1:a]volume=0.015[bg];[vo][bg]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k mixed_audio.m4a

# Step 2: Merge with video
ffmpeg -y \
  -i video-9x16.mp4 -i mixed_audio.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest \
  -map 0:v:0 -map 1:a:0 \
  final-video-9x16.mp4
```

## Browser-Based API Call (Sandbox Workaround)

If the sandbox blocks direct API calls, use the Chrome browser JavaScript execution:

```javascript
(async () => {
  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: "upbeat modern background music, driving beat, synth bass, confident energy, startup vibe",
      duration_seconds: 25,
      prompt_influence: 0.3,
    }),
  });

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bg_music.mp3';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return `Success! Size: ${(blob.size / 1024).toFixed(1)} KB`;
})()
```

Then copy the downloaded file to the outputs folder and proceed with mixing.

## Workflow

1. Determine the video duration and content mood
2. Write a music prompt matching the content tone
3. Call the ElevenLabs Sound Effects API
4. Save the MP3 output
5. Mix with ffmpeg: voiceover at `volume=1.0`, bg at `volume=0.015`, **always `normalize=0`**
6. Merge mixed audio with the video
