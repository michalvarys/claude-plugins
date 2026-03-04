---
name: upload-assets
description: >
  Upload images and assets to Odoo 18 for use in QWeb templates and email campaigns via XML-RPC API. Use this skill when the user asks to
  "upload image to Odoo", "add asset to website", "upload file for QWeb",
  "nahraj obrázek do Odoo", "přidej asset na web", "nahraj soubor pro šablonu",
  "upload logo", "upload banner", "nahraj logo", "nahraj banner",
  or any request involving uploading files/images to Odoo 18 for use in templates.
---

# Odoo 18 Asset Upload (ir.attachment)

Upload images and files to Odoo 18 for use in QWeb pages and email templates.

Before executing any API calls, read the shared reference at `${CLAUDE_PLUGIN_ROOT}/references/xmlrpc-api.md`.

## Configuration

Same environment variables: `ODOO_URL`, `ODOO_DB`, `ODOO_API_KEY` (UID se zjistí automaticky)

## Upload Image from File

```python
import base64

with open('image.png', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

attachment_id = models.execute_kw(DB, UID, KEY, 'ir.attachment', 'create', [{
    'name': 'descriptive-name.png',
    'type': 'binary',
    'datas': image_data,
    'res_model': False,  # global attachment
    'res_id': 0,
    'public': True,
    'mimetype': 'image/png',
}])
```

## Upload Image from URL

```python
import urllib.request
import base64

url = 'https://example.com/image.jpg'
response = urllib.request.urlopen(url)
image_data = base64.b64encode(response.read()).decode('utf-8')

attachment_id = models.execute_kw(DB, UID, KEY, 'ir.attachment', 'create', [{
    'name': 'image-from-url.jpg',
    'type': 'binary',
    'datas': image_data,
    'res_model': False,
    'res_id': 0,
    'public': True,
    'mimetype': 'image/jpeg',
}])
```

## Get Image URL

After upload, the image is accessible at:
```
{ODOO_URL}/web/image/{attachment_id}
```

For specific sizes:
```
{ODOO_URL}/web/image/{attachment_id}/300x200
```

## Usage in QWeb Templates

```xml
<img src="/web/image/{attachment_id}" alt="Description" class="img-fluid"/>
```

## Usage in Email Templates

```html
<img src="https://michalvarys.eu/web/image/{attachment_id}" alt="Description" style="max-width: 100%;"/>
```

Note: In email templates, always use the full absolute URL since emails are viewed outside Odoo.

## MIME Types Reference

| Extension | MIME Type |
|-----------|-----------|
| .png | image/png |
| .jpg/.jpeg | image/jpeg |
| .gif | image/gif |
| .svg | image/svg+xml |
| .webp | image/webp |
| .pdf | application/pdf |
| .ico | image/x-icon |

## Search Existing Assets

```python
attachments = models.execute_kw(DB, UID, KEY, 'ir.attachment', 'search_read', [
    [['public', '=', True], ['mimetype', 'like', 'image%']]
], {'fields': ['name', 'mimetype', 'file_size', 'create_date'], 'limit': 50})
```

## Workflow

1. Ask user for the image/file to upload (local path or URL)
2. Read and base64-encode the file
3. Create ir.attachment with public=True
4. Return the Odoo URL for the asset
5. Suggest how to use it in QWeb or email templates
