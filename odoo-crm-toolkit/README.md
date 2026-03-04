# Odoo CRM Toolkit

Complete Odoo 18 CRM & marketing toolkit for managing contacts, CRM opportunities, mailing campaigns, email/SMS templates, customer order analysis, and automated prospect website generation — all via XML-RPC API.

## Setup

### Environment Variables

Set these in your environment before using the plugin:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ODOO_URL` | Yes | Odoo instance URL | `https://michalvarys.eu` |
| `ODOO_DB` | Yes | Database name | `varyshop` |
| `ODOO_API_KEY` | Yes | API key from Odoo user profile | — |

> **UID se zjišťuje automaticky** přes `common.authenticate()` — stačí zadat API klíč.

### Getting an API Key

1. Log into Odoo as admin
2. Go to Settings → Users → Your user
3. Go to Account Security tab
4. Under API Keys, click "New API Key"
5. Copy the key and set it as `ODOO_API_KEY`

## Commands

| Command | Description |
|---------|-------------|
| `/prospect-web <company>` | Full workflow: analyze company → create web preview → CRM → email + SMS |
| `/add-partner <name>` | Create or update a contact/company in Odoo |
| `/add-opportunity <title>` | Create a CRM opportunity |
| `/analyze-orders <customer>` | Analyze customer order history |
| `/create-campaign <type> <subject>` | Create email or SMS mailing campaign |

## Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| manage-partners | "add contact", "create partner" | CRUD operations on res.partner |
| crm-opportunities | "add opportunity", "create lead" | Manage CRM leads/opportunities |
| analyze-orders | "analyze orders", "sales report" | Customer order analysis |
| mailing-campaigns | "create campaign", "email blast" | Create email/SMS mailings |
| mailing-lists | "mailing list", "add to list" | Manage lists and contacts |
| send-campaign | "send campaign", "send email" | Send via mailing with tracking |
| upload-assets | "upload image", "add asset" | Upload files to Odoo |
| email-templates | "email template", "design email" | Create email HTML templates |
| prospect-website | "prospect company", "create web" | Full prospect-to-website pipeline |

## The Prospect Web Workflow

The flagship feature — `/prospect-web <company>` — automates the entire prospect pipeline:

1. Researches the company online (website, social media, digital footprint)
2. Creates a detailed res.partner record with full analysis
3. Creates a CRM opportunity with scope and pricing
4. Generates a beautiful QWeb landing page as a web preview (published, not in menu)
5. Creates a personalized email template matching the web style
6. Creates an SMS with link to the email browser view
7. Sets up mailing list and contact linked to the partner

Everything is created as **draft** — you manually review and send from Odoo admin.

### Pricing in Templates

Standard pricing used in prospect emails:
- Web, server, design, SSL, bezpečnost a údržba systému **od 1 290 Kč/měsíc**

### Branding

- Sender: **Michal Varyš <info@michalvarys.eu>**
- Website: **michalvarys.eu**

## Dependencies

This plugin works alongside:
- **odoo-dev-toolkit** — for QWeb page creation patterns (the prospect-website skill references its odoo-qweb-page skill)

## API Reference

The shared API reference at `references/xmlrpc-api.md` contains:
- Connection setup with xmlrpc.client
- CRUD operation patterns
- Model field references (res.partner, crm.lead, sale.order, mailing.mailing, etc.)
- QWeb page creation via API
- Image upload patterns
- Mailing list management
