# Odoo 18 View Inheritance Pitfalls

Hard-won lessons from building marketplace modules. Every item here caused a real installation failure.

## Rule #1: Never assume xpath targets

Always `grep` or `cat` the parent view XML in your Docker container before writing xpath expressions. Odoo 18 has different view structures than documentation or earlier versions suggest.

```bash
# Find the actual view XML
docker exec CONTAINER grep -rn "group_name\|field_name" /app/addons/MODULE/views/
```

## Delivery Carrier Form View

**Parent view:** `delivery.view_delivery_carrier_form`

### Groups available for xpath

```xml
<!-- Odoo 18 delivery carrier form groups -->
<group name="provider_details">  <!-- Provider selection -->
<group name="delivery_details">  <!-- After provider details -->
```

### WRONG xpath targets (don't exist in Odoo 18)

```xml
<!-- WRONG: This group does not exist -->
<xpath expr="//group[@name='carrier_options']" position="inside">

<!-- RIGHT: Use delivery_details -->
<xpath expr="//group[@name='delivery_details']" position="after">
    <group string="My Carrier Settings" invisible="delivery_type != 'mycarrier'">
        <field name="mycarrier_api_key" password="True"/>
    </group>
</xpath>
```

## Stock Picking Form View

**The `carrier_tracking_ref` field is NOT in `stock.view_picking_form`.**

It's added by the `stock_delivery` bridge module in `stock_delivery.view_picking_withcarrier_out_form`.

### WRONG

```xml
<field name="inherit_id" ref="stock.view_picking_form"/>
<xpath expr="//field[@name='carrier_tracking_ref']" position="after">
```

### RIGHT

```xml
<field name="inherit_id" ref="stock_delivery.view_picking_withcarrier_out_form"/>
<xpath expr="//group[@name='carrier_data']" position="inside">
    <field name="my_custom_field"/>
</xpath>
```

### Buttons: button_box not header

```xml
<!-- RIGHT: stat-style buttons in button_box -->
<xpath expr="//div[@name='button_box']" position="inside">
    <button name="action_print_label"
            string="Print Label"
            type="object"
            class="oe_stat_button"
            icon="fa-print"
            invisible="not my_tracking_id"/>
</xpath>
```

## Settings View (res.config.settings)

**The `<app>` element is in stock's own settings view, not accessible via simple xpath.**

### WRONG

```xml
<field name="inherit_id" ref="base.res_config_settings_view_form"/>
<xpath expr="//app[@name='stock']" position="inside">
```

### RIGHT

```xml
<field name="inherit_id" ref="stock.res_config_settings_view_form"/>
<xpath expr="//block[@name='shipping_setting_container']" position="after">
    <block title="My Carrier" name="mycarrier_settings">
        <setting string="API Key" help="Enter your carrier API key">
            <field name="mycarrier_api_key"/>
        </setting>
    </block>
</xpath>
```

## Dependencies Rule

If you inherit a view from module X, your module MUST depend on module X.

```python
# If you inherit stock_delivery views:
'depends': ['stock_delivery']  # NOT ['delivery', 'stock']

# stock_delivery is auto-installed when both stock and delivery are present
# It provides: carrier_tracking_ref, carrier_data group, button_box on picking form
```

## Debugging View Inheritance

When module install fails with xpath errors:

```bash
# 1. Find the parent view
docker exec CONTAINER grep -rn "view_name_or_id" /app/addons/ --include="*.xml"

# 2. Read the full view
docker exec CONTAINER cat /app/addons/MODULE/views/FILE.xml

# 3. Search for the group/field you need
docker exec CONTAINER grep -rn "name='group_name'" /app/addons/MODULE/ --include="*.xml"
```

## Odoo 18 invisible Attribute

Odoo 18 uses Python-like expressions in `invisible`, not domain syntax:

```xml
<!-- Odoo 18 style -->
<field name="my_field" invisible="delivery_type != 'mycarrier'"/>
<button invisible="not my_tracking_id"/>

<!-- NOT domain style (older Odoo) -->
<field name="my_field" attrs="{'invisible': [('delivery_type', '!=', 'mycarrier')]}"/>
```
