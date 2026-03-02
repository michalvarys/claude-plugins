---
name: odoo-module-scaffold
description: |
  Scaffold complete Odoo 18 modules with proper directory structure, manifest, models, views, security, and data files. Use this skill when the user wants to create a new Odoo module, addon, extension, or app from scratch. Trigger on: "create module", "new module", "scaffold module", "odoo addon", "odoo app", "rozšiřovací modul", "nový modul", "vytvoř modul", "nový addon", "scaffold", "vytvořit modul pro Odoo", "rozšíření pro Odoo", "Odoo modul", "nová aplikace pro Odoo".
version: 0.1.0
---

# Odoo 18 Module Scaffold

Create complete, production-ready Odoo 18 module structures. Every module you produce follows Odoo 18 conventions and is ready to install.

Before writing any code, read `references/module-structure.md` in this skill's directory for the exact file patterns and conventions.

## Core Principles

### 1. Convention over configuration

Odoo has strict conventions for file organization. Follow them exactly — Odoo's module loader expects specific filenames and directory structures.

### 2. Complete from the start

Every module ships with: manifest, models, views, security (ir.model.access.csv + record rules if needed), i18n-ready strings, and demo data where appropriate.

### 3. Odoo 18 specific

Use Odoo 18 patterns: `_inherit` for extensions, `Command` API for One2many writes, `@api.depends` / `@api.onchange`, new-style views (no `<tree>` tag — use `<list>`).

## Module Creation Workflow

### Step 1: Understand the module

Clarify:
- **Module purpose** — what business problem does it solve?
- **Technical name** — snake_case, descriptive (e.g., `sale_delivery_tracking`)
- **Dependencies** — which Odoo modules does it extend? (`sale`, `stock`, `website`, etc.)
- **Models** — what data models are needed?
- **Views** — form, list, kanban, search views?
- **Security** — who can read/write/create/delete?

### Step 2: Create the directory structure

Follow the structure in `references/module-structure.md`. Minimum viable module:

```
module_name/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── model_name.py
├── views/
│   └── model_name_views.xml
├── security/
│   └── ir.model.access.csv
└── static/
    └── description/
        └── icon.png  (optional but recommended)
```

### Step 3: Write the manifest

The `__manifest__.py` is the module's identity. Include all required fields:

```python
{
    'name': 'Human Readable Name',
    'version': '18.0.1.0.0',
    'category': 'Sales',
    'summary': 'One-line module description',
    'description': """
Long description of what the module does.
Can be multi-line RST or plain text.
    """,
    'author': 'Author Name',
    'website': 'https://example.com',
    'license': 'LGPL-3',
    'depends': ['base', 'sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/model_name_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': False,
    'auto_install': False,
}
```

**Version format:** `18.0.MAJOR.MINOR.PATCH` — always prefix with `18.0.` for Odoo 18.

### Step 4: Implement models

See the `odoo-python` skill for detailed model patterns. Key rules:
- Model name uses dots: `sale.delivery.tracking`
- Table name auto-generated from model name (dots → underscores)
- `_description` is required for every new model
- Use `_inherit` to extend existing models

### Step 5: Create views

See the `odoo-views` skill for detailed view patterns. Key rules:
- View XML IDs follow pattern: `view_model_name_type` (e.g., `view_delivery_tracking_form`)
- Use `<list>` not `<tree>` in Odoo 18
- Menu items go in a separate `views/menu.xml` or at the bottom of the views file

### Step 6: Set up security

Every model needs an entry in `security/ir.model.access.csv`:

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_delivery_tracking_user,delivery.tracking.user,model_sale_delivery_tracking,base.group_user,1,1,1,0
access_delivery_tracking_manager,delivery.tracking.manager,model_sale_delivery_tracking,sales_team.group_sale_manager,1,1,1,1
```

**CSV field rules:**
- `id` — unique XML ID for this access rule
- `model_id:id` — `model_` prefix + model name with dots replaced by underscores
- `group_id:id` — reference to security group (module.xml_id format)

### Step 7: Validate

Checklist:
- [ ] `__manifest__.py` has correct `depends` list (all imported modules)
- [ ] `__manifest__.py` `data` list includes ALL XML and CSV files in correct order (security before views)
- [ ] All `__init__.py` files import their submodules
- [ ] Model `_name` uses dots, `_description` is set
- [ ] Security CSV has entries for every model
- [ ] View XML IDs are unique and descriptive
- [ ] No circular dependencies

## Output Format

Create the module as a directory structure with all files. Use the technical name as the directory name.

If extending an existing module, name the new module descriptively: `{original_module}_{feature}` (e.g., `sale_delivery_tracking`).
