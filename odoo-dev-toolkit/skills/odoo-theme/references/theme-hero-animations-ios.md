# Odoo 18 Theme — Hero Animations, iOS Stability & Editor Resilience

Hard-earned patterns from Elite Trafika theme development. These solve three interrelated problems:
1. Odoo editor persists inline styles/attributes on save, breaking animations on reload
2. iOS Safari crashes the page under GPU memory pressure
3. WebGL + compositing layers exhaust mobile GPU budgets

## Editor DOM Persistence Problem

When you edit and save in Odoo's website editor, it serializes the **current DOM state** including:
- Inline `style="opacity: 1; transform: none"` that JS animations set
- `src` attributes that JS lazy-loading set from `data-src`
- Removed/added classes

On next page load, the "animated" end state is already baked into the HTML. Animations don't replay because elements are already at their final position.

### Solution: `_resetLayers()` Pattern

On every `start()`, forcefully reset all animated elements back to their initial hidden state:

```javascript
_resetLayers() {
    // Skip layers that should always be visible (logo, gradient overlays)
    const alwaysVisible = ['hero-layer--logo', 'hero-layer--gradient'];
    this.el.querySelectorAll('.hero-layer').forEach((l) => {
        if (alwaysVisible.some((c) => l.classList.contains(c))) {
            l.style.opacity = '1';
            l.style.transform = 'none';
            return;
        }
        l.style.transition = 'none';
        l.style.opacity = '0';
    });

    // Reset layer-specific initial transforms
    const setT = (sel, t) => {
        const el = this.el.querySelector(sel);
        if (el) el.style.transform = t;
    };
    setT('.hero-layer--right', 'translateX(60px)');
    setT('.hero-layer--bottom', 'translateY(40px)');

    // Ensure images have src set — editor may save with src, original uses data-src
    // Visibility is controlled by layer opacity, NOT by src presence
    this.stage.querySelectorAll('img[data-src]').forEach((img) => {
        if (!img.getAttribute('src')) {
            img.src = img.getAttribute('data-src');
        }
    });
}
```

**Key rules:**
- **NEVER control visibility via `src`/`data-src` manipulation** — always use `opacity` on parent layers
- **Always-visible layers** (logo, gradient overlays) must be explicitly set to `opacity: 1` in the reset
- **Reset `transition: none` first** to prevent the reset itself from animating

### Editor Mode Detection

Skip animations entirely in editor mode — show everything immediately:

```javascript
start() {
    if (document.body.classList.contains('editor_enable')) {
        this._revealForEditor();
        return this._super(...arguments);
    }
    // ... normal animation path
}

_revealForEditor() {
    this.stage.style.opacity = '1';
    this.el.querySelectorAll('.hero-layer').forEach((l) => {
        l.style.opacity = '1';
        l.style.transform = 'none';
    });
    this.stage.querySelectorAll('img[data-src]').forEach((img) => {
        if (!img.getAttribute('src')) img.src = img.getAttribute('data-src');
    });
}
```

Also add CSS editor bypass:

```scss
body.editor_enable & {
    .hero-layer {
        opacity: 1 !important;
        transform: none !important;
    }
    .hero-center { opacity: 1 !important; }
    .hero-loader { display: none !important; }
}
```

## Stage Scaling Flash Prevention

When using a fixed-size stage (e.g. 1920x1080) that JS scales to viewport, there's a flash of unscaled content on the first frame.

### Solution: CSS `opacity: 0` + JS reveal after scale

```scss
.hero-stage {
    position: absolute;
    width: 1920px;
    height: 1080px;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    opacity: 0; // Hidden until JS scales it
}
```

```javascript
start() {
    // Scale FIRST, then reveal
    this._scaleStage();
    this.stage.style.opacity = '1';
    // THEN reset layers
    this._resetLayers();
}
```

**Order matters:** `_scaleStage()` → reveal stage → `_resetLayers()` → preload → animate.

## iOS Safari Crash Prevention

"Can't open this page" / "A problem repeatedly occurred" on iOS is caused by GPU memory exhaustion. Each of these consumes GPU RAM:

| Feature | GPU cost | Fix |
|---------|----------|-----|
| `will-change: transform, opacity` on N layers | ~8 MB per 1920x1080 layer | Remove `will-change` — one-shot CSS transitions don't need it |
| WebGL canvas with heavy fragment shader | 50-200 MB | Disable on mobile/tablet entirely |
| `mix-blend-mode: multiply/screen` | Extra compositing pass per layer | Disable on mobile via CSS |
| `filter: drop-shadow()` on layers | Extra compositing pass | Disable on mobile via CSS |
| `backdrop-filter: blur()` | Very expensive on older iOS | Use solid background fallback on mobile |
| Recursive `setTimeout` loops (neon flicker) | CPU keeps GPU active indefinitely | Skip on low-end, pause on `visibilitychange` |

### Low-End Device Detection

```javascript
function isLowEnd() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) return true;
    if (/Android/i.test(ua)) return true;
    if ('ontouchstart' in window && navigator.maxTouchPoints > 1) return true;
    if (window.innerWidth <= 1024) return true;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
    return false;
}
```

**Use this to:**
- Skip infinite animation loops (neon flicker, particle effects)
- Set static fallback opacity instead
- Keep CSS transition animations (they're cheap)

### CSS: Disable GPU-Heavy Effects on Mobile

```scss
@media (max-width: 767px) {
    .hero-layer--shadow { filter: none !important; }
    .hero-layer--blend { mix-blend-mode: normal !important; }
    .hero-neural-canvas { display: none !important; }
}
```

### WebGL: Aggressive Mobile Skip

```javascript
start() {
    const isMobile = /Mobi|Android|iPad|iPhone|iPod/i.test(navigator.userAgent)
        || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
    if (isMobile || window.innerWidth <= 1024) {
        this.el.style.display = 'none';
        return this._super(...arguments);
    }
    // ... WebGL init
}
```

**Threshold: 1024px, not 768px** — iPads in landscape have widths > 768px but still crash on heavy WebGL.

### WebGL Context Lost/Restored

iOS aggressively kills WebGL contexts. Always handle:

```javascript
this._onContextLost = (e) => { e.preventDefault(); this._contextLost = true; };
this._onContextRestored = () => {
    this._contextLost = false;
    if (this._initShader()) {
        this._resize();
        if (!this._paused) this._raf = requestAnimationFrame(this._boundRender);
    }
};
canvas.addEventListener('webglcontextlost', this._onContextLost);
canvas.addEventListener('webglcontextrestored', this._onContextRestored);
```

In render loop:
```javascript
_render() {
    if (this._contextLost) return;
    if (this.gl.isContextLost()) return;
    // ... draw
}
```

### Page Visibility Handling

Stop all GPU work when tab is hidden:

```javascript
// WebGL render loop
this._onVisibility = () => {
    if (document.hidden) {
        this._paused = true;
        if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    } else {
        this._paused = false;
        if (!this._contextLost && !this._raf) {
            this._raf = requestAnimationFrame(this._boundRender);
        }
    }
};
document.addEventListener('visibilitychange', this._onVisibility);

// Neon/flicker timers
if (!this._lowEnd) {
    this._onVisibility = () => {
        if (document.hidden) {
            this._neonTimers.forEach((t) => clearTimeout(t));
            this._neonTimers = [];
        } else if (!this._destroyed) {
            this._startNeonLoop();
        }
    };
    document.addEventListener('visibilitychange', this._onVisibility);
}
```

## Memory Leak Prevention

### `requestAnimationFrame` bind leak

```javascript
// ❌ Creates new function every frame
this._raf = requestAnimationFrame(this._render.bind(this));

// ✅ Bind once in start()
this._boundRender = this._render.bind(this);
this._raf = requestAnimationFrame(this._boundRender);
```

### Recursive `setTimeout` cleanup

Track all timer IDs, clear on destroy:

```javascript
_neonTimers: [],

_setTimeout(fn, ms) {
    if (this._destroyed) return;
    const id = setTimeout(() => {
        const idx = this._neonTimers.indexOf(id);
        if (idx !== -1) this._neonTimers.splice(idx, 1);
        if (!this._destroyed) fn();
    }, ms);
    this._neonTimers.push(id);
},

destroy() {
    this._destroyed = true;
    this._neonTimers.forEach((t) => clearTimeout(t));
    this._neonTimers = [];
    // ... remove event listeners
}
```

### Event listener cleanup

Always store references and remove in `destroy()`:

```javascript
start() {
    this._onResize = this._handleResize.bind(this);
    this._onVisibility = this._handleVisibility.bind(this);
    window.addEventListener('resize', this._onResize);
    document.addEventListener('visibilitychange', this._onVisibility);
}

destroy() {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
}
```

## Image Preloading Pattern

Wait for images to load, then start animations. Handle edge cases:

```javascript
_preloadImages() {
    const imgs = [...this.stage.querySelectorAll('img[src]')];
    const total = imgs.length;
    let loaded = 0;
    let started = false;
    let fallbackTimer = null;  // Must be declared BEFORE first possible use

    const onAllLoaded = () => {
        if (started) return;
        started = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        const loader = this.el.querySelector('.hero-loader');
        if (loader) {
            loader.classList.add('is-hidden');
            setTimeout(() => loader.remove(), 400);
        }
        this._startAnimations();
    };

    if (total === 0) { onAllLoaded(); return; }

    const checkLoaded = () => { if (++loaded >= total) onAllLoaded(); };

    imgs.forEach((img) => {
        if (img.complete) { checkLoaded(); return; }
        img.addEventListener('load', checkLoaded, { once: true });
        img.addEventListener('error', checkLoaded, { once: true });
    });

    // Set fallback AFTER the sync loop — img.complete can trigger onAllLoaded synchronously
    if (!started) fallbackTimer = setTimeout(onAllLoaded, 8000);
}
```

**Critical: `let fallbackTimer = null` at top, not `const` at bottom.** `img.complete` triggers `checkLoaded` → `onAllLoaded` synchronously during `forEach`. If `fallbackTimer` is a `const` declared after the loop, `clearTimeout(fallbackTimer)` hits a temporal dead zone error.

## Mobile Resize Debounce

On mobile, scrolling shows/hides the address bar which changes `innerHeight` but not `innerWidth`. This triggers resize handlers and causes layer flicker.

```javascript
_handleResize() {
    const vw = window.innerWidth;
    if (vw === this._lastVw) return; // Width didn't change — skip
    this._scaleStage();
}
```

## Checklist for New Hero/Animation Themes

- [ ] `_resetLayers()` undoes ALL editor-persisted inline styles on `start()`
- [ ] Always-visible layers (logo, gradient) explicitly set to `opacity: 1` in reset
- [ ] Stage starts CSS `opacity: 0`, JS reveals after `_scaleStage()`
- [ ] `isLowEnd()` detection — skip infinite loops, keep CSS transitions
- [ ] No `will-change` on animation layers (unless proven necessary)
- [ ] `mix-blend-mode`, `filter`, WebGL disabled via CSS on mobile
- [ ] WebGL: context lost/restored handlers, visibility pause, threshold >= 1024px
- [ ] All `setTimeout` IDs tracked and cleared on `destroy()`
- [ ] All `addEventListener` calls have matching `removeEventListener` in `destroy()`
- [ ] `requestAnimationFrame` bind once, not per-frame
- [ ] `visibilitychange` pauses all GPU work
- [ ] `fallbackTimer` for image preload declared as `let` before sync loop
- [ ] Mobile resize: ignore height-only changes
- [ ] Editor mode: show everything immediately, no animations
