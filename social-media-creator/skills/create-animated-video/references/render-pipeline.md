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
