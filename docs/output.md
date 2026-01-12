---
title: Output (Fudgel.js)
---

# Output

One will often need to respond to changes in the state of a component by updating the DOM or sending information back to the outside world. Fudgel helps with this through two-way property binding and a function for sending events.

## Events

The normal way of advertising changes in a component's state is to dispatch a custom event. For better minification, Fudgel provides a helper [utility function](utilities.html) called `emit` that makes this easier.

<code-sample sample="samples/emit-example.html"></code-sample>

You may also want to catch events within your component. See [Event Directive](directive-event.html) section for further details.

## Properties

A property binding is declared in the controller's configuration using the `prop` key. Each element of this string array names a property on the DOM element that should be kept in sync with a property of the same name on the controller. This lets you expose information about the component's state to outside code.

<code-sample sample="samples/properties-example.html"></code-sample>

This is a two-way binding. When the controller updates the property, the outside DOM element is also updated automatically. Any value can be passed this way, including objects and arrays.

If outside JavaScript updates the property on the DOM element, the controller's property is updated as well.

There's more on this in the [input](input.html) section.

## Services

Another technique for sending information elsewhere is to use a shared service. In Fudgel, the `di()` [utility function](utilities.html) can be used to retrieve a shared service singleton instance. This can then be used to send information to other parts of the application.

<code-sample sample="samples/service-data-sharing.html"></code-sample>

Using `di()` is not a requirement for sharing data, but it is a convenient way to make sure only one instance of a service exists.

This is a more advanced technique, but it can be very useful for complex applications or when blending multiple frameworks together.

Learn more about dependency injection using `di()` in the [utilities](utilities.html) section.
