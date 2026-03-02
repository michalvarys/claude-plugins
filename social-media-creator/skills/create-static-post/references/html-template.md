# HTML Template Reference

## Complete Base Template

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1080px; height: 1080px; display: flex; align-items: center; justify-content: center;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1a2e1a 50%, #0f172a 100%);
  overflow: hidden; position: relative;
}
/* Ambient glow orbs — use the post's accent color with low opacity */
.glow1 {
  position: absolute; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(ACCENT_R,ACCENT_G,ACCENT_B,0.16) 0%, transparent 70%);
  top: -100px; left: -50px; border-radius: 50%;
}
.glow2 {
  position: absolute; width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(SECONDARY_R,SECONDARY_G,SECONDARY_B,0.1) 0%, transparent 70%);
  bottom: -100px; right: -50px; border-radius: 50%;
}
/* Main content container */
.container { width: 920px; display: flex; flex-direction: column; align-items: center; z-index: 1; }
/* Top badge */
.badge {
  background: linear-gradient(135deg, ACCENT_1, ACCENT_2);
  color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  padding: 10px 28px; border-radius: 30px; margin-bottom: 28px;
  display: flex; align-items: center; gap: 8px;
}
.badge svg { width: 18px; height: 18px; }
/* Title */
h1 { color: #fff; font-size: 48px; font-weight: 900; text-align: center; line-height: 1.15; margin-bottom: 14px; }
h1 span {
  background: linear-gradient(135deg, LIGHT_ACCENT, LIGHT_ACCENT_2);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
/* Subtitle — must be large and readable, NEVER below 24px */
.subtitle { color: rgba(255,255,255,0.8); font-size: 26px; font-weight: 600; text-align: center; margin-bottom: 38px; }
/* Glass card */
.card {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 24px; backdrop-filter: blur(10px);
}
/* Bottom branding bar — prominent and unmissable */
.bottom-bar {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; margin-top: 30px;
  padding: 16px 0 4px;
}
.bottom-bar .brand-row {
  display: flex; align-items: center; gap: 12px;
}
.bottom-bar .logo-icon {
  width: 36px; height: 36px; background: linear-gradient(135deg, ACCENT_1, ACCENT_2);
  border-radius: 9px; display: flex; align-items: center; justify-content: center;
}
.bottom-bar .logo-icon svg { width: 20px; height: 20px; }
.bottom-bar .brand-name { color: rgba(255,255,255,0.5); font-size: 19px; font-weight: 700; letter-spacing: 0.01em; }
.bottom-bar .handle { color: rgba(255,255,255,0.65); font-size: 16px; font-weight: 700; letter-spacing: 0.02em; }
</style>
</head>
<body>
  <div class="glow1"></div>
  <div class="glow2"></div>
  <div class="container">
    <div class="badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
        <!-- Badge icon SVG -->
      </svg>
      BADGE TEXT
    </div>
    <h1>Main Title<br><span>Gradient Highlight</span></h1>
    <div class="subtitle">Supporting subtitle text</div>

    <!-- CONTENT AREA — customize per post -->

    <div class="bottom-bar">
      <div class="brand-row">
        <div class="logo-icon">
          <svg viewBox="0 0 20 20" fill="none"><path d="M11.5 2L5 10.5H9L8 18L15 9H11Z" fill="white"/></svg>
        </div>
        <span class="brand-name">Start a Business</span>
      </div>
      <div class="handle">@michalvarys.eu</div>
    </div>
  </div>
</body>
</html>
```

## Common Layout Patterns

### Grid of Cards (3-4 items)
```css
.grid { display: flex; gap: 16px; width: 100%; flex-wrap: wrap; }
.grid-item {
  flex: 1; min-width: calc(50% - 8px);
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 22px;
}
```

### Comparison (A vs B)
```css
.compare { display: flex; gap: 18px; width: 100%; }
.compare-side { flex: 1; border-radius: 20px; padding: 28px; }
.compare-side.good { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); }
.compare-side.bad { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); }
```

### Timeline / Steps
```css
.steps { display: flex; flex-direction: column; gap: 14px; width: 100%; }
.step {
  display: flex; align-items: center; gap: 16px;
  background: rgba(255,255,255,0.06); border-radius: 14px; padding: 18px 22px;
}
.step-number {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, ACCENT_1, ACCENT_2);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 18px; font-weight: 800;
}
```

### Stat Highlight
```css
.stat { font-size: 64px; font-weight: 900; }
.stat-label { color: rgba(255,255,255,0.5); font-size: 16px; }
```

## Common SVG Icons

### Checkmark
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
```

### Star
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
```

### Mail/Email
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
```

### Users/People
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
```

### Chart/Analytics
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
```

### Lightning Bolt (Brand Logo)
```html
<svg viewBox="0 0 20 20" fill="none"><path d="M11.5 2L5 10.5H9L8 18L15 9H11Z" fill="white"/></svg>
```

### Dollar / Money
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
```

### Target
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
```

### Gift
```html
<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><rect x="3" y="8" width="18" height="4" rx="1"/><rect x="3" y="12" width="18" height="8" rx="1"/><line x1="12" y1="8" x2="12" y2="20"/><path d="M12 8c-2-4-6-4-6-1s4 5 6 5"/><path d="M12 8c2-4 6-4 6-1s-4 5-6 5"/></svg>
```
