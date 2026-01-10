---
title: Getting Started (Fudgel.js)
---

# Getting Started

Step 1: Install Fudgel or include it into your project. This can take several forms, depending on your needs. This can be loaded from a CDN (as shown below, both as UMD or a module), or installed locally as a package.

<code-sample sample="samples/umd-from-cdn.json"></code-sample>

<code-sample sample="samples/module-from-cdn.json"></code-sample>

Installing locally as a package is simple.

* `npm install fudgel`
* `yarn add fudgel`
* `bower install fudgel`


Step 2: At this point you have access to the `Fudgel` object or the module's exports. It's time to write your first controller. Select the chunk of code that best fits your needs.

<code-sample sample="samples/hello-world-module.json"></code-sample>

<code-sample sample="samples/hello-world-umd.json"></code-sample>

<code-sample sample="samples/hello-world-typescript.json"></code-sample>

Step 3: You've made a custom element. For more fun, take a look at the rest of the things Fudgel can do to save you time.


## Best Practices

For performance, do not reassign to a bound property. Modify a local variable and only assign it back to the bound property when all changes are complete. This prevents multiple updates to the DOM.

When building a library, do not automatically register your custom elements in your exported module. This won't allow developers to resolve name conflicts. Instead, export a function that allows a prefix or a custom name to be provided, similar to how `defineRouterElement` and `defineSlotComponent()` work for Fudgel's built-in elements.

In general, you want your element to accept data into the controller using attributes (strings) and properties (any data). Attributes have universal support, where as most support properties. When you need to send data out of your controller, send an event. If you need data to be visible and retrievable from the outside, expose it through a property.
