---
description: Generate AI cover images for e-learning courses using Gemini Flash and upload to Odoo 18 slide.channel via XML-RPC.
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

# Course Thumbnail Generator — Gemini Flash + Odoo 18

## Overview

This skill generates AI cover images for e-learning courses (slide.channel)
using the Gemini Flash image generation API. It analyzes the course name and
description, crafts a visual prompt, generates the image, and uploads it as
the channel's `image_1920` field.

## KRITICKE: Kam patri thumbnail

**Thumbnail se generuje na KURZ (slide.channel), NE na jednotlive lekce!**

Na hlavni strance `/slides` se zobrazuje `slide.channel.image_1920`.
Jednotlive `slide.slide.image_1920` se zobrazuji jen uvnitr kurzu.

- `slide.channel.image_1920` = cover obrazek kurzu (to co vidi uzivatel na /slides)
- `slide.slide.image_1920` = thumbnail lekce (volitelne, zobrazuje se uvnitr kurzu)

**Kazdy kurz MUSI mit unikatni cover image** aby se odlisil od ostatnich.

## Configuration

Environment variables:
- `GEMINI_API_KEY` — Google Gemini API key (required)
- `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY`, `ODOO_LOGIN` — Odoo connection (required)

Python SDK: `google-genai` (NE `google-generativeai` — ten je deprecated!)

Install: `pip install google-genai`

## Workflow

### Step 1: Get course info

```python
channels = call_en('slide.channel', 'search_read', [[]],
    {'fields': ['id', 'name', 'description', 'description_short']})
```

### Step 2: Craft a unique prompt per course

Each course needs a VISUALLY DISTINCT prompt. Vary:
- **Colors:** different gradient palette per course
- **Visual metaphors:** unique icons/symbols per topic
- **Composition:** different layout/arrangement

**Prompt template for course cover:**
```
Create a bold, eye-catching course cover image.
Theme: {course_topic_summary}
Visual: {specific_visual_metaphors_and_icons}
Colors: {unique_gradient_palette} background.
Style: Modern flat illustration, clean vector art, vibrant colors.
Do NOT include any text, words, letters, numbers, or watermarks.
```

**Prompt rules:**
1. ALWAYS in English — Gemini generates better images with English prompts
2. NEVER ask for text/words in the image — they render poorly in AI images
3. Use visual metaphors (e.g. "bridge" for connection, "shield" for security)
4. Each course MUST have different color palette to be visually distinct
5. Keep prompts concise (under 200 words)
6. Request "no text" explicitly to avoid random text artifacts

### Step 3: Generate image with Gemini

```python
from google import genai
from google.genai import types
import base64
import os

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
    ),
)

# Extract image data
image_data = None
for part in response.candidates[0].content.parts:
    if part.inline_data is not None:
        image_data = part.inline_data.data  # raw bytes
        break

if not image_data:
    raise Exception("No image generated")

image_b64 = base64.b64encode(image_data).decode('utf-8')
```

**Available models (try in order if one fails):**
1. `gemini-2.5-flash-image` — proven, stable, free tier (500 RPD)
2. `gemini-3.1-flash-image-preview` — latest, fastest
3. `gemini-3-pro-image-preview` — highest quality, 4K support

**NEFUNGUJE:** `gemini-2.0-flash-exp-image-generation` — uz neni dostupny (404)

### Step 4: Upload to Odoo

```python
# Set cover image on slide.channel (THIS IS THE IMPORTANT ONE)
call_en('slide.channel', 'write', [[channel_id], {
    'image_1920': image_b64,
}])
```

The `image_1920` field accepts base64-encoded image data directly.
Odoo automatically generates smaller sizes (image_512, image_256, image_128).

## Complete Executor Script

```python
#!/usr/bin/env python3
"""Generate unique cover image for each course channel."""
import os
import sys
import base64
import time
import xmlrpc.client
from google import genai
from google.genai import types

# --- Odoo config ---
ODOO_URL = os.environ.get('ODOO_URL', 'https://www.michalvarys.eu')
ODOO_DB = os.environ.get('ODOO_DB', 'varyshop')
ODOO_API_KEY = os.environ.get('ODOO_API_KEY', '')
ODOO_LOGIN = os.environ.get('ODOO_LOGIN', 'info@varyshop.eu')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

if not ODOO_API_KEY or not GEMINI_API_KEY:
    print("ERROR: ODOO_API_KEY and GEMINI_API_KEY must be set")
    sys.exit(1)

common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object', allow_none=True)
UID = common.authenticate(ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {})
if not UID:
    raise Exception("Odoo auth failed")

DB, KEY = ODOO_DB, ODOO_API_KEY

def call_en(m, meth, a, kw=None):
    if kw is None: kw = {}
    kw['context'] = {'lang': 'en_US'}
    return models.execute_kw(DB, UID, KEY, m, meth, a, kw)


def generate_image(prompt):
    client = genai.Client(api_key=GEMINI_API_KEY)
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    return base64.b64encode(
                        part.inline_data.data
                    ).decode('utf-8')
        except Exception as e:
            print(f"  Attempt {attempt+1}: {e}")
            if attempt < 2:
                time.sleep(5)
    raise Exception("All attempts failed")


# Custom prompt per channel — EACH must be visually unique
CHANNEL_PROMPTS = {
    # channel_id: prompt
}

channels = call_en('slide.channel', 'search_read', [[]],
    {'fields': ['id', 'name'], 'order': 'id'})

for ch in channels:
    cid = ch['id']
    prompt = CHANNEL_PROMPTS.get(cid)
    if not prompt:
        print(f"  Channel {cid}: no prompt, skip")
        continue
    try:
        image_b64 = generate_image(prompt)
        call_en('slide.channel', 'write', [[cid], {
            'image_1920': image_b64,
        }])
        print(f"  Channel {cid} ({ch['name']}): cover uploaded")
    except Exception as e:
        print(f"  Channel {cid}: ERROR {e}")
    time.sleep(3)
```

## Important Rules

1. **Thumbnail patri na slide.channel, NE slide.slide** — na /slides se zobrazuje channel image
2. Kazdy kurz MUSI mit vizualne odlisny cover (jine barvy, jine ikony)
3. Prompts ALWAYS in English — better image quality
4. NEVER request text in images — AI renders text poorly
5. Use `image_1920` field for direct base64 upload
6. Rate limit: sleep 3s between Gemini API calls
7. Keep prompts under 200 words for best results
8. Gemini may return JPEG bytes with PNG mime_type — Odoo accepts both
9. Model `gemini-2.0-flash-exp-image-generation` uz NEFUNGUJE — pouzij `gemini-2.5-flash-image`
