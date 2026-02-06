---
title: Utility Functions (Fudgel.js)
---

# Utility Functions

Fudgel comes with a few helpful functions that you should leverage to squeeze as much as you can out of this tiny library. They will help you communicate with other web components and perform common activities.

## `emit(source, name, detail, options)` - Sending Data to Parents

* `source` (Element | Controller) - The element or controller that is sending the event. If passed a controller, the event will be sent from the controller's host element.
* `name` (string) - The name of the event to send.
* `detail` (any, optional) - The data to send with the event. This will be available on the event's `detail` property.
* `options` (object, optional) - Additional options for the event.

Dispatching events from your controller can be tricky with the shadow DOM. Also, for minification, you will probably want to leverage shared code to send events.

<code-sample sample="samples/utility-emit.js"></code-sample>

## `metadata` - Access Components and Metadata

The `metadata` symbol allows you to do the following activities.

**On A Custom Element:** Using `element[metadata]` will give you access to the controller instance for that element.

**On A Controller:** From a controller, using `this[metadata]` will let you access the metadata object for that component, which contains the following properties:

* `attr` - A `Set()` of attribute names, based on the [component config](component-config.html) `attr` property.
* `cssClassName` - The CSS class name used for [scoping styles](styling.html).
* `events` - An `Emitter` instance for this component's events.
* `host` - The `CustomElement` in the DOM that is being controlled by the current controller.
* `prop` - A `Set()` of property names, based on the [component config](component-config.html) `prop` property.
* `root` - The root element for the component. If using Shadow DOM, this is the shadow root. Otherwise it is the custom element itself.
* `style` - The styles to be added for the component, already [scoped](styling.html).
* `tagName` - The tag name of the custom element.
* `template` - The HTML template string for the component, which is already [scoped](styling.html).
* `useShadow` - A boolean indicating whether the component is using Shadow DOM, which is based on the [component config](component-config.html) `useShadow` property.

**On A Scope:** If the scope has the `metadata` property, it is the root scope, upon which all other scopes are based. The root scope is attached to `document.body`.

### Using `element[metadata]`

If you need the controller of another element, you can use `element[metadata]` to get the controller instance.

<code-sample sample="samples/utility-metadata-element.js"></code-sample>

### Using `controller[metadata].host`

You might need to toggle attributes or perform other actions on the DOM from the controller. To get the actual custom element in the DOM, use `this[metadata].host`.

<code-sample sample="samples/utility-metadata-host.js"></code-sample>

### Using `controller[metadata].root`

Your component creates all of its template elements in one parent element. When using a shadow DOM, this is the shadow DOM element. Otherwise, this is the custom element. To easily access this element from your controller for content manipulation, use `this[metadata].root`.

<code-sample sample="samples/utility-metadata-root.js"></code-sample>

## `update(component)` - Redrawing the UI

* `component` (Controller, optional) - The controller to update. If not provided, all components will be updated.

When you update internal data within an object, the change detection will not pick it up. You can flag specific properties as needing to be redrawn.

`update()` - When called with no arguments, it will update all bindings for all Fudgel components everywhere. This is the slowest way to trigger updates, but it is also the easiest.

`update(this)` - This is a better, more focused way to update all of the bindings for just the one controller.

<code-sample sample="samples/utility-update.js"></code-sample>

## `html(string)` and `css(string)` - Dummy Tagged Template Functions

* `string` (string) - The HTML or CSS string. There is no processing done on this string.
* return (string) - The same string that was passed in.

There are some build tools that will allow minification of HTML and CSS when they are used within [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates). Fudgel exports `html()` and `css()` as empty tag functions so your toolset will detect the appropriate type of template and allow minification. You can see them in use with the [Be Prepared](https://github.com/Be-Prepared/Be-Prepared.github.io/) PWA, which also uses Vite and a plugin to minify the HTML and CSS used the template literals.

<code-sample sample="samples/utility-html-css.js"></code-sample>

## `di(ServiceConstructor)` - Dependency Injection

* `ServiceConstructor` (Function) - The constructor function or class of the service to inject.
* return (Object) - A singleton instance of the requested service.

Also included is a minimal dependency injection system, allowing you to inject singleton services into your components. Why use dependency injection? Well, it makes testing much easier, plus you only need to indicate what you want as opposed to how you obtain it or its dependencies.

A requirement for this system is that you must not have side-effects nor arguments in the constructors of the services being injected.  If you can follow that rule, then this system will work for live sites, test systems, and even work after your code is minified.

<code-sample sample="samples/utility-di.js"></code-sample>

## `diOverride(ServiceConstructor, instance)` - Override a Dependency Injection Service

* `ServiceConstructor` (Function) - The constructor function or class of the service to override.
* `instance` (Object) - The instance to use when the service is requested via `di()`.

If you need arguments, you could instead create an instance of the service and push it into the dependency injection system using `diOverride()`. This same mechanism is used for testing, allowing you to push in mock versions of services.

<code-sample sample="samples/utility-di-override.js"></code-sample>

## `new Emitter()` - Send data to other things outside of the DOM

Node.js has an EventEmitter and it's useful for communication between services. The browser has an Event object that can be emitted up the DOM tree, but nothing really geared for services. Fudgel comes with a tiny event emitter you can use in your code. Create an emitter using `const emitter = new Emitter();` and then use the following methods to communicate:

* `emitter.on(name, callback)` - Register a callback for an event name. Returns a function to remove the callback.
* `emitter.off(name, callback)` - Remove a callback for an event name.
* `emitter.emit(name, ...data)` - Emit an event with the given name and data.

<code-sample sample="samples/utility-emitter.js"></code-sample>

## `parse` - A collection of methods for working with expressions

There are different ways one can parse expressions in Fudgel, and each has its own method and use case.

All of these methods will return an array.

* `[0]` - A function that can be called with one or more context objects to evaluate the expression against. Typically, one calls this with the current scope and the controller instance.
* `[1]` - An array of property names that are being bound to in the expression.

<code-sample sample="samples/parse-js.js"></code-sample>

### `parse.attr(expressionString)`

* `expressionString` (string) - The expression string to parse.
* return (Array) - An array where `[0]` is a function to evaluate the expression, and `[1]` is an array of property names used in the expression.

This is nearly identical to `parse.text()`. When called, the resulting `[0]` function will return a string that is suitable for use as an attribute value.

However, if the expression would result in `null`, `undefined`, or `false`, then the result of the function would be `false`, indicating that the attribute should be removed.

This parse function is used internally by Fudgel when processing attribute [bindings](bindings.html).

### `parse.js(expressionString)`

* `expressionString` (string) - The expression string to parse.
* return (Array) - An array where `[0]` is a function to evaluate the expression, and `[1]` is an array of property names used in the expression.

This method is used to parse expressions that look like JavaScript. It supports most JavaScript syntax, except for multiple statements, function creation, assignments, and a few other items. Please see the [Expressions](expressions.html) page for more information on what is and isn't supported.

This will likely be the most commonly used parse function. The following example adds a new directive that will send an update every second.

### `parse.text(expressionString)`

* `expressionString` (string) - The expression string to parse.
* return (Array) - An array where `[0]` is a function to evaluate the expression, and `[1]` is an array of property names used in the expression.

The result of running the function provided at `[0]` will always be a string. This is used for text [bindings](bindings.html).

## `getScope(node)` - Get a scope object associated to a node or a node's ancestor

* `node` (Node) - The starting point for searching for a scope.
* return (Scope) - The scope associated with the node or the nearest ancestor node.

Fudgel's [expressions](expressions.html) and bindings work within scopes. A controller creates a scope when it is bound to an element. Similarly, directives are able to create child scopes that have changes but don't overwrite a parent scope's values. This is how the [`*for` directive](directive-for.html) works when it iterates. You may have need to create your own scope, especially if you are creating a new directive.

This works in conjunction with `parse`. Please see the example there for how to create a child scope.

## `lifecycle(controller, stage, ...args)`

* `controller` (Controller) - The controller instance.
* `stage` (string) - The lifecycle stage to invoke. Built-in ones include `change`, `destroy`, `init`, `parse`, `unlink`, `update`, `viewInit`.
* `args` (any, optional) - Additional arguments to pass to the lifecycle method events or methods.
* return (void) - No return value.

This will emit the lifecycle stage event as a global Fudgel event, on the controller's event emitter, and will also call the lifecycle method on the controller if it exists. The lifecycle events will use the stage name as supplied, however the lifecycle method will have the first letter capitalized and prefixed with `on`. For example, the `init` stage will call the `onInit()` method on the controller if it exists.

Learn more about [lifecycle stages](lifecycle.html).
