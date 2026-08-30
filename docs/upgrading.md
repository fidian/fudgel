---
title: Upgrading (Fudgel.js)
---

# Upgrading

When a new version of Fudgel is released, you may need to make some changes to your existing components to ensure they continue to work correctly.


## From 3.3.x to 3.4.x

* The router now matches on the path alone. A URL carrying a query string or a fragment, such as `/orders?status=open`, previously failed to match `/orders` and fell through to the catch-all route. Both are still left on the URL; read them with `location.search` and `location.hash`. See [Routing](routing.html).
* Routes may now name query parameters to receive as attributes, using a `query` attribute on the route. See [Routing](routing.html).
* The `routeChange` event detail is now the matched path. It previously carried whatever URL was passed to the History API, query string and all.
* The `@Component()` decorator no longer returns a value. It defined the custom element and then returned it, which TypeScript rejects because a class decorator may only return the class it decorated. The decorated name has always referred to the controller at runtime; now the types agree. No code changes are required.
* Only `dist` is published. If you were reaching into `fudgel/src` or `fudgel/docs` from an installed copy, import from the package instead.

## From 3.1.x to 3.2.x

* `onViewInit()` and `onParse()` are now always asynchronous and their lifecycle stages no longer pass the `wasAsync` argument.
* Exposed [`lifecycle` function](utilities.html) to allow for custom [lifecycle stages](lifecycle.html).


## From 3.0.x to 3.1.x

* `*for` was made faster. No code changes are required.


## From 2.x.x to 3.x.x

* Parsing expressions changed.
    * `parse()` is now `parse.js()` (one of several parsing functions available).
    * `parsed[0]` now accepts a list of objects to search as opposed to an array.
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
