---
title: Directive Basics (Fudgel.js)
---

# Directive Basics

Directives appear as attributes within your component's template HTML. They provide a way to bind data and behavior to DOM elements. Fudgel provides several directives to handle most of the common use cases.

Directives fit the following categories:

* **Structural Directives** - Change the structure of the DOM by adding, removing, or repeating elements. These must start with a `*` character and only one is allowed per element, such as [`*if`](directive-if.html), [`*for`](directive-for.html), and [`*repeat`](directive-repeat.html).
* **Prefix Directives** - Assign a single character prefix and if an attribute starts with that character, the directive will be applied. These include [`@` for events](directive-event.html) and [`.` for properties](directive-property.html).
* **Named Directives** - Uses a full name for the attribute. To avoid conflicts with standard HTML attributes, these start with `#`, such as [`#ref`](directive-ref.html) and [`#class`](directive-class.html).

Processed at about the same time as directives are [bindings](bindings.html), which use the `{{openBrace}} {{closeBrace}}` syntax to insert data into text nodes and attribute values.

## Built-in Directives

The following directives are built into Fudgel:

* [`#class`](directive-class.html) - Conditionally adds or removes CSS classes
* [`#ref`](directive-ref.html) - Assigns an element reference to a property on the controller.
* [`*for`](directive-for.html) - Repeats an element for each item in an array.
* [`*if`](directive-if.html) - Conditionally includes or excludes an element based on an expression.
* [`*repeat`](directive-repeat.html) - Repeats an element a fixed number of times.
* [`.property`](directive-property.html) - Sets a property on an element.
* [`@event`](directive-event.html) - Binds an event handler to an event.

## Adding Custom Directives

You are welcome to add your own directives. Regardless of the type of directive, you add them using the same function, `addDirective()`.

<code-sample sample="samples/add-directive.js" no-playground></code-sample>

Your custom directive function must perform whatever manipulation in the DOM that is necessary. For structural directives, a comment is automatically added just before the element with the directive; this is an anchor point you can use for adding or removing elements.

If you'd like to deal with the attribute value in a way that's similar to how Fudgel works with other property lookups, you will be very interested in `parse` and `getScope()`, exported as part of the [utilities](utilities.html).

The following example shows how to create a `#tick` directive that will use an [expression](expressions.html) to call a function every seond.

<code-sample sample="samples/parse-js.js"></code-sample>
