# Generic HTML Mirror (live website, no source code)

When the user wants to migrate a website they don't own the source for — a legacy WordPress site, a designer's HTML mockup, a competitor's layout used as reference — use `wget` to pull a local copy.

## Prerequisites

```bash
which wget || brew install wget   # macOS
which wget || apt install wget    # Debian/Ubuntu
```

## The command

```bash
wget \
    --mirror \
    --convert-links \
    --adjust-extension \
    --page-requisites \
    --no-parent \
    --execute robots=off \
    --user-agent="Mozilla/5.0 (compatible; web-to-static/1.0)" \
    --wait=1 \
    --random-wait \
    --reject "*.php,*.aspx" \
    https://example.com/
```

**Flag breakdown:**

| Flag | Purpose |
|---|---|
| `--mirror` | Recursive + timestamps + infinite depth |
| `--convert-links` | Rewrites absolute URLs to relative paths |
| `--adjust-extension` | Adds `.html` to pages missing an extension |
| `--page-requisites` | Downloads CSS, JS, images referenced by each page |
| `--no-parent` | Don't climb above the given URL |
| `--execute robots=off` | Ignore robots.txt (be ethical about this) |
| `--user-agent` | Some sites block default wget UA |
| `--wait=1 --random-wait` | Rate limit — be polite |
| `--reject` | Skip server-side extensions |

Output lands in `./example.com/` with the original directory structure.

## Cleanup steps

### 1. Flatten

`wget` preserves the site's directory structure (`about/index.html`, `products/category/item.html`). Flatten to match the skill's target layout:

```bash
cd example.com/
find . -name "index.html" | while read f; do
    dir=$(dirname "$f")
    [ "$dir" = "." ] && continue
    new_name="${dir#./}.html"
    new_name="${new_name//\//-}"   # products/category → products-category
    mv "$f" "../flat/$new_name"
done
```

Manually review and rename to the final form:

- `./index.html` → `index.html`
- `./about/index.html` → `about.html`
- `./products/index.html` → `products.html`

### 2. Consolidate assets

```bash
# Collect all CSS into css/
find . -name "*.css" -exec cp {} ../flat/css/ \;

# Collect all JS
find . -name "*.js" -exec cp {} ../flat/js/ \;

# Collect all images
find . \( -name "*.jpg" -o -name "*.png" -o -name "*.svg" -o -name "*.webp" \) \
    -exec cp {} ../flat/img/ \;
```

De-duplicate based on file hash:

```bash
cd ../flat/img/
md5sum * | sort | awk '{ if (h[$1]) { print "DUPLICATE:", $2, "==", h[$1] } else { h[$1]=$2 } }'
```

### 3. Rewrite references in HTML

After flattening, the HTML still points at the old nested paths. Fix them:

```bash
cd ../flat/
# Example: fix all CSS links to point to css/
sed -i '' -E 's|href="[^"]*/([^/"]+\.css)"|href="css/\1"|g' *.html
# Example: fix all image sources
sed -i '' -E 's|src="[^"]*/([^/"]+\.(jpg|png|svg|webp))"|src="img/\1"|g' *.html
```

Use `sed -i ''` on macOS, `sed -i` on Linux. Verify with:

```bash
grep -oE '(href|src)="[^"]+"' *.html | sort -u
# Review — all paths should now be relative to the flat layout.
```

### 4. Strip tracking and analytics

```bash
# Google Analytics / GTM / Facebook Pixel / etc.
for f in *.html; do
    # Remove <script> blocks containing known tracking domains
    perl -i -0pe 's|<script[^>]*>.*?(googletagmanager|google-analytics|facebook\.net|hotjar|clarity\.ms).*?</script>||gs' "$f"
done
```

### 5. Remove WordPress / framework fingerprints

```bash
# Remove WordPress version meta
sed -i '' '/<meta name="generator" content="WordPress/d' *.html

# Remove emoji script injection
sed -i '' '/wp-emoji-release/d' *.html
```

### 6. Convert to editor-safe CSS

Most live websites ship bloated CSS with multi-value `box-shadow` and `transition` properties — the same editor-crashing patterns as Tailwind chains. Apply the same rewrite process as in `tailwind-rewrite.md`, section **"Apply editor-safe rules (CRITICAL)"**.

Unlike Tailwind, you don't need to rename classes — the CSS already uses semantic-ish names. Just fix the multi-value properties in place.

## Legal & ethical considerations

- **Only mirror sites the user owns or has permission to migrate.** Using this to clone a competitor's site is likely copyright infringement.
- **Check the site's Terms of Service** — some explicitly forbid scraping.
- **Respect the server** — the `--wait=1 --random-wait` is not optional. Remove it only if you own the server.
- **Never include tracking IDs, API keys, or user data** from the mirror in the static bundle. Strip them in Step 4 above.

## Limitations

- **Dynamic content** — anything loaded via client-side JS after page load (SPA routes, infinite scroll products, lazy-loaded sections) won't be in the mirror. Either use a headless browser approach (Puppeteer + `page.content()`) or reconstruct those sections manually.
- **Authentication** — sites behind a login require `--load-cookies` and a pre-exported cookies file.
- **CDN-hosted images** — some images may be on a different domain (`cdn.example.com`). Add `--span-hosts --domains=example.com,cdn.example.com` to mirror them.
- **Web fonts** — Google Fonts, Adobe Fonts, etc. loaded via `<link>` tags. These work fine in the mirror as long as the link stays intact.
