---
title: Reactivity (Fudgel.js)
---

# Reactivity

Fudgel has no virtual DOM and no dirty checking. It watches a small set of properties and re-runs exactly the bindings that mention them. Knowing which properties those are, and when a binding runs, answers nearly every "why did this not update" question.

## What triggers a binding

When a template is linked, every binding and directive is parsed as an [expression](expressions.html), and the **top-level identifiers** in that expression are collected. For `{{openBrace}} user.name {{closeBrace}}` that is `user`. For `{{openBrace}} format(date, 'short') {{closeBrace}}` it is `format` and `date`. For `{{openBrace}} canSave() {{closeBrace}}` it is only `canSave`.

Each identifier is looked up in the current scope (the variables a `*for` or another directive created) and then on the controller, and Fudgel watches that property. The binding runs again when the property is **assigned**, and only then.

Two things follow from this.

* Differences are detected with `Object.is()`. Assigning the same value again does nothing. Assigning a new object or array always counts as a change.
* Nothing below the top level is watched. `this.user.name = 'x'` does not re-run `{{openBrace}} user.name {{closeBrace}}`. `this.user = { ...this.user, name: 'x' }` does.

<code-sample sample="samples/expressions-bindings.js"></code-sample>

## Method calls

A method call in a template runs when its binding runs. It is not re-run because something *inside* the method changed; Fudgel cannot see inside it. It is re-run when a top-level identifier in the expression is assigned.

So `{{openBrace}} canSave() {{closeBrace}}` runs once. `{{openBrace}} canSave(name, email) {{closeBrace}}` runs again whenever `name` or `email` is assigned, because those are top-level identifiers in the expression. Pass the values a method depends on as arguments, and the binding follows them.

```html
<!-- Runs once, whatever happens to name and email afterwards -->
<button disabled="{{openBrace}} !canSave() {{closeBrace}}">Save</button>

<!-- Runs again when name or email is assigned -->
<button disabled="{{openBrace}} !canSave(name, email) {{closeBrace}}">Save</button>
```

The other approach is to compute the value in the controller and bind the property: assign `this.isSaveable` whenever the inputs change and use `{{openBrace}} !isSaveable {{closeBrace}}`. Both work. Passing arguments keeps the logic in one place.

## Getters

A getter on the controller's class, such as `get fullName()`, is read fresh each time a binding that mentions it runs. What the getter reads is not watched, so `{{openBrace}} fullName {{closeBrace}}` does not re-run when `first` is assigned. Call `update(this)` after the inputs change, or pass them to a method as arguments as described above.

## Nested changes and `update()`

When data changes below the top level and replacing the object is not practical, call `update(this)` to re-run every binding of one controller, or `update()` for every controller on the page. See [Utilities](utilities.html).

## Loops

Inside `*for`, the loop variables are properties of a scope, and a row's bindings re-run when the row's value is reassigned. When the list itself is reassigned, rows are matched to items by key: the index for an array, the key for an object or Map. A row whose key is still present keeps its DOM nodes and receives the new value; the rest are removed. Add `track` to match rows by identity instead of position. See [`*for`](directive-for.html).

## Attributes and properties

A property named in `attr` or `prop` is watched the same way. A change to the attribute or the element property assigns the controller property, which re-runs its bindings and calls `onChange()`. `onChange()` also runs for the initial values, before `onInit()`. See [Lifecycle](lifecycle.html).

## Globals

An identifier that is neither in scope nor on the controller is read from `window`, so `{{openBrace}} Math.max(a, b) {{closeBrace}}` and `{{openBrace}} JSON.stringify(obj) {{closeBrace}}` work, and re-run when `a`, `b` or `obj` is assigned. Declare the properties your templates use as class fields, so a misspelled name is a property Fudgel can watch rather than a global lookup that finds nothing. While developing, `fudgel/dev` warns about a name that resolves to nothing; see [Getting Started](getting-started.html).
