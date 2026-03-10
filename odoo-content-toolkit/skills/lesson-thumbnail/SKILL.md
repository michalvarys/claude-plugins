---
description: Generate eye-catching course cover images using HTML/CSS + Puppeteer (primary) or Gemini Flash (fallback), and upload to Odoo 18 slide.channel via XML-RPC.
triggers:
  - lesson thumbnail
  - generate thumbnail
  - course thumbnail
  - slide image
  - nahledovy obrazek
  - thumbnail lekce
  - obrazek kurzu
  - cover image
---

# Course Thumbnail Generator — HTML/CSS + Puppeteer

## Overview

Generuje vizualne poutave cover image pro e-learning kurzy (slide.channel).
**Primarni metoda:** HTML/CSS design renderovany pres Puppeteer do PNG.
**Fallback:** Gemini Flash AI image generation.

## KRITICKE: Kam patri thumbnail

**Thumbnail se generuje na KURZ (slide.channel), NE na jednotlive lekce!**

- `slide.channel.image_1920` = cover obrazek kurzu (videt na /slides)
- `slide.slide.image_1920` = thumbnail lekce (volitelne, videt uvnitr kurzu)

**Kazdy kurz MUSI mit unikatni cover image** aby se odlisil od ostatnich.

## Metoda 1: HTML/CSS + Puppeteer (PRIMARNI)

### Proc HTML/CSS

- Plna kontrola nad textem, layoutem, barvami
- Konzistentni vizualni styl across kurzu
- Zadne nahodne AI artefakty
- Text se renderuje ostrý a citelny
- Reprodukovatelne — stejny HTML = stejny vysledek

### Design principy pro VIZUALNE POUTAVY thumbnail

**DULEZITE: Thumbnail NESMI byt vizualne chaby! Uzivatel ho nesmi mit depresi jen z pohledu.**

1. **Zive, saturovane barvy** — pouzivej radial-gradient orby s vysokou opacitou (0.3-0.5), ne tlumene (0.05-0.1)
2. **Vice vrstev vizualnich elementu** — pozadi + orby + dekorativni elementy + obsah
3. **3D hloubka** — perspective transform na editor/card mockupy, box-shadow s blur
4. **Kontrast** — bily bold text na tmavem pozadi, gradient text pro klicova slova
5. **Vizualni metafory** — code editor mockup, plovouci karty, workflow pills, badges
6. **Sparkle/glow efekty** — box-shadow s barvou, filter: blur na orby

### Anatomie dobreho thumbnaiilu

```
+-------------------------------------------------------+
|  [orby + gradient pozadi]                              |
|                                                        |
|  [badge]  E-LEARNING COURSE                           |
|                                          [editor mockup]
|  VELKY TITLE                             |requirements |
|  GRADIENT TEXT                           |  ## Stories  |
|  mensi podtitul                          |  GIVEN/WHEN  |
|                                          |  THEN...     |
|  Subtitle popis kurzu                                  |
|                                          [plovouci     |
|  [pill 1] > [pill 2] > [pill 3]          karty]       |
|                                                        |
+-------------------------------------------------------+
```

### Povinne vizualni elementy

1. **Pozadi:** Tmave (#0f0f1a) s 3-4 radial-gradient orby (filter: blur(80px))
2. **Badge:** Pill s "E-LEARNING COURSE" nebo podobne, s glow teckou
3. **Title:** 2-3 radky, prvni bily (font-weight: 900), druhy gradient (-webkit-background-clip: text)
4. **Subtitle:** Mensi, rgba(255,255,255,0.55), max 1-2 radky
5. **Workflow/feature pills:** Barevne pills dole ukazujici klicove koncepty kurzu
6. **Vizualni mockup:** Editor, terminal, spec dokument — relevantni k tematu kurzu
7. **Dekorace:** Sparkle dots, connection circles, floating cards

### CSS vzory ktere fungují

```css
/* Glowing orb — POUZIVEJ 0.3-0.5 opacitu, ne 0.05! */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.orb1 { width: 500px; height: 500px; background: rgba(168, 85, 247, 0.5); }

/* Gradient text — pro zvyrazneni klicoveho slova */
.gradient-text {
  background: linear-gradient(135deg, #c084fc 0%, #22d3ee 50%, #34d399 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 3D editor mockup — perspective transform */
.editor {
  transform: perspective(1200px) rotateY(-8deg) rotateX(3deg);
  box-shadow: 0 0 60px rgba(124, 58, 237, 0.25), 0 25px 80px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(15, 15, 30, 0.85);
}

/* Glass card */
.card {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

/* Workflow pills — kazdy jina barva */
.pill { padding: 14px 24px; border-radius: 14px; font-weight: 700; }
.pill.p1 { background: rgba(168, 85, 247, 0.25); }
.pill.p2 { background: rgba(59, 130, 246, 0.25); }
.pill.p3 { background: rgba(6, 182, 212, 0.25); }
.pill.p4 { background: rgba(34, 197, 94, 0.25); }
```

### Barevne palety per tema

| Tema kurzu | Primarni orby | Gradient text | Pills |
|---|---|---|---|
| AI/Coding | purple + cyan + pink | purple→cyan→green | purple, blue, cyan, green |
| Business/CRM | blue + amber + green | blue→amber | blue, amber, green, teal |
| DevOps/Infra | orange + red + blue | orange→red→purple | orange, red, blue, green |
| Security | red + purple + dark | red→purple | red, purple, slate, emerald |
| Design/UI | pink + violet + blue | pink→violet→blue | pink, violet, blue, cyan |
| Data/DB | emerald + cyan + blue | emerald→cyan | emerald, cyan, blue, indigo |

### Rendering: Puppeteer + Chrome

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const htmlPath = path.resolve(__dirname, 'thumbnail.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  const outPath = path.resolve(__dirname, 'thumbnail.png');
  await page.screenshot({ path: outPath, type: 'png' });

  console.log(`Saved: ${outPath}`);
  await browser.close();
})();
```

**Pozadavky:**
- Node.js s puppeteer (`npm install puppeteer` v projektu startbusiness)
- Google Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`)
- Viewport: 1920x1080 (standard course cover)

### Upload do Odoo

```python
import base64
with open('thumbnail.png', 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')

call('slide.channel', 'write', [[channel_id], {'image_1920': image_b64}])
```

### Soubory na disk

Pro kazdy kurz vytvor adresar `kurzy/{course_slug}/` s:
- `thumbnail.html` — HTML/CSS design
- `render_thumbnail.js` — Puppeteer renderer
- `upload_thumbnail.py` — upload do Odoo
- `thumbnail.png` — renderovany vysledek

### Kompletni workflow v exec.py

Thumbnail generovani a upload pridej PRIMO do hlavniho `exec.py` skriptu kurzu
(za vytvoreni channelu, pred finalni summary):

```python
import subprocess
import base64

# ... po vytvoreni channel_id ...

# Generate thumbnail
print("Generating thumbnail...")
thumbnail_dir = os.path.dirname(os.path.abspath(__file__))
subprocess.run(['node', os.path.join(thumbnail_dir, 'render_thumbnail.js')], check=True)

# Upload thumbnail
with open(os.path.join(thumbnail_dir, 'thumbnail.png'), 'rb') as f:
    image_b64 = base64.b64encode(f.read()).decode('utf-8')

call('slide.channel', 'write', [[channel_id], {'image_1920': image_b64}])
print(f"  Thumbnail uploaded to channel {channel_id}")
```

## Metoda 2: Gemini Flash (FALLBACK)

Pouzij kdyz HTML/CSS neni mozne (napr. potrebujes realisticke ilustrace).

### Configuration

- `GEMINI_API_KEY` — Google Gemini API key
- Python SDK: `google-genai` (NE `google-generativeai` — deprecated!)

### Prompt pravidla

1. VZDY anglicky — Gemini generuje lepsi obrazky s anglickymi prompty
2. NIKDY nepozaduj text/slova — renderuji se spatne
3. Pouzivej vizualni metafory (bridge, shield, rocket, etc.)
4. Kazdy kurz MUSI mit jinou barevnou paletu
5. Prompt pod 200 slov
6. Explicitne rekni "no text, no words, no letters, no numbers"

### Prompt template

```
Create a bold, eye-catching course cover image.
Theme: {course_topic_summary}
Visual: {specific_visual_metaphors_and_icons}
Colors: {unique_gradient_palette} background.
Style: Modern flat illustration, clean vector art, vibrant colors.
Do NOT include any text, words, letters, numbers, or watermarks.
```

### Generate image

```python
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=prompt,
    config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
)

image_data = None
for part in response.candidates[0].content.parts:
    if part.inline_data is not None:
        image_data = part.inline_data.data
        break

image_b64 = base64.b64encode(image_data).decode('utf-8')
```

**Modely (v poradi stability):**
1. `gemini-2.5-flash-image` — osvedceny, stabilni
2. `gemini-3.1-flash-image-preview` — nejnovejsi
3. `gemini-3-pro-image-preview` — nejvyssi kvalita

**NEFUNGUJE:** `gemini-2.0-flash-exp-image-generation` — 404

## Important Rules

1. **HTML/CSS je PRIMARNI metoda** — Gemini jen jako fallback
2. **Thumbnail patri na slide.channel** — ne slide.slide
3. Kazdy kurz MUSI mit vizualne UNIKATNI cover
4. **Thumbnail NESMI byt vizualne chaby** — zive barvy, hloubka, dekorace
5. `image_1920` field pro base64 upload
6. Viewport 1920x1080 pro Puppeteer
7. Pouzij `executablePath` pro lokalniho Chrome
8. Thumbnail se generuje AUTOMATICKY jako soucast kurzu workflow
