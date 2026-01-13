---
title: Best Practices (Fudgel.js)
---

# Best Practices

Using Fudgel to create custom elements is straightforward. To help ensure maximum compatibility and performance, here are some best practices to follow when writing your components.

## Performance

For performance, do not reassign to a bound property. Modify a local variable and only assign it back to the bound property when all changes are complete. This prevents multiple updates to the DOM.

<code-sample sample="samples/assign-only-once.js" no-playground></code-sample>

## Compatibility

When building a library, do not automatically register your custom elements in your exported module. This won't allow developers to resolve name conflicts. Instead, export a function that allows a prefix or a custom name to be provided, similar to how `defineRouterElement()` (see [Routing](routing.html)) and `defineSlotComponent()` (described in [Content Projection](content-projection.html)) work for Fudgel's built-in elements.

<code-sample sample="samples/export-component-function.js" no-playground></code-sample>

## Data Flow

In general, you want your element to accept data into the controller using attributes (strings) and properties (any data). Attributes have universal support, where as most support properties.

<code-sample sample="samples/data-flow-into-component.html"></code-sample>

When you need to send data out of your controller, send an event. If you need data to be visible and retrievable from the outside, expose it through a property.

<code-sample sample="samples/emit-and-exposing-property.html"></code-sample>

Alternately, you can use a service to share data between components. This example uses the built-in `Emitter` class, as found on the [utilities page](./utilities.html).

<code-sample sample="samples/service-data-sharing.html"></code-sample>
