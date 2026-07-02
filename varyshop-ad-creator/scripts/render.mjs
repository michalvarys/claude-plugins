#!/usr/bin/env node
/**
 * Varyshop creative renderer — HTML → PNG (static/carousel) or MP4 (reel).
 *
 * Usage:
 *   node render.mjs static  <file.html> [--w 1080] [--h 1080] [--out file.png]
 *   node render.mjs carousel <dir-or-glob>            # renders every *.html → .png beside it
 *   node render.mjs reel    <file.html> --w 1080 --h 1920 --dur 28 --fps 30 \
 *                            [--audio bg.mp3] [--out reel.mp4]
 *
 * Self-contained: finds Chrome from puppeteer, PUPPETEER_EXECUTABLE_PATH, or common paths.
 * Reels: drives a paused GSAP timeline exposed as window.MASTER, captures frames, ffmpeg → mp4.
 */
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const mode = process.argv[2];
const target = process.argv[3];
if (!mode || !target) {
  console.error('Usage: render.mjs <static|carousel|reel> <file-or-dir> [--w --h --out --dur --fps --audio]');
  process.exit(1);
}

// --- locate puppeteer + chrome -------------------------------------------------
let puppeteer;
try { puppeteer = (await import('puppeteer')).default; }
catch { console.error('puppeteer not installed. Run: npm install --prefix "$(dirname "$0")"'); process.exit(1); }

function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH))
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  try { const p = puppeteer.executablePath(); if (p && existsSync(p)) return p; } catch {}
  const guesses = [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
    '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return guesses.find(existsSync); // may be undefined → puppeteer downloads/uses default
}
const executablePath = findChrome();
const launchOpts = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
};
if (executablePath) launchOpts.executablePath = executablePath;

const W = parseInt(arg('w', '1080'), 10);
const H = parseInt(arg('h', '1080'), 10);

async function shot(page, htmlPath, outPath, w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.goto('file://' + resolve(htmlPath), { waitUntil: 'networkidle0', timeout: 45000 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('✓', outPath);
}

const browser = await puppeteer.launch(launchOpts);

try {
  if (mode === 'static') {
    const out = arg('out', target.replace(/\.html?$/i, '.png'));
    const page = await browser.newPage();
    await shot(page, target, out, W, H);

  } else if (mode === 'carousel') {
    const dir = existsSync(target) && readdirSync ? target : dirname(target);
    const files = readdirSync(dir).filter(f => /\.html?$/i.test(f)).sort();
    if (!files.length) { console.error('No .html files in', dir); process.exit(1); }
    for (const f of files) {
      const page = await browser.newPage();
      await shot(page, join(dir, f), join(dir, f.replace(/\.html?$/i, '.png')), W, H);
      await page.close();
    }

  } else if (mode === 'reel') {
    const dur = parseFloat(arg('dur', '28'));
    const fps = parseInt(arg('fps', '30'), 10);
    const audio = arg('audio', '');
    const out = arg('out', target.replace(/\.html?$/i, '.mp4'));
    const total = Math.round(dur * fps);
    const tmp = mkdtempSync(join(tmpdir(), 'vsreel-'));
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
    await page.goto('file://' + resolve(target), { waitUntil: 'networkidle0', timeout: 45000 });
    // Pause the GSAP master timeline so we can seek per frame.
    await page.evaluate(() => { if (window.MASTER) { window.MASTER.pause(0); if (window.gsap) window.gsap.ticker.remove(window.gsap.ticker._listeners?.[0]); } });
    for (let i = 0; i < total; i++) {
      const t = i / fps;
      await page.evaluate((t) => { if (window.MASTER) window.MASTER.time(t); }, t);
      await new Promise(r => setTimeout(r, 8));
      await page.screenshot({ path: join(tmp, `f${String(i).padStart(5, '0')}.png`), clip: { x: 0, y: 0, width: W, height: H } });
    }
    // frames → mp4
    const vid = join(tmp, 'video.mp4');
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(fps),
      '-i', join(tmp, 'f%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', vid], { stdio: 'inherit' });
    if (audio && existsSync(audio)) {
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', vid, '-i', audio,
        '-filter_complex', `[1:a]afade=t=in:st=0:d=0.5,afade=t=out:st=${(dur - 1.5).toFixed(2)}:d=1.5,volume=0.85[a]`,
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-shortest', out], { stdio: 'inherit' });
    } else {
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', vid, '-c', 'copy', out], { stdio: 'inherit' });
    }
    rmSync(tmp, { recursive: true, force: true });
    console.log('✓', out);

  } else {
    console.error('Unknown mode:', mode); process.exit(1);
  }
} finally {
  await browser.close();
}
