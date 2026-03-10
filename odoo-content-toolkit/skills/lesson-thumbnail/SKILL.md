---
description: Generate AI thumbnail images for e-learning lessons using Gemini Flash and upload to Odoo 18 slide.slide via XML-RPC.
triggers:
  - lesson thumbnail
  - generate thumbnail
  - course thumbnail
  - slide image
  - nahledovy obrazek
  - thumbnail lekce
  - obrazek kurzu
---

# Lesson Thumbnail Generator — Gemini Flash + Odoo 18

## Overview

This skill generates AI thumbnail images for e-learning course lessons (slide.slide)
using the Gemini Flash image generation API. It reads the lesson's html_content to
understand what it teaches, crafts a visual prompt, generates the image, and uploads
it as the slide's `image_1920` field.

## Configuration

Environment variables:
- `GEMINI_API_KEY` — Google Gemini API key (required)
- `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY`, `ODOO_LOGIN` — Odoo connection (required)

Python dependencies: `google-genai`, `Pillow`

Install: `pip install google-genai Pillow`

## Workflow

### Step 1: Identify target slides

Get slides by channel ID or slide IDs. Read their `name` and `html_content`
to understand the topic.

```python
slides = call_en('slide.slide', 'search_read',
    [[['channel_id', '=', channel_id], ['is_category', '=', False]]],
    {'fields': ['id', 'name', 'html_content', 'slide_category'],
     'order': 'sequence'})
```

### Step 2: Analyze lesson content

Extract the key teaching points from html_content. Focus on:
- The `<h2>` title (main topic)
- First 2-3 `<h3>` subtopics
- Key concepts, tools, or technologies mentioned

### Step 3: Craft an image prompt

Create a prompt in ENGLISH that will generate a visually appealing thumbnail.

**Prompt template:**
```
Create a modern, clean thumbnail image for an online course lesson.
Topic: {lesson_topic_summary}
Style: Professional, tech-oriented, flat design with subtle gradients.
Colors: Use a cohesive color palette (blues, purples, teals).
Include visual metaphors or icons representing: {key_concepts}.
Do NOT include any text, words, letters, numbers, or watermarks in the image.
The image should work as a small thumbnail (will be displayed at ~300x200px).
Keep the composition simple and uncluttered.
```

**Prompt rules:**
1. ALWAYS in English — Gemini generates better images with English prompts
2. NEVER ask for text/words in the image — they render poorly in AI images
3. Use visual metaphors instead (e.g. "bridge" for connection, "shield" for security)
4. Keep prompts concise (under 200 words)
5. Request "no text" explicitly to avoid random text artifacts
6. For tech topics use icons/symbols: gears, code brackets, nodes, clouds, etc.

### Step 4: Generate image with Gemini

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

**Model priority (try in order if one fails):**
1. `gemini-2.5-flash-image` — proven, stable, free tier (500 RPD)
2. `gemini-3.1-flash-image-preview` — latest, fastest
3. `gemini-3-pro-image-preview` — highest quality, 4K support

### Step 5: Upload to Odoo

```python
# Set thumbnail directly on slide.slide
call_en('slide.slide', 'write', [[slide_id], {
    'image_1920': image_b64,
}])
```

The `image_1920` field accepts base64-encoded image data directly.
Odoo automatically generates smaller sizes (image_512, image_256, image_128).

## Batch Generation

For generating thumbnails for an entire course:

```python
import time

for slide in slides:
    if slide['slide_category'] == 'quiz':
        continue  # Skip quizzes

    prompt = build_prompt(slide['name'], slide['html_content'])
    image_b64 = generate_image(prompt)
    call_en('slide.slide', 'write', [[slide['id']], {
        'image_1920': image_b64,
    }])
    print(f"Thumbnail set for slide {slide['id']}: {slide['name']}")
    time.sleep(2)  # Rate limiting
```

**Rate limits:** Gemini free tier allows ~500 image requests/day.
Add `time.sleep(2)` between requests to avoid hitting rate limits.

## Complete Executor Script Template

```python
#!/usr/bin/env python3
"""Generate and upload thumbnails for course lessons."""
import os
import sys
import base64
import re
import time
import xmlrpc.client
from html.parser import HTMLParser
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


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self._skip = {'script', 'style', 'code', 'pre'}
        self._in_skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in self._skip: self._in_skip += 1
    def handle_endtag(self, tag):
        if tag in self._skip and self._in_skip > 0: self._in_skip -= 1
    def handle_data(self, data):
        t = data.strip()
        if t and self._in_skip == 0: self.texts.append(t)


def extract_summary(html, max_texts=15):
    """Extract key texts from HTML for prompt building."""
    p = TextExtractor()
    p.feed(html or '')
    return p.texts[:max_texts]


def build_prompt(name, html_content):
    """Build Gemini image generation prompt from lesson content."""
    texts = extract_summary(html_content)
    # Get h2/h3 headings
    headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html_content or '', re.DOTALL)
    headings = [re.sub(r'<[^>]+>', '', h).strip() for h in headings[:5]]

    topic = name
    subtopics = ', '.join(headings[:3]) if headings else ''
    key_words = ', '.join(texts[:5]) if texts else topic

    return f"""Create a modern, clean thumbnail image for an online course lesson.
Topic: {topic}
Key concepts: {subtopics}
Style: Professional, tech-oriented, minimalist flat design with subtle gradients.
Colors: Cohesive palette of blues, purples, and teals on a clean background.
Include abstract visual metaphors or simple icons representing: {key_words}.
Do NOT include any text, words, letters, numbers, watermarks, or labels.
The image should be simple, uncluttered, and work well as a small thumbnail."""


def generate_image(prompt, retries=2):
    """Generate image with Gemini, return base64 string."""
    client = genai.Client(api_key=GEMINI_API_KEY)

    models_to_try = [
        "gemini-2.5-flash-image",
    ]

    for model_name in models_to_try:
        for attempt in range(retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
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
                print(f"  Attempt {attempt+1} with {model_name}: {e}")
                if attempt < retries:
                    time.sleep(3)
                continue
        # Try next model
        continue

    raise Exception("All image generation attempts failed")


# --- Main: generate thumbnails for a course ---
CHANNEL_ID = int(sys.argv[1]) if len(sys.argv) > 1 else None
if not CHANNEL_ID:
    print("Usage: python generate_thumbnails.py <channel_id> [slide_id1,slide_id2,...]")
    sys.exit(1)

# Optional: specific slide IDs
specific_ids = None
if len(sys.argv) > 2:
    specific_ids = [int(x) for x in sys.argv[2].split(',')]

# Get slides
domain = [['channel_id', '=', CHANNEL_ID], ['is_category', '=', False]]
if specific_ids:
    domain.append(['id', 'in', specific_ids])

slides = call_en('slide.slide', 'search_read', [domain],
    {'fields': ['id', 'name', 'html_content', 'slide_category'],
     'order': 'sequence'})

print(f"Generating thumbnails for {len(slides)} slides in channel {CHANNEL_ID}")

for slide in slides:
    if slide['slide_category'] == 'quiz':
        print(f"  Skip quiz: {slide['name']}")
        continue

    print(f"\n  Slide {slide['id']}: {slide['name']}")
    prompt = build_prompt(slide['name'], slide['html_content'])
    print(f"  Prompt: {prompt[:100]}...")

    try:
        image_b64 = generate_image(prompt)
        call_en('slide.slide', 'write', [[slide['id']], {
            'image_1920': image_b64,
        }])
        print(f"  Thumbnail uploaded ✓")
    except Exception as e:
        print(f"  ERROR: {e}")

    time.sleep(2)  # Rate limiting

print(f"\nDone! Verify: {ODOO_URL}/slides")
```

## Important Rules

1. Prompts ALWAYS in English — better image quality
2. NEVER request text in images — AI renders text poorly
3. Use `image_1920` field for direct base64 upload to slide.slide
4. Rate limit: sleep 2s between Gemini API calls
5. Skip quiz slides (slide_category == 'quiz') — they don't need thumbnails
6. Retry on failure with different model variants
7. Keep prompts under 200 words for best results
8. Gemini may return JPEG bytes with PNG mime_type — this is fine for Odoo, it accepts both
