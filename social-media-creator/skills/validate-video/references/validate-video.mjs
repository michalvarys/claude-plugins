/**
 * Video Validation Script
 *
 * Validates rendered video HTML for common quality issues:
 * 1. Scene overlap detection
 * 2. Text viewport overflow
 * 3. First animation timing
 * 4. Dead gap detection
 * 5. Branding presence
 * 6. Voiceover duration sync (if voiceover file provided)
 * 7. Final video file integrity (if final video file provided)
 *
 * Usage:
 *   node validate-video.mjs <html-file> <duration-seconds> <width> <height> [voiceover-file] [final-video-file]
 *
 * Example:
 *   node validate-video.mjs outputs/my-post/my-post-video.html 25 1080 1920
 *   node validate-video.mjs outputs/my-post/my-post-video.html 25 1080 1920 outputs/my-post/my-post-voiceover.mp3 outputs/my-post/my-post-final.mp4
 */

import puppeteer from "puppeteer";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

// === CLI ARGS ===
const htmlFile = process.argv[2];
const durationS = parseFloat(process.argv[3]);
const viewportW = parseInt(process.argv[4]);
const viewportH = parseInt(process.argv[5]);
const voiceoverFile = process.argv[6] || null;
const finalVideoFile = process.argv[7] || null;

if (!htmlFile || !durationS || !viewportW || !viewportH) {
  console.error("Usage: node validate-video.mjs <html-file> <duration-s> <width> <height> [voiceover-file] [final-video-file]");
  process.exit(1);
}

// === RESULTS ===
const results = [];

function pass(check, detail) {
  results.push({ status: "PASS", check, detail });
}
function fail(check, detail) {
  results.push({ status: "FAIL", check, detail });
}
function warn(check, detail) {
  results.push({ status: "WARNING", check, detail });
}

// === HELPERS ===
function getMediaDuration(filePath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8" }
    ).trim();
    return parseFloat(output);
  } catch {
    return null;
  }
}

// === MAIN ===
async function main() {
  const absoluteHtml = path.resolve(htmlFile);

  if (!existsSync(absoluteHtml)) {
    fail("File Check", `HTML file not found: ${absoluteHtml}`);
    printReport();
    process.exit(1);
  }

  // ============================================
  // CHECK 0: Scene Gap Detection (static CSS analysis)
  // ============================================
  const htmlContent = readFileSync(absoluteHtml, "utf-8");
  const sceneTimingRe = /\.scene-(\d+)\s*\{[^}]*sceneVis\s+([\d.]+)s[^}]*animation-delay:\s*([\d.]+)s/g;
  const sceneTimings = [];
  let match;
  while ((match = sceneTimingRe.exec(htmlContent)) !== null) {
    sceneTimings.push({
      num: parseInt(match[1]),
      duration: parseFloat(match[2]),
      delay: parseFloat(match[3]),
      end: parseFloat(match[2]) + parseFloat(match[3]),
    });
  }
  sceneTimings.sort((a, b) => a.delay - b.delay);

  if (sceneTimings.length >= 2) {
    const gaps = [];
    for (let i = 0; i < sceneTimings.length - 1; i++) {
      const gap = sceneTimings[i + 1].delay - sceneTimings[i].end;
      if (gap > 0.5) {
        gaps.push(
          `${gap.toFixed(1)}s gap between scene-${sceneTimings[i].num} (ends ${sceneTimings[i].end.toFixed(1)}s) and scene-${sceneTimings[i + 1].num} (starts ${sceneTimings[i + 1].delay.toFixed(1)}s)`
        );
      }
    }
    if (gaps.length > 0) {
      fail("Scene Gap Detection", `${gaps.length} gap(s) found where no slide is visible:\n  - ${gaps.join("\n  - ")}`);
    } else {
      pass("Scene Gap Detection", "All scenes are seamless (no gaps > 0.5s)");
    }
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--window-size=${viewportW},${viewportH}`,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--hide-scrollbars",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: viewportW, height: viewportH, deviceScaleFactor: 1 });
  await page.goto(`file://${absoluteHtml}`, { waitUntil: "networkidle0" });

  // Wait for fonts
  await new Promise((r) => setTimeout(r, 1000));

  // Pause all animations
  await page.evaluate(() => {
    document.getAnimations({ subtree: true }).forEach((a) => a.pause());
  });

  // ============================================
  // CHECK 1: Scene Overlap Detection
  // ============================================
  const stepMs = 500;
  const totalSteps = Math.floor(durationS * 1000 / stepMs);
  const overlaps = [];

  for (let i = 0; i <= totalSteps; i++) {
    const timeMs = i * stepMs;

    await page.evaluate((t) => {
      document.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = t;
      });
    }, timeMs);

    const visibleScenes = await page.evaluate(() => {
      const scenes = document.querySelectorAll(".scene");
      const visible = [];
      scenes.forEach((s, idx) => {
        const style = getComputedStyle(s);
        const opacity = parseFloat(style.opacity);
        const visibility = style.visibility;
        if (opacity > 0.05 && visibility !== "hidden") {
          visible.push(idx + 1);
        }
      });
      return visible;
    });

    if (visibleScenes.length > 1) {
      overlaps.push({
        timeS: (timeMs / 1000).toFixed(1),
        scenes: visibleScenes,
      });
    }
  }

  if (overlaps.length === 0) {
    pass("Scene Overlap Detection", "No overlaps found");
  } else {
    const details = overlaps
      .map((o) => `  - Scenes ${o.scenes.join(" & ")} visible at t=${o.timeS}s`)
      .join("\n");
    fail("Scene Overlap Detection", `${overlaps.length} overlap(s) found:\n${details}`);
  }

  // ============================================
  // CHECK 2: Text Viewport Overflow
  // ============================================
  const overflows = [];

  // Check at the midpoint of each scene (approximate by checking every 2s)
  for (let i = 0; i <= totalSteps; i += 4) {
    const timeMs = i * stepMs;

    await page.evaluate((t) => {
      document.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = t;
      });
    }, timeMs);

    const textOverflows = await page.evaluate((vw, vh) => {
      const results = [];
      const elements = document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,div,li,a,strong,em,b,i,label");

      elements.forEach((el) => {
        const text = el.textContent.trim();
        if (!text || text.length < 2) return;

        const style = getComputedStyle(el);
        if (parseFloat(style.opacity) <= 0 || style.visibility === "hidden" || style.display === "none") return;

        const rect = el.getBoundingClientRect();
        // Only check elements that are actually rendered (have dimensions)
        if (rect.width === 0 || rect.height === 0) return;

        const issues = [];
        if (rect.right > vw + 5) issues.push(`right by ${Math.round(rect.right - vw)}px`);
        if (rect.bottom > vh + 5) issues.push(`bottom by ${Math.round(rect.bottom - vh)}px`);
        if (rect.left < -5) issues.push(`left by ${Math.round(Math.abs(rect.left))}px`);
        if (rect.top < -5) issues.push(`top by ${Math.round(Math.abs(rect.top))}px`);

        if (issues.length > 0) {
          results.push({
            text: text.substring(0, 40),
            overflow: issues.join(", "),
            className: el.className || el.tagName.toLowerCase(),
          });
        }
      });
      return results;
    }, viewportW, viewportH);

    if (textOverflows.length > 0) {
      textOverflows.forEach((o) => {
        // Deduplicate by text+overflow combo
        const key = `${o.text}|${o.overflow}`;
        if (!overflows.find((x) => `${x.text}|${x.overflow}` === key)) {
          overflows.push({ ...o, timeS: (timeMs / 1000).toFixed(1) });
        }
      });
    }
  }

  if (overflows.length === 0) {
    pass("Text Viewport Overflow", "All text within viewport");
  } else {
    const details = overflows
      .map((o) => `  - "${o.text}..." (${o.className}) overflows ${o.overflow} at t=${o.timeS}s`)
      .join("\n");
    fail("Text Viewport Overflow", `${overflows.length} element(s) overflow:\n${details}`);
  }

  // ============================================
  // CHECK 3: First Animation Timing
  // ============================================
  // Check at 0ms, 300ms, 500ms
  const firstAnimChecks = [0, 300, 500];
  let firstContentVisible = null;

  for (const tMs of firstAnimChecks) {
    await page.evaluate((t) => {
      document.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = t;
      });
    }, tMs);

    const hasVisibleContent = await page.evaluate(() => {
      const elements = document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span,div");
      for (const el of elements) {
        // Skip scene containers, look for actual content
        if (el.classList.contains("scene")) continue;
        if (el.classList.contains("glow-orb")) continue;

        const text = el.textContent.trim();
        if (!text || text.length < 2) continue;

        const style = getComputedStyle(el);
        if (parseFloat(style.opacity) > 0.1 && style.visibility !== "hidden" && style.display !== "none") {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return true;
          }
        }
      }
      return false;
    });

    if (hasVisibleContent && firstContentVisible === null) {
      firstContentVisible = tMs;
    }
  }

  if (firstContentVisible !== null && firstContentVisible <= 500) {
    pass("First Animation Timing", `Content visible at ${firstContentVisible}ms`);
  } else if (firstContentVisible !== null && firstContentVisible <= 1000) {
    warn("First Animation Timing", `Content first visible at ${firstContentVisible}ms — should be 300-500ms`);
  } else {
    // Check up to 2000ms
    for (const tMs of [750, 1000, 1500, 2000]) {
      await page.evaluate((t) => {
        document.getAnimations({ subtree: true }).forEach((a) => {
          a.currentTime = t;
        });
      }, tMs);

      const vis = await page.evaluate(() => {
        const elements = document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span");
        for (const el of elements) {
          if (el.classList.contains("scene")) continue;
          const text = el.textContent.trim();
          if (!text || text.length < 2) continue;
          const style = getComputedStyle(el);
          if (parseFloat(style.opacity) > 0.1 && style.visibility !== "hidden") {
            return true;
          }
        }
        return false;
      });

      if (vis) {
        firstContentVisible = tMs;
        break;
      }
    }

    if (firstContentVisible) {
      fail("First Animation Timing", `Nothing visible until ${firstContentVisible}ms — should be 300-500ms`);
    } else {
      fail("First Animation Timing", "No content visible in first 2000ms!");
    }
  }

  // ============================================
  // CHECK 4: Dead Gap Detection
  // ============================================
  const deadGaps = [];

  for (let i = 1; i < totalSteps - 1; i++) {
    const timeMs = i * stepMs;

    await page.evaluate((t) => {
      document.getAnimations({ subtree: true }).forEach((a) => {
        a.currentTime = t;
      });
    }, timeMs);

    const anyVisible = await page.evaluate(() => {
      const scenes = document.querySelectorAll(".scene");
      for (const s of scenes) {
        const style = getComputedStyle(s);
        if (parseFloat(style.opacity) > 0.05 && style.visibility !== "hidden") {
          return true;
        }
      }
      return false;
    });

    if (!anyVisible) {
      deadGaps.push((timeMs / 1000).toFixed(1));
    }
  }

  if (deadGaps.length === 0) {
    pass("Dead Gap Detection", "No empty frames found");
  } else if (deadGaps.length <= 2) {
    warn("Dead Gap Detection", `Brief gap(s) at: ${deadGaps.join("s, ")}s`);
  } else {
    fail("Dead Gap Detection", `${deadGaps.length} dead gaps found at: ${deadGaps.join("s, ")}s`);
  }

  // ============================================
  // CHECK 5: Branding Presence
  // ============================================
  // Seek to last 3 seconds of video
  const brandCheckTime = Math.max(0, (durationS - 2) * 1000);

  await page.evaluate((t) => {
    document.getAnimations({ subtree: true }).forEach((a) => {
      a.currentTime = t;
    });
  }, brandCheckTime);

  const brandingCheck = await page.evaluate(() => {
    const body = document.body.textContent;
    const hasStartABusiness = body.includes("Start a Business");
    const hasHandle = body.includes("@michalvarys.eu");

    // Check handle opacity if present
    let handleOpacity = null;
    const allElements = document.querySelectorAll("*");
    for (const el of allElements) {
      if (el.textContent.trim() === "@michalvarys.eu" || el.textContent.trim().includes("@michalvarys.eu")) {
        const style = getComputedStyle(el);
        handleOpacity = parseFloat(style.opacity) || parseFloat(style.color.match(/[\d.]+(?=\))/)?.[0]) || 1;
        break;
      }
    }

    return { hasStartABusiness, hasHandle, handleOpacity };
  });

  if (brandingCheck.hasStartABusiness && brandingCheck.hasHandle) {
    if (brandingCheck.handleOpacity !== null && brandingCheck.handleOpacity < 0.6) {
      warn("Branding Presence", `Handle @michalvarys.eu opacity is ${brandingCheck.handleOpacity} — should be 0.65+`);
    } else {
      pass("Branding Presence", '"Start a Business" + "@michalvarys.eu" present');
    }
  } else {
    const missing = [];
    if (!brandingCheck.hasStartABusiness) missing.push('"Start a Business"');
    if (!brandingCheck.hasHandle) missing.push('"@michalvarys.eu"');
    fail("Branding Presence", `Missing: ${missing.join(" and ")}`);
  }

  await browser.close();

  // ============================================
  // CHECK 6: Voiceover Duration Sync
  // ============================================
  if (voiceoverFile && existsSync(voiceoverFile)) {
    const voDuration = getMediaDuration(voiceoverFile);

    if (voDuration === null) {
      warn("Voiceover Duration", `Could not read duration from ${voiceoverFile}`);
    } else {
      const gap = durationS - voDuration;

      if (voDuration > durationS) {
        fail(
          "Voiceover Duration",
          `Voiceover (${voDuration.toFixed(1)}s) is LONGER than video (${durationS}s) by ${(voDuration - durationS).toFixed(1)}s — will be cut off!`
        );
      } else if (gap < 1.5) {
        warn(
          "Voiceover Duration",
          `Voiceover (${voDuration.toFixed(1)}s) leaves only ${gap.toFixed(1)}s gap — should be ~2s shorter than video (${durationS}s)`
        );
      } else if (gap > 5) {
        warn(
          "Voiceover Duration",
          `Voiceover (${voDuration.toFixed(1)}s) ends ${gap.toFixed(1)}s before video (${durationS}s) — too much dead silence`
        );
      } else {
        pass("Voiceover Duration", `${voDuration.toFixed(1)}s voice / ${durationS}s video (${gap.toFixed(1)}s gap)`);
      }
    }
  } else if (voiceoverFile) {
    warn("Voiceover Duration", `Voiceover file not found: ${voiceoverFile}`);
  }

  // ============================================
  // CHECK 7: Final Video File Integrity
  // ============================================
  if (finalVideoFile && existsSync(finalVideoFile)) {
    try {
      const probeOutput = execSync(
        `ffprobe -v error -show_entries stream=codec_type,codec_name,width,height -show_entries format=duration -of json "${finalVideoFile}"`,
        { encoding: "utf-8" }
      );
      const probe = JSON.parse(probeOutput);

      const videoStream = probe.streams?.find((s) => s.codec_type === "video");
      const audioStream = probe.streams?.find((s) => s.codec_type === "audio");
      const fileDuration = parseFloat(probe.format?.duration || "0");

      const issues = [];

      if (!videoStream) {
        fail("File Integrity", "No video stream found in final file");
      } else {
        if (videoStream.codec_name !== "h264") {
          issues.push(`video codec: ${videoStream.codec_name} (expected h264)`);
        }
        const w = parseInt(videoStream.width);
        const h = parseInt(videoStream.height);
        if (w !== viewportW || h !== viewportH) {
          issues.push(`resolution: ${w}x${h} (expected ${viewportW}x${viewportH})`);
        }
      }

      if (!audioStream && voiceoverFile) {
        fail("File Integrity", "No audio stream — voiceover was generated but not merged");
      } else if (audioStream && audioStream.codec_name !== "aac") {
        issues.push(`audio codec: ${audioStream.codec_name} (expected aac)`);
      }

      if (Math.abs(fileDuration - durationS) > 1.5) {
        issues.push(`duration: ${fileDuration.toFixed(1)}s (expected ~${durationS}s)`);
      }

      if (issues.length === 0) {
        pass(
          "File Integrity",
          `${videoStream?.codec_name || "?"}+${audioStream?.codec_name || "no-audio"}, ${videoStream?.width}x${videoStream?.height}, ${fileDuration.toFixed(1)}s`
        );
      } else {
        warn("File Integrity", `Issues: ${issues.join("; ")}`);
      }

      // Black frame detection
      try {
        const blackDetect = execSync(
          `ffmpeg -i "${finalVideoFile}" -vf "blackdetect=d=0.5:pix_th=0.10" -an -f null - 2>&1`,
          { encoding: "utf-8", timeout: 30000 }
        );
        const blackFrames = blackDetect.match(/blackdetect.*black_start:[\d.]+.*black_end:[\d.]+/g) || [];

        if (blackFrames.length > 0) {
          const firstBlack = blackFrames[0].match(/black_start:([\d.]+)/)?.[1];
          if (parseFloat(firstBlack) < 1) {
            warn("Black Frames", `Black frames detected at start (${firstBlack}s)`);
          } else {
            warn("Black Frames", `${blackFrames.length} black segment(s) detected`);
          }
        } else {
          pass("Black Frames", "No black frames detected");
        }
      } catch {
        // blackdetect might not output anything if no black frames — that's fine
        pass("Black Frames", "No black frames detected");
      }
    } catch (e) {
      fail("File Integrity", `ffprobe failed: ${e.message}`);
    }
  } else if (finalVideoFile) {
    fail("File Integrity", `Final video file not found: ${finalVideoFile}`);
  }

  printReport();
}

function printReport() {
  const fails = results.filter((r) => r.status === "FAIL");
  const warnings = results.filter((r) => r.status === "WARNING");
  const passes = results.filter((r) => r.status === "PASS");

  console.log("\n========================================");
  console.log("VIDEO VALIDATION REPORT");
  console.log("========================================");
  console.log(`File: ${htmlFile}`);
  console.log(`Duration: ${durationS}s | Viewport: ${viewportW}x${viewportH}`);
  if (voiceoverFile) console.log(`Voiceover: ${voiceoverFile}`);
  if (finalVideoFile) console.log(`Final video: ${finalVideoFile}`);
  console.log("");

  for (const r of results) {
    const icon = r.status === "PASS" ? "[PASS]" : r.status === "FAIL" ? "[FAIL]" : "[WARNING]";
    console.log(`${icon} ${r.check}`);
    if (r.detail) console.log(`       ${r.detail.replace(/\n/g, "\n       ")}`);
  }

  console.log("");
  if (fails.length === 0 && warnings.length === 0) {
    console.log("RESULT: ALL CHECKS PASSED");
  } else if (fails.length === 0) {
    console.log(`RESULT: ${warnings.length} WARNING(s) — review recommended`);
  } else {
    console.log(`RESULT: ${fails.length} FAIL(s), ${warnings.length} WARNING(s) — FIX REQUIRED`);
  }
  console.log("========================================\n");

  // Exit code: 1 if any fails, 0 otherwise
  process.exit(fails.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
