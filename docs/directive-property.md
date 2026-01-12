---
title: Property Directive (Fudgel.js)
---

# Property `.` Directive (`.prop`)

A Fudgel component can assign properties to DOM elements inside the template's HTML. This is useful for other custom components that allow you to pass configuration objects or arrays through properties. One does this using the `.` [directive](directives.html).

<code-sample sample="samples/directive-property.js"></code-sample>

You'll notice that the parent component assigns the array of items on the child element using `.child-list` and the child receives the [input](input.html) through the `prop` configuration. It's kebab-case in the template and camelCase in the controller because HTML attributes are always in lowercase when retrieved by JavaScript.

You can use the same technique to assign any property on a DOM element, including `.innerHTML`.

<code-sample sample="samples/inner-html.js"></code-sample>
