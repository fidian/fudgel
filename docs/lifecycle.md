---
title: Lifecycle (Fudgel.js)
---

# Lifecycle

Fudgel components have a series of lifecycle methods and events that allow you to hook into different stages of a component's existence. These methods can be overridden in your controller to perform actions at specific points in the component's lifecycle.

If your controller has any of these methods, or if there is an event listener for any of these events, they will be called during specific moments during the lifecycle of your controller.

For further information about how to listen for events, see the [Events](events.html) page.


## How To Use Lifecycle Stages

The most straightforward way is to use methods on your controller. For example, to use the initialization lifecycle method, you would define `onInit()` in your controller:

<code-sample sample="samples/welcome-to-fudgel.js"></code-sample>

You can also listen for lifecycle events on a per-controller basis by adding event listeners in your controller's constructor or `onInit()` method:

<code-sample sample="samples/lifecycle-controller-events.js"></code-sample>

Finally, you can listen for events across all controllers by adding global event listeners.

<code-sample sample="samples/lifecycle-global-events.js"></code-sample>


## Lifecycle Stages

Controllers will go through the following lifecycle stages. Some stages might get skipped, depending on how the component is used or what happens during its existence. Calls will happen in this order if they all occur.


### Initialization (Always Called)

-   Global event: `init` (controller instance)
-   Controller Event: `init` (no arguments)
-   Controller Method: `onInit()`

Called after the custom element is connected to a DOM. It's a good place to set up your initial properties. Child elements are not yet attached to the DOM, templates are not parsed, and most other things are not yet set up. Attribute values that were present on the element when it was created have already been copied into the controller at this point.

This is an early stage in the lifecycle. Property bindings have been set up, but there hasn't been time for even synchronous code to assign values to the properties.


### Content Loaded (Most Likely Called)

-   Global event: `parse` (controller instance)
-   Controller Event: `parse` (no arguments)
-   Controller Method: `onParse()`

The `parse` events are fired and the `onParse()` method is called when all child nodes are parsed. This will always be called asynchronously to make sure that whatever created the element has had enough time to assign properties or set `.innerHTML` as needed. If the web component is present during the initial page load, this event will not fire until all of the element's content is available. If you are doing your own light DOM [content projection](content-projection.html), this would be an important method to use. When this is called, all child content has probably been added to the element. "Probably" is used because another framework could add content to the element after synchronous code execution is complete, but that's fairly unlikely.

There is no relationship between a parent element's lifecycle stages and a child'd. Either one could be parsed first.

At this point, the DOM has not been cleared and the template has not been applied. The original content is still present.


### View Initialized (Most Likely Called)

-   Global event: `viewInit` (controller instance)
-   Controller Event: `viewInit` ()
-   Controller Method: `onViewInit()`

This is triggered at the very end, after the custom element is created, synchronous code to set up properties has elapsed, the custom element is connected to the DOM and the template has also been attached and the directives have been processed, adding child elements to the DOM. Properties should be available if sending data from another framework. Your element is live.

A good practice is to use this method sparingly and instead react to changes in properties (see the next event). Initialize when you have enough data for the component, then uninitialize if missing some required information.


### Change (Zero or More Times)

-   Global event: `change` (controller instance, property name, old value, new value)
-   Controller Event: `change` (property name, old value, new value)
-   Controller Method: `onChange(propertyName, oldValue, newValue)`

Triggered whenever a monitored property on the controller is updated. Monitored properties are any attribute or property listed in the [config](component-config.html) plus any property used in a [binding](bindings.html). Differences are detected by using `Object.is()`, so changes to immutable objects will trigger change detection more easily.

This method can be called before "Content Loaded" and "View Initialized" stages.

Calling `update()` (see [Utilities](utilities.html)) will also call `onChange()` for all attributes and properties that are copied into the controller.


### Update (Possibly Called)

-   Global event: `update` (controller instance)
-   Controller Event: `update` (no arguments)
-   Controller Method: `onUpdate()`

This is called from the `update()` [utility function](utilities.html), which forcibly updates all bindings to change and reflect the current state of the controller.


### Unlink (Possibly Called)

-   Global event: `unlink` (controller instance, removed node)
-   Controller Event: `unlink` (removed node)
-   Controller Method: `onUnlink(removedNode)`

Removes bindings and other connections between the controller and some DOM elements. This is called when elements are being dynamically removed, such as with the [`*if` directive](directive-if.html).


### Destruction (Always Called)

-   Global event: `destroy` (controller instance)
-   Controller Event: `destroy` (no arguments)
-   Controller Method: `onDestroy()`

When the element is disconnected from the DOM, the `destroy` events are fired and the `onDestroy()` method is called. This is a good place to clean up any resources, event listeners, or timers that were created during the lifecycle of the component.
