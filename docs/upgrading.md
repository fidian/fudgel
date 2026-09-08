---
title: Upgrading (Fudgel.js)
---

# Upgrading

When a new version of Fudgel is released, you may need to make some changes to your existing components to ensure they continue to work correctly.


## From 3.4.x to 4.0.x

Three behaviors changed on purpose.

* An attribute that is absent no longer sets the controller property to `null`; the class field's default stays. Removing an attribute later still sets the property to `null`, and `onChange()` is no longer called for an absent attribute at startup. Code that relied on a declared attribute being `null` when absent should give the field no initial value, or treat `null` and `undefined` alike.
* The index a `*repeat` provides starts at 0, like every other index in JavaScript and like the keys of `*for` over an array. Add 1 where a template shows the number to people.
* In the light DOM, a descendant named after `:host` in a style rule is scoped to the component, so `:host p` no longer styles a `<p>` inside a nested component, which it never did in the shadow DOM. To style content that another component provides, style it from that component.

Everything else needs no code changes. Several behaviors were bugs and now match what the documentation said; check anything that depended on the old behavior.

* Bindings and event listeners are cleaned up when a directive removes their element. Listeners on the window or document from `@event.window`, `.document` and `.outside` used to stay attached forever.
* A getter on the controller's prototype is read each time a binding runs instead of being copied once when the template linked. An accessor on the instance receives the instance as `this` when assigned.
* A global such as `Math` or `Date` in a binding resolves to the global. It used to be shadowed by an undefined controller property.
* Expressions support the conditional operator, `a ? b : c`, and parentheses, `(a + b) * c`.
* `component()` throws when the browser rejects the element name, such as a name without a hyphen. It used to fail silently. A name that is already defined is still skipped.
* A kebab-case name in `attr` or `prop` is accepted as the camelCase one.
* Assigning `true`, `false`, `null` or `undefined` to a property listed in `attr` reflects to the attribute, as documented.
* `@keydown.arrow-left` and other dashed key modifiers work; they never matched before. `@keydown.space` matches the space bar. `@some-event` also listens for the dashed name `some-event`, so events from other libraries bind.
* `*for` accepts an expression with spaces, `*for="x of a ?? b"`, and a `track` clause that keys rows by identity. A row that still exists is moved rather than rebuilt when the list is reordered.
* A growing `*repeat` appends new items after the existing ones instead of inserting them before.
* Light DOM style scoping handles `:host(...)`, `:host-context(...)`, pseudo-elements, and commas inside `:is()` and attribute selectors. A `p::before` rule no longer leaks to the whole page. A selector Fudgel cannot rewrite is reported in the console.
* A structural directive at the end of a template no longer re-links the content it rendered, which could re-read braces in your data as expressions.
* The router routes on the resolved location, so `history.replaceState(state)` without a URL keeps the current route and a relative URL is resolved. Clicks with a modifier key, another button, a `target`, `download`, `rel="external"`, or a fragment on the current page are left to the browser. History is patched once for the page rather than once per router. `RouterComponent` exposes its route elements as `routes`.
* `di()` recovers after a service constructor throws; it used to report a circular dependency forever.
* A property, object key, or route parameter named `entries` works.
* `fudgel` can be imported outside a browser, so services that use `di()` can be unit tested under Node. `require('fudgel')` works, and `package.json` has an `exports` map with `fudgel` and `fudgel/dev`.
* The build is compiled to ES2018 and checked against it, so Safari 11.1 can parse it again.
* New: `import 'fudgel/dev'` while developing prints warnings for common mistakes. See [Getting Started](getting-started.html).
* New types: `StrictController` and `ControllerHooks`. `Controller` no longer declares the `wasAsync` parameter removed in 3.2. `camelToDash` and `dashToCamel` are exported.

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
