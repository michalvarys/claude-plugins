# Odoo 18 Module Structure Reference

## Complete Directory Layout

A full-featured Odoo 18 module with all possible components:

```
module_name/
├── __init__.py                    # Root init — imports models, controllers, wizards
├── __manifest__.py                # Module manifest (required)
├── models/
│   ├── __init__.py                # Imports all model files
│   ├── model_one.py
│   └── model_two.py
├── views/
│   ├── model_one_views.xml        # Form, list, search views
│   ├── model_two_views.xml
│   ├── menu.xml                   # Menu items and actions
│   └── templates.xml              # QWeb templates (if needed)
├── controllers/
│   ├── __init__.py
│   └── main.py                    # HTTP controllers
├── wizards/
│   ├── __init__.py
│   ├── wizard_name.py
│   └── wizard_name_views.xml
├── security/
│   ├── ir.model.access.csv        # Access control list
│   └── security_rules.xml         # Record rules (optional)
├── data/
│   ├── data.xml                   # Default data loaded on install
│   └── cron.xml                   # Scheduled actions (optional)
├── demo/
│   └── demo.xml                   # Demo data (only in demo mode)
├── report/
│   ├── report_templates.xml       # QWeb report templates
│   └── report_actions.xml         # Report action definitions
├── static/
│   ├── description/
│   │   ├── icon.png               # Module icon (128x128 or 256x256)
│   │   └── index.html             # Module description page (optional)
│   └── src/
│       ├── js/                    # JavaScript (OWL components)
│       ├── css/                   # Stylesheets
│       └── xml/                   # Client-side QWeb templates
├── i18n/
│   └── cs.po                      # Czech translations (or other language)
└── tests/
    ├── __init__.py
    └── test_model_one.py
```

## __init__.py Patterns

### Root __init__.py
```python
from . import models
from . import controllers  # only if controllers/ exists
from . import wizards      # only if wizards/ exists
```

### models/__init__.py
```python
from . import model_one
from . import model_two
```

### controllers/__init__.py
```python
from . import main
```

### wizards/__init__.py
```python
from . import wizard_name
```

## __manifest__.py Complete Template

```python
{
    'name': 'Module Display Name',
    'version': '18.0.1.0.0',
    'category': 'Category',
    'summary': 'Brief one-line summary of module purpose',
    'description': """
Module Display Name
===================

Detailed description of what this module does.

Features:
- Feature one
- Feature two
- Feature three
    """,
    'author': 'Author Name',
    'website': 'https://example.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        # List all dependencies — both direct and indirect if needed
    ],
    'data': [
        # Load order matters! Security first, then views, then data.
        'security/ir.model.access.csv',
        'security/security_rules.xml',  # if exists
        'wizards/wizard_name_views.xml',  # if exists
        'views/model_one_views.xml',
        'views/model_two_views.xml',
        'views/menu.xml',
        'data/data.xml',  # if exists
        'report/report_actions.xml',  # if exists
        'report/report_templates.xml',  # if exists
    ],
    'demo': [
        'demo/demo.xml',  # if exists
    ],
    'assets': {
        'web.assets_backend': [
            'module_name/static/src/js/**/*',
            'module_name/static/src/css/**/*',
            'module_name/static/src/xml/**/*',
        ],
    },
    'installable': True,
    'application': False,  # True if it's a standalone app with its own menu
    'auto_install': False,  # True for bridge/glue modules
}
```

### Category Options

Common Odoo 18 categories:
- `Sales` / `Sales/CRM`
- `Inventory` / `Inventory/Logistics`
- `Accounting` / `Accounting/Invoicing`
- `Website` / `Website/eCommerce`
- `Manufacturing`
- `Human Resources` / `Human Resources/Recruitment`
- `Project` / `Project/Scrum`
- `Marketing`
- `Productivity`
- `Technical`
- `Hidden` (for technical/bridge modules)

### License Options

- `LGPL-3` — standard for community modules
- `OEEL-1` — Odoo Enterprise
- `GPL-3` — strong copyleft
- `AGPL-3` — network copyleft

## Data File Load Order

The `data` list in manifest determines load order. **This order is critical:**

1. `security/ir.model.access.csv` — access rights (needed before views reference models)
2. `security/security_rules.xml` — record rules
3. `wizards/*_views.xml` — wizard views (before main views in case menus reference them)
4. `views/*_views.xml` — model views
5. `views/menu.xml` — menu items and window actions (after views they reference)
6. `data/*.xml` — default data records
7. `data/cron.xml` — scheduled actions
8. `report/*.xml` — report definitions

## Security CSV Format

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
```

### Common Security Groups

| Group XML ID | Description |
|-------------|-------------|
| `base.group_user` | Internal User (everyone) |
| `base.group_system` | Settings / Administrator |
| `base.group_erp_manager` | Access Rights |
| `base.group_no_one` | Technical features |
| `sales_team.group_sale_salesman` | Sales / User |
| `sales_team.group_sale_manager` | Sales / Administrator |
| `account.group_account_user` | Accounting / Billing |
| `account.group_account_manager` | Accounting / Adviser |
| `stock.group_stock_user` | Inventory / User |
| `stock.group_stock_manager` | Inventory / Administrator |
| `website.group_website_designer` | Website / Designer |
| `website.group_website_restricted_editor` | Website / Restricted Editor |

### Record Rules (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <data noupdate="1">
        <record id="rule_model_personal" model="ir.rule">
            <field name="name">Personal Records Only</field>
            <field name="model_id" ref="model_module_name_model_name"/>
            <field name="domain_force">[('user_id', '=', user.id)]</field>
            <field name="groups" eval="[(4, ref('base.group_user'))]"/>
            <field name="perm_read" eval="True"/>
            <field name="perm_write" eval="True"/>
            <field name="perm_create" eval="True"/>
            <field name="perm_unlink" eval="True"/>
        </record>
    </data>
</odoo>
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Module technical name | `snake_case` | `sale_delivery_tracking` |
| Model `_name` | `dot.separated` | `sale.delivery.tracking` |
| Model class name | `PascalCase` | `SaleDeliveryTracking` |
| Field name | `snake_case` | `delivery_date` |
| View XML ID | `view_{model}_{type}` | `view_delivery_tracking_form` |
| Action XML ID | `action_{model}` | `action_delivery_tracking` |
| Menu XML ID | `menu_{model}` or `menu_{section}` | `menu_delivery_tracking` |
| Security CSV ID | `access_{model}_{group}` | `access_delivery_tracking_user` |
| Wizard model name | `{model}.wizard_name` | `sale.delivery.tracking.import` |

## Extension Module Pattern

When extending an existing model from another module:

```python
# models/sale_order.py
from odoo import models, fields, api

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    custom_field = fields.Char(string="Custom Field")
    tracking_ids = fields.One2many('sale.delivery.tracking', 'order_id', string="Tracking")

    def action_custom_method(self):
        """Custom business logic."""
        for order in self:
            # logic here
            pass
```

Extension views use `inherit_id`:
```xml
<record id="view_sale_order_form_inherit_tracking" model="ir.ui.view">
    <field name="name">sale.order.form.inherit.tracking</field>
    <field name="model">sale.order</field>
    <field name="inherit_id" ref="sale.view_order_form"/>
    <field name="arch" type="xml">
        <xpath expr="//field[@name='partner_id']" position="after">
            <field name="custom_field"/>
        </xpath>
    </field>
</record>
```
