---
title: *for Directive (Fudgel.js)
---

# `*for` Directive

Iterating across an object, array, set, map, or any other iterable is handled through the `*for` [directive](directives.html). This also automatically updates when the property on your controller is assigned to a new value. The key and value will be available in the [expression](expressions.html) as `key` and `value`.

<code-sample sample="samples/directive-for.js"></code-sample>

You can rename `key` and `value` to suit your needs. Also, nested scopes inherit from each other, exactly how you think they should. Scopes are discussed more on the [Expressions](expressions.html) page.

<code-sample sample="samples/directive-for-named.js"></code-sample>

## Common Errors

Make sure to use `of`. If you use `in`, it will not work and instead you would be iterating over a boolean value, which is not iterable.
