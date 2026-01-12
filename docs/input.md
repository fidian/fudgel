---
title: Input (Fudgel.js)
---

# Input

Custom elements often need to receive information from the outside world. This
information typically comes from attributes and properties assigned on the DOM
element. Fudgel supports both, and does two-way binding to expose information
back to the outside world as well.

## Attributes

Elements in HTML can have attributes assigned to them. The attribute names are always in lowercase and the values are always strings. For example, consider the following HTML:

<code-sample sample="samples/attributes-example.html"></code-sample>

In this example, `<my-element>` has three attributes: `title`, `data-count`, and `disabled`. The `title` attribute has a string value of "Hello World", the `data-count` attribute has a string value of "5", and the `disabled` attribute is present without a declared value, so the element says its value is "" (an empty string).

To access these attributes in your Fudgel controller, you need to declare them in the component's configuration using the `attr` array. Fudgel will automatically create properties on your controller that correspond to these attributes, converting the attribute names from kebab-case to camelCase.

When a property is updated in the controller, the corresponding attribute on the DOM element will also be updated automatically. This two-way binding allows for easy synchronization between the controller and the DOM.

Make sure to only assign strings to these properties. Only strings and `false` (which removes the attribute) should be used. Assigning other types, such as numbers or objects, will not be reflected in the DOM's copy of the attributes.

When a single property is declared in both `attr` and `prop`, the most recent assignment takes priority.

A special note about boolean attributes: In HTML, the presence of a boolean attribute (like `disabled`, `checked`, or `hidden`) indicates a true value, but it's value is "" (an empty string). If you set the corresponding property in the controller to `true` or `false`, Fudgel will add or remove the attribute accordingly.

## Properties

Similar to attributes, properties can be assigned directly on the DOM element using JavaScript. Properties can hold any type of value, including objects, arrays, and dates. For example:

<code-sample sample="samples/properties-example.html"></code-sample>

Properties that are declared in this way shall have the DOM element's matching property updated automatically when the controller's property changes, and vice versa. This two-way binding allows for easy synchronization between the controller and the DOM.

When a single property is declared in both `attr` and `prop`, the most recent assignment takes priority.

## Caution

When using attributes, avoid code that tests for truthiness because an empty string is considered `true` for the DOM element's attribute presence.

<code-sample sample="samples/is-disabled.html"></code-sample>

Things get more complicated when mixing attributes and properties because now any value can be assigned through the property. However, this example shows that the logic remains the same and the `disabled` attribute is applied when one expects it to be.

<code-sample sample="samples/is-disabled-using-both.html"></code-sample>

