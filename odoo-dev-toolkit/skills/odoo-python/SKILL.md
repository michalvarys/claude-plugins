---
name: odoo-python
description: |
  Write Odoo 18 Python code — models, fields, methods, controllers, wizards, computed fields, constraints, and API decorators. Use this skill when the user wants to write or modify Odoo Python code. Trigger on: "model", "controller", "wizard", "computed field", "onchange", "constraint", "Odoo Python", "API endpoint", "Odoo method", "business logic", "napsat model", "vytvořit model", "Odoo kód", "Python pro Odoo", "kontroler", "wizard", "průvodce", "vypočítané pole", "business logika", "Odoo API".
version: 0.1.0
---

# Odoo 18 Python Patterns

Write production-ready Odoo 18 Python code for models, controllers, wizards, and business logic. Every piece of code follows Odoo 18 conventions and PEP 8.

Read `references/python-patterns.md` for detailed code patterns before writing.

## Core Principles

### 1. Odoo 18 ORM

Use the latest ORM patterns:
- `Command` constants for One2many/Many2many writes (not tuples)
- Expression-based `invisible`/`readonly`/`required` in views (no `attrs` dict)
- `@api.depends` for computed fields, `@api.onchange` sparingly
- `@api.constrains` for validation

### 2. Security-conscious

Always consider:
- `sudo()` only when explicitly needed, with clear comments why
- `check_access_rights` / `check_access_rule` when bypassing ORM
- SQL injection prevention — never use string formatting for queries
- CSRF protection in controllers

### 3. Performance-aware

- Avoid `browse` in loops — use `search` + batch processing
- Use `read_group` for aggregations instead of reading all records
- Prefetch related fields with correct `fields` parameter in `search_read`
- Use `with_context(prefetch_fields=False)` for large batch operations

## Model Patterns

### New Model

```python
from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class ModelName(models.Model):
    _name = 'module.model.name'
    _description = 'Human Readable Name'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date desc, id desc'
    _rec_name = 'name'

    name = fields.Char(string="Name", required=True, tracking=True)
    active = fields.Boolean(default=True)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
        ('cancel', 'Cancelled'),
    ], string="Status", default='draft', required=True, tracking=True)
    # ... more fields
```

### Extending Existing Model

```python
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    custom_field = fields.Char(string="Custom Field")

    def action_confirm(self):
        """Override to add custom logic on confirmation."""
        res = super().action_confirm()
        for order in self:
            # custom logic
            pass
        return res
```

### Transient Model (Wizard)

```python
class ModelWizard(models.TransientModel):
    _name = 'module.model.wizard'
    _description = 'Wizard Description'

    # Wizard fields
    date_from = fields.Date(required=True, default=fields.Date.today)
    partner_id = fields.Many2one('res.partner', required=True)

    def action_process(self):
        """Main wizard action."""
        self.ensure_one()
        # process logic
        return {'type': 'ir.actions.act_window_close'}
```

## Field Types Reference

| Field | Python | Common Parameters |
|-------|--------|------------------|
| `Char` | `fields.Char()` | `size`, `trim`, `translate` |
| `Text` | `fields.Text()` | `translate` |
| `Html` | `fields.Html()` | `sanitize`, `translate` |
| `Integer` | `fields.Integer()` | `group_operator` |
| `Float` | `fields.Float()` | `digits`, `group_operator` |
| `Monetary` | `fields.Monetary()` | `currency_field` (default: `currency_id`) |
| `Boolean` | `fields.Boolean()` | |
| `Date` | `fields.Date()` | |
| `Datetime` | `fields.Datetime()` | |
| `Selection` | `fields.Selection()` | `selection` (list of tuples) |
| `Many2one` | `fields.Many2one()` | `comodel_name`, `ondelete`, `domain` |
| `One2many` | `fields.One2many()` | `comodel_name`, `inverse_name` |
| `Many2many` | `fields.Many2many()` | `comodel_name`, `relation`, `column1`, `column2` |
| `Binary` | `fields.Binary()` | `attachment` |
| `Image` | `fields.Image()` | `max_width`, `max_height` |

### Common Field Parameters

```python
fields.Char(
    string="Display Label",       # UI label
    required=True,                # mandatory
    readonly=True,                # read-only
    index=True,                   # database index
    default="value",              # static default
    default=lambda self: ...,     # dynamic default
    help="Tooltip text",          # help tooltip
    tracking=True,                # track changes in chatter
    copy=False,                   # don't copy on duplicate
    groups="base.group_system",   # field-level access
    company_dependent=True,       # multi-company field
    translate=True,               # translatable
)
```

## Computed Fields

```python
amount_total = fields.Float(
    string="Total",
    compute='_compute_amount_total',
    store=True,        # stored = updated on dependency change
    readonly=True,
)

@api.depends('line_ids.subtotal', 'discount')
def _compute_amount_total(self):
    for record in self:
        record.amount_total = sum(record.line_ids.mapped('subtotal')) - record.discount
```

### Inverse (editable computed field)

```python
name_display = fields.Char(compute='_compute_name_display', inverse='_inverse_name_display')

def _compute_name_display(self):
    for rec in self:
        rec.name_display = f"{rec.first_name} {rec.last_name}"

def _inverse_name_display(self):
    for rec in self:
        parts = (rec.name_display or '').split(' ', 1)
        rec.first_name = parts[0]
        rec.last_name = parts[1] if len(parts) > 1 else ''
```

## Controller Pattern

```python
from odoo import http
from odoo.http import request


class CustomController(http.Controller):

    @http.route('/custom/endpoint', type='http', auth='user', website=True)
    def custom_page(self, **kwargs):
        """Render a website page."""
        values = {
            'records': request.env['model.name'].search([]),
        }
        return request.render('module_name.template_name', values)

    @http.route('/api/custom', type='json', auth='user', methods=['POST'])
    def api_endpoint(self, **kwargs):
        """JSON API endpoint."""
        data = request.jsonrequest
        # process data
        return {'status': 'ok', 'result': ...}

    @http.route('/custom/download', type='http', auth='user')
    def download_report(self, record_id, **kwargs):
        """File download endpoint."""
        record = request.env['model.name'].browse(int(record_id))
        record.check_access_rights('read')
        record.check_access_rule('read')
        # generate file content
        return request.make_response(
            file_content,
            headers=[
                ('Content-Type', 'application/pdf'),
                ('Content-Disposition', 'attachment; filename="report.pdf"'),
            ]
        )
```

### Route Parameters

| Parameter | Options | Default |
|-----------|---------|---------|
| `type` | `'http'`, `'json'` | `'http'` |
| `auth` | `'user'`, `'public'`, `'none'` | `'user'` |
| `methods` | `['GET']`, `['POST']`, `['GET', 'POST']` | All methods |
| `website` | `True`, `False` | `False` |
| `csrf` | `True`, `False` | `True` |
| `cors` | `'*'` or specific origin | None |

## Frontend Controller for Website Widgets

### JSON controller for public frontend widgets

When a `publicWidget` needs dynamic data (e.g. hero slides, testimonials), expose it via a JSON controller with `auth='public'` and `website=True`:

```python
from odoo import http
from odoo.http import request


class ThemeController(http.Controller):

    @http.route('/theme_name/data_endpoint', type='json', auth='public', website=True)
    def get_data(self):
        website = request.website
        domain = [
            ('active', '=', True),
            '|', ('website_id', '=', False), ('website_id', '=', website.id),
        ]
        records = request.env['model.name'].sudo().search(domain, order='sequence, id')
        return [{
            'id': r.id,
            'name': r.name,
            'image_url': f'/web/image/model.name/{r.id}/image' if r.image else '',
        } for r in records]
```

Key points:
- `type='json'` — the frontend calls this with JSON-RPC envelope, not plain HTTP
- `auth='public'` — accessible without login (for public website pages)
- `website=True` — `request.website` is available for multi-website filtering
- `sudo()` on the recordset — public users don't have model access rights by default
- `('website_id', '=', False)` in ORM is translated to `IS NULL` — matches records not assigned to any specific website
- Return a plain list/dict — Odoo wraps it in JSON-RPC response automatically
- The frontend calls it with: `import { rpc } from "@web/core/network/rpc"` + `await rpc('/theme_name/data_endpoint', {})`

**Common pitfall:** `@web/core/network/rpc` exports `rpc` in Odoo 18, NOT `jsonrpc`. Using `import { jsonrpc }` silently returns `undefined` and the call fails inside try/catch without any visible error.

## Constraints

```python
from odoo.exceptions import ValidationError

@api.constrains('date_start', 'date_end')
def _check_dates(self):
    for record in self:
        if record.date_end and record.date_start and record.date_end < record.date_start:
            raise ValidationError(_("End date must be after start date."))

_sql_constraints = [
    ('name_unique', 'UNIQUE(name, company_id)',
     'Name must be unique per company!'),
    ('amount_positive', 'CHECK(amount >= 0)',
     'Amount must be positive!'),
]
```

## Command API for One2many/Many2many Writes

```python
from odoo import Command

# In Odoo 18, use Command constants:
record.write({
    'line_ids': [
        Command.create({'name': 'New Line', 'quantity': 1}),     # (0, 0, vals)
        Command.update(line_id, {'quantity': 5}),                 # (1, id, vals)
        Command.delete(line_id),                                  # (2, id)
        Command.unlink(line_id),                                  # (3, id) - M2M only
        Command.link(line_id),                                    # (4, id) - M2M only
        Command.clear(),                                          # (5,)
        Command.set([id1, id2, id3]),                             # (6, 0, ids) - M2M
    ]
})
```

## Output Format

Save Python files in the appropriate directory:
- Models: `models/model_name.py`
- Controllers: `controllers/main.py`
- Wizards: `wizards/wizard_name.py`

Always update the corresponding `__init__.py` to import new files.
