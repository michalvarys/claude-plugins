# Odoo 18 Python Patterns Reference

## Import Conventions

```python
# Standard library
import logging
from datetime import datetime, timedelta

# Odoo
from odoo import models, fields, api, _, Command
from odoo.exceptions import UserError, ValidationError, AccessError
from odoo.tools import float_compare, float_is_zero, format_date

_logger = logging.getLogger(__name__)
```

### Import Order

1. Standard library imports
2. Third-party imports (rare in Odoo)
3. Odoo framework imports
4. Odoo addons imports

---

## Model Class Structure

Follow this exact ordering of elements within a model class:

```python
class SaleDeliveryTracking(models.Model):
    # 1. Private attributes
    _name = 'sale.delivery.tracking'
    _description = 'Delivery Tracking'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date desc, id desc'
    _rec_name = 'name'
    _check_company_auto = True

    # 2. Default methods
    def _default_user(self):
        return self.env.user

    # 3. Field declarations (grouped logically)
    # --- Core fields ---
    name = fields.Char(string="Reference", required=True, copy=False,
                       readonly=True, default='New')
    active = fields.Boolean(default=True)
    company_id = fields.Many2one('res.company', required=True,
                                  default=lambda self: self.env.company)
    currency_id = fields.Many2one('res.currency', related='company_id.currency_id')

    # --- Business fields ---
    partner_id = fields.Many2one('res.partner', string="Customer",
                                  required=True, tracking=True,
                                  check_company=True)
    date = fields.Date(default=fields.Date.today)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('cancel', 'Cancelled'),
    ], default='draft', required=True, tracking=True)

    # --- Relational fields ---
    order_id = fields.Many2one('sale.order', string="Sale Order",
                                ondelete='cascade')
    line_ids = fields.One2many('sale.delivery.tracking.line', 'tracking_id',
                                string="Lines")

    # --- Computed fields ---
    total_weight = fields.Float(compute='_compute_total_weight', store=True)
    line_count = fields.Integer(compute='_compute_line_count')

    # 4. Compute methods
    @api.depends('line_ids.weight')
    def _compute_total_weight(self):
        for record in self:
            record.total_weight = sum(record.line_ids.mapped('weight'))

    def _compute_line_count(self):
        for record in self:
            record.line_count = len(record.line_ids)

    # 5. Constrains and onchange
    @api.constrains('date')
    def _check_date(self):
        for record in self:
            if record.date and record.date > fields.Date.today():
                raise ValidationError(_("Date cannot be in the future."))

    @api.onchange('partner_id')
    def _onchange_partner_id(self):
        if self.partner_id:
            self.delivery_address = self.partner_id.contact_address

    # 6. CRUD methods
    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', 'New') == 'New':
                vals['name'] = self.env['ir.sequence'].next_by_code(
                    'sale.delivery.tracking') or 'New'
        return super().create(vals_list)

    def write(self, vals):
        # Pre-write validation
        if 'state' in vals and vals['state'] == 'cancel':
            for record in self:
                if record.state == 'delivered':
                    raise UserError(_("Cannot cancel a delivered tracking."))
        return super().write(vals)

    def unlink(self):
        for record in self:
            if record.state not in ('draft', 'cancel'):
                raise UserError(_("You can only delete draft or cancelled records."))
        return super().unlink()

    def copy(self, default=None):
        default = dict(default or {})
        default['name'] = 'New'
        return super().copy(default)

    # 7. Action methods
    def action_confirm(self):
        for record in self:
            if record.state != 'draft':
                raise UserError(_("Only draft records can be confirmed."))
            record.state = 'confirmed'

    def action_cancel(self):
        self.write({'state': 'cancel'})

    def action_reset_to_draft(self):
        self.write({'state': 'draft'})

    # 8. Business methods
    def _prepare_invoice_values(self):
        """Prepare values for invoice creation."""
        self.ensure_one()
        return {
            'partner_id': self.partner_id.id,
            'invoice_date': fields.Date.today(),
            'invoice_line_ids': [
                Command.create({
                    'name': line.name,
                    'quantity': line.quantity,
                    'price_unit': line.price_unit,
                }) for line in self.line_ids
            ],
        }
```

---

## Sequence Setup (Data XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <data noupdate="1">
        <record id="seq_delivery_tracking" model="ir.sequence">
            <field name="name">Delivery Tracking</field>
            <field name="code">sale.delivery.tracking</field>
            <field name="prefix">DT/%(year)s/</field>
            <field name="padding">5</field>
            <field name="company_id" eval="False"/>
        </record>
    </data>
</odoo>
```

---

## Scheduled Actions (Cron)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <data noupdate="1">
        <record id="cron_check_overdue" model="ir.cron">
            <field name="name">Check Overdue Deliveries</field>
            <field name="model_id" ref="model_sale_delivery_tracking"/>
            <field name="state">code</field>
            <field name="code">model._cron_check_overdue()</field>
            <field name="interval_number">1</field>
            <field name="interval_type">days</field>
            <field name="numbercall">-1</field>
            <field name="active">True</field>
        </record>
    </data>
</odoo>
```

Python method:
```python
@api.model
def _cron_check_overdue(self):
    """Called by cron to check overdue deliveries."""
    overdue = self.search([
        ('state', '=', 'in_transit'),
        ('expected_date', '<', fields.Date.today()),
    ])
    for record in overdue:
        record.message_post(
            body=_("This delivery is overdue!"),
            message_type='notification',
        )
```

---

## Report (QWeb PDF)

### Report action XML

```xml
<record id="action_report_delivery" model="ir.actions.report">
    <field name="name">Delivery Report</field>
    <field name="model">sale.delivery.tracking</field>
    <field name="report_type">qweb-pdf</field>
    <field name="report_name">module_name.report_delivery_template</field>
    <field name="report_file">module_name.report_delivery_template</field>
    <field name="binding_model_id" ref="model_sale_delivery_tracking"/>
    <field name="binding_type">report</field>
</record>
```

### Report QWeb template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<odoo>
    <template id="report_delivery_template">
        <t t-call="web.html_container">
            <t t-foreach="docs" t-as="doc">
                <t t-call="web.external_layout">
                    <div class="page">
                        <h2>Delivery: <t t-out="doc.name"/></h2>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th class="text-end">Quantity</th>
                                    <th class="text-end">Weight</th>
                                </tr>
                            </thead>
                            <tbody>
                                <t t-foreach="doc.line_ids" t-as="line">
                                    <tr>
                                        <td><t t-out="line.product_id.name"/></td>
                                        <td class="text-end"><t t-out="line.quantity"/></td>
                                        <td class="text-end"><t t-out="line.weight"/></td>
                                    </tr>
                                </t>
                            </tbody>
                        </table>
                    </div>
                </t>
            </t>
        </t>
    </template>
</odoo>
```

---

## Common ORM Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `search(domain, limit, order)` | Find records | Recordset |
| `search_count(domain)` | Count matching records | Integer |
| `browse(ids)` | Get records by IDs | Recordset |
| `read(['field1', 'field2'])` | Read specific fields | List of dicts |
| `search_read(domain, fields, limit)` | Search + read combined | List of dicts |
| `read_group(domain, fields, groupby)` | Aggregated read | List of dicts |
| `create(vals)` / `create(vals_list)` | Create records | Recordset |
| `write(vals)` | Update records | Boolean |
| `unlink()` | Delete records | Boolean |
| `copy(default)` | Duplicate record | Recordset |
| `exists()` | Filter existing records | Recordset |
| `filtered(func)` | Filter by function | Recordset |
| `mapped(field)` | Extract field values | List or Recordset |
| `sorted(key, reverse)` | Sort recordset | Recordset |
| `ensure_one()` | Assert single record | Self (or raises) |
| `with_context(**ctx)` | Add context values | Recordset |
| `sudo()` | Bypass access rights | Recordset |
| `with_company(company)` | Set active company | Recordset |

---

## Domain Syntax

```python
# Simple comparisons
[('state', '=', 'draft')]
[('amount', '>', 100)]
[('name', 'ilike', 'search term')]

# AND (implicit — consecutive tuples)
[('state', '=', 'confirmed'), ('date', '>=', '2026-01-01')]

# OR (explicit '|' prefix operator)
['|', ('state', '=', 'draft'), ('state', '=', 'confirmed')]

# NOT
['!', ('active', '=', True)]

# Complex: (state=draft OR state=confirmed) AND amount > 100
['|', ('state', '=', 'draft'), ('state', '=', 'confirmed'),
 ('amount', '>', 100)]

# Relational traversal (dot notation)
[('partner_id.country_id.code', '=', 'CZ')]

# Child of (hierarchical)
[('category_id', 'child_of', parent_id)]
```

### Domain Operators

| Operator | Description |
|----------|-------------|
| `=`, `!=` | Equal, not equal |
| `>`, `>=`, `<`, `<=` | Numeric/date comparisons |
| `like`, `ilike` | Pattern match (case-sensitive / insensitive) |
| `=like`, `=ilike` | SQL LIKE with `%` and `_` patterns |
| `in`, `not in` | List membership |
| `child_of`, `parent_of` | Hierarchical (requires `_parent_name`) |

---

## Error Handling

```python
from odoo.exceptions import UserError, ValidationError, AccessError

# UserError — user-facing business error (shown as warning dialog)
raise UserError(_("Cannot confirm: no lines on this order."))

# ValidationError — constraint violation (shown as error)
raise ValidationError(_("End date must be after start date."))

# AccessError — permission error
raise AccessError(_("You don't have permission to perform this action."))
```

### Translation

Always wrap user-facing strings in `_()`:

```python
from odoo import _

# Simple string
raise UserError(_("Something went wrong."))

# With format parameters (use %s, not f-strings)
raise UserError(_("Order %s cannot be cancelled.", order.name))

# Lazy translation for field strings is automatic — just use string parameter
name = fields.Char(string="Name")  # automatically translatable
```
