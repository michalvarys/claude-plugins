# Video Render Pipeline — Complete Script

## render-video.mjs

This is a complete Node.js script for rendering HTML/CSS animations to MP4 video.

```javascript
import puppeteer from "puppeteer";
import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === CONFIG ===
const FPS = 30;
const DEFAULT_DURATION_S = 15;
const FRAME_INTERVAL_MS = 1000 / FPS;

// Sources: [label, html file, output prefix, duration_s (optional), audio file (optional)]
const SOURCES = [
  // Add your sources here:
  // ["LABEL", path.join(__dirname, "video.html"), "output-prefix", 30, path.join(__dirname, "voiceover.mp3")],
];

// Formats: [name, width, height]
const FORMATS = [
  ["9x16", 1080, 1920],
  ["4x5", 1080, 1350],
  ["1x1", 1080, 1080],
  ["16x9", 1920, 1080],
];

// CLI args: node render-video.mjs [label] [format]
const argLabel = process.argv[2]?.toUpperCase();
const argFormat = process.argv[3];

async function renderFormat(htmlFile, outputPrefix, formatName, width, height, durationS, audioFile) {
  const totalFrames = FPS * durationS;
  const outputFile = path.join(__dirname, `${outputPrefix}-${formatName}.mp4`);

  console.log(`\n=== ${outputPrefix} ${formatName} (${width}x${height}) ${durationS}s ===`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${width},${height}`, "--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle0" });

  // Wait for fonts/assets to fully load
  await new Promise((r) => setTimeout(r, 1000));

  // Pause all animations and hide debug hints
  await page.evaluate(() => {
    document.getAnimations({ subtree: true }).forEach((a) => a.pause());
    const hint = document.querySelector(".hint");
    if (hint) hint.style.display = "none";
  });

  // Build ffmpeg args
  const hasAudio = audioFile && existsSync(audioFile);
  console.log(`Capturing ${totalFrames} frames → piping to ffmpeg${hasAudio ? " (with audio)" : ""}...`);

  const ffmpegArgs = [
    "-y",
    "-f", "image2pipe",
    "-framerate", String(FPS),
    "-i", "-",
  ];
  if (hasAudio) ffmpegArgs.push("-i", audioFile);
  ffmpegArgs.push(
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
  );
  if (hasAudio) ffmpegArgs.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  ffmpegArgs.push(
    "-vf", `scale=${width}:${height}`,
    "-r", String(FPS),
    outputFile,
  );

  const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: ["pipe", "inherit", "inherit"] });

  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    ffmpeg.on("error", reject);
  });

  // Capture frames by seeking each animation
  for (let i = 0; i < totalFrames; i++) {
    const timeMs = i * FRAME_INTERVAL_MS;

    await page.evaluate((t) => {
      document.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = t; });
    }, timeMs);

    const pngBuffer = await page.screenshot({ type: "png", encoding: "binary" });

    const canWrite = ffmpeg.stdin.write(pngBuffer);
    if (!canWrite) {
      await new Promise((r) => ffmpeg.stdin.once("drain", r));
    }

    if (i % 60 === 0) console.log(`  ${i}/${totalFrames} (${(timeMs / 1000).toFixed(1)}s)`);
  }

  ffmpeg.stdin.end();
  await browser.close();
  await ffmpegDone;

  console.log(`Done: ${outputFile}`);
}

async function main() {
  const sources = argLabel ? SOURCES.filter(([l]) => l === argLabel) : SOURCES;
  const formats = argFormat ? FORMATS.filter(([n]) => n === argFormat) : FORMATS;

  if (sources.length === 0) {
    console.error(`Unknown label: ${argLabel}. Available: ${SOURCES.map(([l]) => l).join(", ")}`);
    process.exit(1);
  }
  if (formats.length === 0) {
    console.error(`Unknown format: ${argFormat}. Available: ${FORMATS.map(([n]) => n).join(", ")}`);
    process.exit(1);
  }

  for (const [label, htmlFile, prefix, dur, audio] of sources) {
    const durationS = dur || DEFAULT_DURATION_S;
    for (const [fName, w, h] of formats) {
      await renderFormat(htmlFile, prefix, fName, w, h, durationS, audio);
    }
  }

  console.log("\nAll done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

## Scene Timing Fix Script

When adjusting video duration (e.g., to match voiceover + 2s), scene timings must be recalculated to remain seamless. Use this approach:

```javascript
import { readFileSync, writeFileSync } from "fs";

function fixSceneTimings(htmlPath, targetDuration) {
  let html = readFileSync(htmlPath, "utf-8");

  // Parse scene timings
  const sceneRe = /(.scene-(\d+)\s*\{\s*animation:\s*sceneVis\s+)([\d.]+)(s\s+ease\s+forwards;\s*animation-delay:\s*)([\d.]+)(s;\s*\})/g;
  const scenes = [];
  let m;
  while ((m = sceneRe.exec(html)) !== null) {
    scenes.push({ num: parseInt(m[2]), dur: parseFloat(m[3]), delay: parseFloat(m[5]) });
  }

  // Scale durations proportionally
  const totalDur = scenes.reduce((s, sc) => s + sc.dur, 0);
  const ratio = targetDuration / totalDur;

  // Compute new seamless timings
  const newScenes = {};
  let acc = 0;
  for (const sc of scenes) {
    const newDur = Math.round(sc.dur * ratio * 10) / 10;
    newScenes[sc.num] = { dur: newDur, delay: Math.round(acc * 10) / 10, oldDelay: sc.delay, oldDur: sc.dur };
    acc += newDur;
  }

  // Replace scene lines
  html = html.replace(sceneRe, (match, pre, num, dur, mid, delay, suf) => {
    const ns = newScenes[parseInt(num)];
    return `${pre}${ns.dur}${mid}${ns.delay}${suf}`;
  });

  // Remap inner animation-delay values proportionally
  html = html.replace(/animation-delay:\s*([\d.]+)s/g, (match, valStr) => {
    const val = parseFloat(valStr);
    if (val < 0.5) return match; // Keep small initial delays

    // Find which scene this delay belongs to
    for (const [num, ns] of Object.entries(newScenes)) {
      if (Math.abs(val - ns.delay) < 0.05) return match; // Scene delay already fixed
      const oldEnd = ns.oldDelay + ns.oldDur;
      if (ns.oldDelay - 0.5 <= val && val <= oldEnd + 1.0) {
        const offset = val - ns.oldDelay;
        const sceneRatio = ns.dur / ns.oldDur;
        const newVal = Math.round((ns.delay + offset * sceneRatio) * 10) / 10;
        return `animation-delay: ${newVal}s`;
      }
    }
    return match;
  });

  writeFileSync(htmlPath, html);
}
```

**Key rules:**
1. Scene delays MUST be seamless: `delay[N] = delay[N-1] + dur[N-1]`
2. Inner element delays must stay within their scene's visibility window
3. Scale both durations AND inner delays proportionally when changing total duration
4. **NEVER use `-shortest`** in ffmpeg when combining video + voiceover — the video is intentionally ~2s longer

## Static Rendering Script

For rendering a static PNG from the same HTML (without animation capture):

```javascript
async function renderStatic(htmlFile, outputFile, width, height) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--window-size=${width},${height}`, "--no-sandbox", "--disable-setuid-sandbox", "--hide-scrollbars"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: outputFile, type: "png" });
  await browser.close();
}
```
