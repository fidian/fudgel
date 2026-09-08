---
title: Gotchas and FAQ (Fudgel.js)
---

# Gotchas and FAQ

Each entry is a symptom, the reason, and the fix. Most of them are things Fudgel does on purpose that are not obvious the first time. Importing `fudgel/dev` while developing turns several of them into console warnings; see [Getting Started](getting-started.html).

## My element never upgrades

A custom element name must contain a hyphen. `component('badname', ...)` throws the browser's own error; `component('bad-name', ...)` works. A name that is already defined is skipped without an error, so the same library can be loaded twice.

## A property I set with `.isSaveable` never changes

HTML lowercases attribute names, so Fudgel receives `.issaveable`. Write `.is-saveable`. The same applies to attributes: `parentSection="x"` never reaches `parentSection`; `parent-section="x"` does. See [Naming Conventions](naming.html).

## `{{openBrace}} canSave() {{closeBrace}}` never updates

A binding re-runs when a top-level identifier in its expression is assigned, and `canSave` is never assigned. Pass the values it depends on as arguments, `{{openBrace}} canSave(name, email) {{closeBrace}}`, or compute the result into a property. See [Reactivity](reactivity.html).

## An input in a `*for` row shows the wrong text after the list changes

`value="{{openBrace}} row.name {{closeBrace}}"` sets an attribute the input ignores once it has been edited, and rows are reused by position. Bind `.value="row.name"` and add `track row.id` to the loop. See [Forms](forms.html) and [`*for`](directive-for.html).

## A `<select>` shows the wrong option

Its options did not exist yet when `.value` was applied. Set `select.value` from `onViewInit()` and `onChange()` through a `#ref`. See [Forms](forms.html).

## The content I put inside my element disappeared

A light DOM component clears its children and applies its template. To project them, either use `useShadow: true` and `<slot>`, or call `defineSlotComponent()` once before defining components so `<slot>` is rewritten to work in the light DOM. Without one of those a `<slot>` in a light DOM template does nothing. See [Content Projection](content-projection.html).

## Route `/config/pay-policy` shows the `/config` page

Routes match in order and a route matches any longer path, so `/config` also matches `/config/pay-policy` when it comes first. List longer paths before shorter ones. See [Routing](routing.html).

## Navigating between two ids of the same route does not reload

The router reuses the element when the same route matches again and only changes its attributes, so `onInit()` does not run a second time. React in `onChange()`. See [Routing](routing.html).

## How do I navigate from a component that has no reference to the router?

Call `history.pushState(null, '', '/some/path')` from anywhere. The router listens to the History API. See [Routing](routing.html).

## Moving an element somewhere else in the DOM reset it

Removing an element and appending it elsewhere disconnects and reconnects it, and a reconnected element gets a new controller. Libraries that reorder rows by moving nodes trigger this. Keep state that must survive a move in a service obtained with `di()`, or clone the element instead of moving it. See [Lifecycle](lifecycle.html).

## `#ref` inside `*for` gives me only the last row

Every row assigns the same controller property, so the last one wins. Use `$event.target` in an event handler, or give each row a component of its own.

## `onChange()` ran before `onInit()`

It always does for the initial attribute and property values, once per declared name. See [Lifecycle](lifecycle.html).

## An attribute that is absent made my property `null`

A property listed in `attr` receives the attribute's value, and `null` when the attribute is absent, replacing the class field's default. Treat absence as `null` in the controller. (This changes in 4.0, where an absent attribute leaves the default alone; see [Upgrading](upgrading.html).)

## The template shows nothing where my expression is, and the console has an error

The expression did not parse. Fudgel logs the expression, the binding evaluates to `undefined`, and the other directives on the element still link. See [Expressions](expressions.html) for what is supported.

## `*for="item in list"` renders nothing

`*for` iterates with `of`. With `in` the expression is `item in list`, the `in` operator, which is a boolean and iterates nothing.

## Changing `user.name` did not update `{{openBrace}} user.name {{closeBrace}}`

Only top-level properties are watched. Reassign `user` with a new object, or call `update(this)`. See [Reactivity](reactivity.html).

## `fieldset[disabled]` does not disable controls inside my component

That is the browser: a disabled fieldset does not reach into a shadow root. Either keep such components in the light DOM or pass the disabled state as a property.

## A `p::before` rule in my component styled every paragraph on the page

Fixed in 3.5. Earlier versions produced an invalid scoped selector for pseudo-elements and the browser kept the unscoped original. If the console reports "Unable to scope selector", the selector is one Fudgel could not rewrite; simplify it.
