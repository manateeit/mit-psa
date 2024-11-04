Certainly! Here's a documentation guide for the Invoice Template Language that would be suitable for a program manager to share with end users:

---

# Invoice Template Language Guide

Our Invoice Template Language allows you to create customizable, dynamic invoice templates. This guide will walk you through the main components and features of the language.

## Basic Structure

An invoice template consists of sections, each containing various elements like fields, lists, calculations, and static text.

### Sections

Sections are the main building blocks of your template. Each section has a grid layout.

```
section header grid 12 x 1 {
  // Content goes here
}

section items grid 12 x 5 {
  // Content goes here
}

section summary grid 12 x 2 {
  // Content goes here
}
```

The grid dimensions (e.g., `12 x 1`) define the number of columns and minimum rows for the section.

## Elements

### Fields

Fields display data from the invoice. Specify their position on the grid.

```
field company.name at 1 1 span 6 1
field invoice_number at 10 1 span 3 1
```

### Static Text

Add fixed text to your template:

```
text "Invoice" at 1 1 span 2 1
text footer: "Thank you for your business!" at 1 12 span 12 1
```

### Lists

Lists display repeating items, like line items on an invoice.

```
list invoice_items {
  field name at 1 1 span 6 1
  field quantity at 7 1 span 2 1
  field unit_price at 9 1 span 2 1
  field total_price at 11 1 span 2 1
}
```

You can also group list items:

```
list invoice_items group by category {
  // List content
}
```

### Calculations

Perform calculations on your data:

```
calculate subtotal as sum total_price from invoice_items
calculate item_count as count id from invoice_items
calculate average_price as avg unit_price from invoice_items
```

Use `global` for calculations that can be referenced anywhere in the template:

```
global calculate total as sum total_price from invoice_items
```

### Styles

Apply styles to elements:

```
style field invoice_number, text footer {
  font-weight: bold;
  color: #333333;
}
```

### Conditional Rendering

Show or hide elements based on conditions:

```
if status == "overdue" then {
  text "OVERDUE" at 10 1 span 3 1
}
```

## Positioning and Spanning

Use grid coordinates to position elements. The format is `at column row`.

```
field company.name at 1 1
```

Use `span` to make elements cover multiple grid cells:

```
field description at 1 2 span 12 2
```

This positions the element at column 1, row 2, spanning 12 columns and 2 rows.

## Best Practices

1. Plan your layout before coding. Sketch out the grid and element positions.
2. Use meaningful names for calculations and styled elements.
3. Group related items in the same section.
4. Use styles for consistent formatting across similar elements.
5. Test your template with various data to ensure it handles different scenarios well.

---

This guide provides an overview of the key features of the Invoice Template Language. It's designed to be understandable by end users who will be creating templates, while still covering all the main capabilities of the language. You may want to supplement this with specific examples relevant to your users' needs and perhaps a visual guide showing how different elements are rendered in the final invoice.