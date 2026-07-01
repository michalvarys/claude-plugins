# Odoo 18 Marketplace Manifest Reference

## Complete Manifest Template

```python
{
    'name': 'Module Display Name',
    'version': '18.0.1.0.0',
    'category': 'Inventory/Delivery',  # Must match Odoo category taxonomy
    'summary': 'One-line value proposition for the marketplace listing',
    'description': (
        'Extended description. Keep it concise. '
        'The real sales copy goes in static/description/index.html.'
    ),
    'author': 'Michal Varys',
    'website': 'https://michalvarys.eu',
    'support': 'info@michalvarys.eu',
    'license': 'LGPL-3',
    'price': 49.00,
    'currency': 'EUR',
    'depends': [
        'stock_delivery',  # Use most specific dependency
    ],
    'external_dependencies': {
        'python': ['requests'],  # List PyPI packages needed
    },
    'data': [
        # Load order matters: security -> views -> data
        'security/ir.model.access.csv',
        'views/primary_model_views.xml',
        'views/stock_picking_views.xml',
        'views/res_config_settings_views.xml',
        'wizard/wizard_views.xml',
    ],
    'images': ['static/description/cover.png'],
    'installable': True,
    'application': False,
    'auto_install': False,
}
```

## Version Numbering

Format: `ODOO_VERSION.MAJOR.MINOR.PATCH`

- `18.0.1.0.0` - initial release for Odoo 18
- `18.0.1.1.0` - minor feature addition
- `18.0.1.1.1` - bugfix
- `18.0.2.0.0` - major update

## Price Strategy

| Module type | Suggested price |
|---|---|
| Simple connector (1 carrier) | 49 EUR |
| Complex connector (multi-service) | 79-99 EUR |
| Business logic module | 49-149 EUR |
| Full application | 99-249 EUR |

Separate modules per carrier sell better than one monolith - 5 x 49 EUR > 1 x 149 EUR.

## Category Taxonomy

Common marketplace categories:
- `Inventory/Delivery` - shipping connectors
- `Accounting/Invoicing` - invoice-related modules
- `Sales` - sales process modules
- `Website/eCommerce` - webshop features
- `Productivity` - general tools
- `Human Resources` - HR modules

## Marketplace Submission Requirements

1. Module must install cleanly on a fresh Odoo 18 database
2. `cover.png` must be 898x542px
3. `icon.png` recommended (256x256 or 128x128)
4. `index.html` must describe features clearly
5. No hardcoded credentials or test data in production code
6. License must be `LGPL-3` for community modules
7. All strings must use `_()` for i18n
8. No `print()` statements - use `_logger`
