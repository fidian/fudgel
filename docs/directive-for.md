---
title: *for Directive (Fudgel.js)
---

# `*for` Directive

Iterating across an object, array, set, map, or any other iterable is handled through the `*for` [directive](directives.html). This also automatically updates when the property on your controller is assigned to a new value. The key and the value will be available in the [expression](expressions.html) as `key` and `value`.

<code-sample sample="samples/directive-for.js"></code-sample>

You can rename `key` and `value` to suit your needs. Also, nested scopes inherit from each other, exactly how you think they should. Scopes are discussed more on the [Expressions](expressions.html) page.

<code-sample sample="samples/directive-for-named.js"></code-sample>

The iterable is any [expression](expressions.html), spaces included: `*for="row of rows ?? []"`.

## Keys and Reuse

Each item has a key: the index for an array, the property name for an object, and the key for a `Map`. When the list is reassigned, an item whose key is still present keeps its row. The row's DOM nodes stay where they are, the value in scope is reassigned, and its bindings update. Rows whose keys are gone are removed and new keys get new rows.

Because arrays are keyed by index, a reordered array keeps row 0 as row 0 and changes what it shows. That is fine for plain text. It is a problem for a row that holds state of its own, such as an input someone has typed in or a child component: the state stays at the position while the record moves.

## `track`

Add `track` with an expression to key rows by identity instead of position. The expression is evaluated with the loop variables in scope.

```html
<div *for="row of rows track row.id">
    <input .value="row.name" />
</div>
```

A row now follows its record. Reversing the array moves the row elements; inserting at the front adds one row and leaves the others alone; and a row keeps whatever was typed into it.

## Common Errors

Make sure to use `of`. If you use `in`, it will not work and instead you would be iterating over a boolean value, which is not iterable. `fudgel/dev` warns about this.
