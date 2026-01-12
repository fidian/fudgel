---
title: Upgrading (Fudgel.js)
---

# Upgrading

When a new version of Fudgel is released, you may need to make some changes to your existing components to ensure they continue to work correctly.

## From 2.x.x to 3.x.x

* `nextTick()` was removed.
* `controllerToElement()`, `elementToController()`, and `rootElement()` has been removed. Use `metadata`, as seen on the [Utilities](utilities.html) page instead.
* All hooks have been removed and switched to [events](events.html).
    * `hookOnGlobal()` is removed and mostly replaced with `events.on()`.
    * `component` hook changed to an event and has an additional argument.
    * `set:PROP_NAME` and `set:` hooks removed. `change` and `update` fire instead, respectively.
* The `update()` [utility function](utilities.html) no longer allows updating specific properties.
* [Lifecycle](lifecycle.html) stages now fire events globally, fire events on the controller, and call methods on the controller.
    * Created `update` and `unlink` events.
    * `parse` and `viewInit` have been updated to potentially be synchronous, with a new argument indicating if this was called synchronously.
* Documentation reviewed and significant improvements made.

## From 1.x.x to 2.x.x

* No changes. The internals changed significantly and additional information was exposed, but the API remained the same.
