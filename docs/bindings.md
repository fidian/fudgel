---
title: Bindings (Fudgel.js)
---

# Bindings

Fudgel uses a simple and powerful binding syntax to connect your component's template to its controller. Bindings are enclosed in double curly braces `{{openBrace}} {{closeBrace}}` and can be used to insert dynamic content into text and attribute values. Here's an example of a simple component that binds text and an attribute.

<code-sample sample="samples/binding-example.js"></code-sample>

The URL used in the link will be changed to match the `url` property from the controller, and the link text will reflect the `linkText` property. This will continue to update automatically as long as the component is in the DOM.

The bindings don't have to be simple property names. JavaScript syntax can perform calculations or call methods on the controller. For example, you could bind to a method that formats a date or computes a value based on other properties. You are not allowed to use operators that change state, such as assignment (`=`), increment (`++`), or decrement (`--`). Learn more about [supported expressions](expressions.html).

Because not all JavaScript is supported in bindings and to encourage better separation of concerns, it's recommended to use methods to perform complex logic and update state. It also helps keep your templates clean and easy to read.

The link in the above example will be disabled for one of the items in the list. When an attribute is bound to a boolean expression, null, or undefined, the attribute will be added or removed based on the truthiness of the value. This is useful for attributes like `disabled`, `checked`, or `hidden`. However, if there is even one character outside of the binding in the attribute value, it will always be treated as a string.

Bindings are updated whenever a top-level property in the expression changes. For example, if you have a binding like `{{openBrace}} user.name {{closeBrace}}`, the binding will update whenever the `user` property is assigned a new object. However, changes to nested properties (like `user.name`) will not automatically trigger an update unless you reassign the `user` property itself or use the `update()` [utility function](utilities.html).

Similarly, bindings are used for other directives, such as [Event Directives](directive-event.html) and [If Directive](directive-if.html). This allows you to create dynamic behavior based on the component's state.
