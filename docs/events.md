---
title: Events (Fudgel.js)
---

# Events

This page describes the events that take place in Fudgel when creating and using components. It is not related to DOM event handling, which is covered in [Event `@` Directive](directive-event.html).

There are global events and per-controller events. Several of these are described on the [Lifecycle](lifecycle.html) page from the perspective of the stages of a component's lifecycle.

## Global Events

Global events allow the ability to add functionality or hook into all controller instances. This is done using the `events.on()` and `events.off()` methods. This uses an `Emitter` instance, which is exported as part of the [Utilities](utilities.html) that are included with Fudgel.

### `component` Event

* Created by `component()` when a new component is defined.
* Arguments:
    * `customElement`: The custom element class being defined.
    * `constructor`: The controller class being used for the component.
    * `config`: The internal version of the [configuration object](component-config.html).

This event is launched when any component is defined. It allows modification of the class as necessary. The custom element has not been attached to the DOM at this point, so you are dealing with the controller's constructor and prototype instead of an instance.

<code-sample sample="samples/events-component.js"></code-sample>

Using this event, you can modify the component class so it will perform an action every time it is added to the DOM.

<code-sample sample="samples/events-component-add-logging.js"></code-sample>

There is a caveat: this event is launched before the component is registered with the browser, so you are able to modify its configuration or template. If you need to know if the component will be allowed to be defined, you can use `CustomElementRegistry.get()` to check if the tag name is already in use.

### Controller Events

* Created by [Lifecycle](lifecycle.html) stages and other actions.
* Arguments:
    * `controller`: The controller instance affected.
    * Additional arguments vary by event.
* See Controller Events section for further details.

All controller events will first emit a global event with the controller as the first argument, followed by any additional arguments. Then, if there are any event listeners on the controller instance itself, those will be called with only the additional arguments (omitting the controller instance).

## Controller Events

### `change` Event

* Created when a bound property changes.
* Arguments:
    * `propertyName`: The name of the property that changed.
    * `oldValue`: The previous value of the property.
    * `newValue`: The new value of the property.
* More information on the [Lifecycle](lifecycle.html) page.

### `destroy` Event

* Created when the custom element is removed from the DOM and the controller is destroyed.
* No arguments
* More information on the [Lifecycle](lifecycle.html) page.

### `init` Event

* Created when the custom element is added to the DOM and the controller is created.
* No arguments
* More information on the [Lifecycle](lifecycle.html) page.

### `parse` Event

* Created when the content has fully loaded for the custom element.
* No arguments
* More information on the [Lifecycle](lifecycle.html) page.

### `unlink` Event

* Created when DOM elements are dynamically removed by a directive.
* Arguments:
    * `node`: The DOM node being removed.
* More information on the [Lifecycle](lifecycle.html) and [Utilities](utilities.html) pages.

### `update` Event

* Created by the `update()` [utility function](utilities.html) to force an update of all bindings.
* No arguments.
* More information on the [Lifecycle](lifecycle.html) and [Utilities](utilities.html) pages.

### `viewInit` Event

* Created when the view has been fully initialized and the template applied.
* No arguments
* More information on the [Lifecycle](lifecycle.html) page.
