---
name: odoo-marketplace-module
description: |
  Use when creating a paid Odoo 18 module for the Odoo Apps Marketplace. Covers manifest with price/currency, static/description (index.html, cover.png 898x542, icon.png, screenshots), delivery_type integration via selection_add, view inheritance pitfalls (xpath targets that differ between Odoo versions), Docker-based testing workflow, and marketplace listing materials. Trigger on: "marketplace module", "paid module", "sell on odoo", "odoo apps store", "shipping connector", "delivery carrier module", "connector module", "placeny modul", "marketplace", "prodej modulu".
---

# Odoo 18 Marketplace Module

Create production-ready, paid Odoo 18 modules for the Odoo Apps Marketplace. This skill encodes hard-won lessons from building real marketplace modules.

Before writing any code, read `references/marketplace-manifest.md` and `references/view-inheritance-pitfalls.md` in this skill's directory.

## Core Principles

1. **Test in Docker before declaring done** - install the module, verify all views load, test API calls
2. **Never assume xpath targets** - always verify the actual XML structure of the parent view in your Odoo version
3. **Marketplace materials are not optional** - cover.png, icon.png, index.html, docs.html drive sales
4. **One connector per carrier** - separate modules sell better than monolithic bundles

## Module Creation Workflow

### Step 1: Define the module

Clarify before writing any code:
- **Business value** - what problem does it solve for the buyer?
- **Technical name** - prefix with brand: `vs_shipping_packeta`, `vs_invoice_qr_payment`
- **Price point** - typical marketplace prices: 49-149 EUR
- **Dependencies** - use the most specific dependency (e.g. `stock_delivery` not `delivery` + `stock`)
- **API integration** - which external API? REST/SOAP? Auth method?

### Step 2: Create module structure

```
vs_module_name/
  __init__.py
  __manifest__.py                    # With price, currency, marketplace fields
  models/
    __init__.py
    primary_model.py                 # Core integration logic
    res_config_settings.py           # Company-level settings
  views/
    primary_model_views.xml          # Inherited views
    res_config_settings_views.xml    # Settings UI
  wizard/                            # Optional: bulk operations
  security/
    ir.model.access.csv
  static/
    description/
      index.html                     # SEO-optimized feature page (REQUIRED)
      docs.html                      # Setup documentation
      cover.png                      # 898x542px marketplace banner (REQUIRED)
      icon.png                       # 256x256px or 128x128px module icon
      screenshot_*.png               # Feature screenshots
  data/                              # Default data if needed
```

### Step 3: Write the manifest

Read `references/marketplace-manifest.md` for the complete template. Critical marketplace-specific fields:

```python
{
    'price': 49.00,
    'currency': 'EUR',
    'support': 'info@michalvarys.eu',
    'images': ['static/description/cover.png'],
    'license': 'LGPL-3',
}
```

### Step 4: Implement, test, create marketplace materials

1. Write models and views
2. **Test in Docker** (install, verify views, test API)
3. Fix all view inheritance errors (see pitfalls reference)
4. Create marketplace materials (index.html, images)

## Delivery Carrier Integration Pattern (Odoo 18)

When creating a shipping connector module, follow this pattern:

### delivery_type Selection Extension

```python
class DeliveryCarrier(models.Model):
    _inherit = 'delivery.carrier'

    delivery_type = fields.Selection(
        selection_add=[('mycarrier', 'My Carrier Name')],
        ondelete={'mycarrier': 'set default'},
    )
```

### Required Methods

Odoo calls these methods based on `delivery_type` prefix:

```python
def mycarrier_rate_shipment(self, order):
    """Return shipping cost estimate."""
    return {
        'success': True,
        'price': self.product_id.list_price or 0.0,
        'error_message': False,
        'warning_message': False,
    }

def mycarrier_send_shipping(self, pickings):
    """Create shipment with carrier API. Return tracking numbers."""
    res = []
    for picking in pickings:
        tracking = self._mycarrier_create_shipment(picking)
        picking.write({'carrier_tracking_ref': tracking})
        res.append({
            'exact_price': self.product_id.list_price or 0.0,
            'tracking_number': tracking,
        })
    return res

def mycarrier_get_tracking_link(self, picking):
    """Return tracking URL."""
    if picking.carrier_tracking_ref:
        return 'https://track.mycarrier.com/?id=%s' % picking.carrier_tracking_ref
    return False

def mycarrier_cancel_shipment(self, pickings):
    """Cancel shipment if supported."""
    raise UserError(_("Cancellation not supported. Cancel in carrier portal."))
```

### Pickup Points Integration (Odoo 18 built-in framework)

To enable pickup point selection in website checkout:

```python
# Boolean field - naming convention: {delivery_type}_use_locations
mycarrier_use_locations = fields.Boolean(
    string="Pickup Points",
    default=True,
)

# Method - naming convention: _{delivery_type}_get_close_locations
def _mycarrier_get_close_locations(self, partner_address, **kwargs):
    """Return list of nearby pickup locations.

    Called automatically by Odoo checkout when mycarrier_use_locations=True.
    """
    # Fetch locations from carrier API
    # Sort by distance or ZIP
    # Return list of dicts:
    return [{
        'id': '123',
        'name': 'Point Name',
        'street': 'Street 1',
        'city': 'City',
        'zip_code': '11000',
        'country_code': 'CZ',
        'latitude': 50.08,
        'longitude': 14.42,
        'opening_hours': {
            '0': ['08:00-18:00'],  # Monday
            '1': ['08:00-18:00'],  # Tuesday
            # ...
            '6': [],               # Sunday (closed)
        },
    }]
```

**IMPORTANT:** `geo_localize()` requires `base_geolocalize` module. Don't call it unconditionally - use `hasattr(partner_address, 'geo_localize')` check, or sort by ZIP code as fallback.

## Marketplace Materials (static/description/)

### cover.png - 898x542px

The marketplace banner. Must be exactly 898x542 pixels. Use brand colors, module name, and a visual that communicates the feature (e.g. shipping label, carrier logo).

Generate with a tool or design manually. This is the first thing buyers see.

### icon.png - 256x256px

Module icon shown in the Apps list. Use a simple, recognizable symbol on a colored background.

### index.html - SEO-Optimized Feature Page

This is the main sales page on the marketplace. Structure it for both humans and search engines.

Read `references/marketplace-index-html.md` for the complete template with SEO patterns.

Key principles:
- Use `oe_container`, `oe_row`, `oe_spaced`, `oe_slogan` CSS classes
- Alternate `oe_container` and `oe_container oe_dark` sections
- Feature grid: 3 columns with emoji icons using `oe_span4`
- Include screenshots between feature sections
- End with setup steps and support contact
- Use keywords naturally: module name, Odoo 18, carrier name, "integration"

### docs.html - Setup Documentation

Step-by-step setup guide. Include:
- Prerequisites (API credentials, account setup)
- Installation steps
- Configuration walkthrough with field descriptions
- Troubleshooting common issues

## Common Mistakes

Read `references/view-inheritance-pitfalls.md` for the full list. Top issues:

### 1. Wrong xpath target in inherited views

Odoo 18 view structure differs from earlier versions. **Always verify the parent view XML.**

| What you expect | What Odoo 18 actually has |
|---|---|
| `//group[@name='carrier_options']` in delivery carrier form | `//group[@name='delivery_details']` |
| `carrier_tracking_ref` in `stock.view_picking_form` | Field is in `stock_delivery.view_picking_withcarrier_out_form` |
| `//app[@name='stock']` in settings | Use `//block[@name='shipping_setting_container']` with `inherit_id` ref `stock.res_config_settings_view_form` |

### 2. Wrong dependency

```python
# WRONG - these are separate modules, views may not exist
'depends': ['delivery', 'stock']

# RIGHT - stock_delivery is the bridge module with carrier views
'depends': ['stock_delivery']
```

### 3. stat buttons in header vs button_box

```xml
<!-- WRONG - buttons in header look bad -->
<xpath expr="//header" position="inside">
    <button name="action_print_label" .../>
</xpath>

<!-- RIGHT - use button_box for stat-style buttons -->
<xpath expr="//div[@name='button_box']" position="inside">
    <button name="action_print_label" class="oe_stat_button" icon="fa-print" .../>
</xpath>
```

### 4. Missing geo_localize guard

```python
# WRONG - crashes if base_geolocalize not installed
partner_address.geo_localize()

# RIGHT - conditional call
if hasattr(partner_address, 'geo_localize'):
    partner_address.geo_localize()
```

## Docker Testing Workflow

**Never skip this.** Every module must be tested in Docker before declaring done.

```bash
# 1. Mount module in docker-compose.yml
volumes:
  - ./vs_module_name:/app/varyshop/vs_module_name

# 2. Install/upgrade via python one-liner
docker exec CONTAINER python3 -c "
import odoo
from odoo.tools import config
config.parse_config(['-d', 'DB', '--addons-path=...', '-r', 'USER', '-w', 'PASS',
                     '--db_host', 'DB_HOST', '--db_port', '5432', '--no-http',
                     '-i', 'vs_module_name'])  # or -u for upgrade
odoo.modules.initialize_sys_path()
from odoo.api import Environment
registry = odoo.modules.registry.Registry('DB')
with registry.cursor() as cr:
    env = Environment(cr, odoo.SUPERUSER_ID, {})
    # Test queries here
"

# 3. Verify in browser
# - Login and navigate to the module's views
# - Check all xpath targets resolved (no blank forms)
# - Test API integration with real or test credentials
```

### Testing checklist

- [ ] Module installs without errors
- [ ] All views render correctly (form, list, settings)
- [ ] All fields are visible and editable
- [ ] API authentication works (even if account not approved for operations)
- [ ] XML builder produces correct API payload
- [ ] API response parsing handles both success and error cases
- [ ] Pickup points load and sort correctly (if applicable)

## Quick Reference: Manifest Fields

| Field | Required | Example |
|---|---|---|
| `name` | Yes | `'Shipping Connector - Carrier Name'` |
| `version` | Yes | `'18.0.1.0.0'` |
| `category` | Yes | `'Inventory/Delivery'` |
| `summary` | Yes | One-line value proposition |
| `author` | Yes | `'Michal Varys'` |
| `website` | Yes | `'https://michalvarys.eu'` |
| `support` | Yes | `'info@michalvarys.eu'` |
| `license` | Yes | `'LGPL-3'` |
| `price` | Yes | `49.00` |
| `currency` | Yes | `'EUR'` |
| `depends` | Yes | `['stock_delivery']` |
| `images` | Yes | `['static/description/cover.png']` |
| `installable` | Yes | `True` |
| `application` | No | `False` for connectors |
| `auto_install` | No | `False` |
| `external_dependencies` | If needed | `{'python': ['requests']}` |
