---
title: Forms (Fudgel.js)
---

# Forms

Form controls keep state of their own, and a few rules of the DOM decide whether a binding reaches it.

## Bind the property, not the attribute

`<input value="{{openBrace}} name {{closeBrace}}">` sets the `value` *attribute*. That works until someone types in the field. An input remembers that it has been edited (the DOM calls this the dirty value flag) and from then on ignores its `value` attribute. A checkbox does the same for `checked` and an option for `selected`.

Bind the property instead, with the [`.` directive](directive-property.html). It assigns `input.value`, which always takes effect.

```html
<input type="text" .value="name" />
<input type="checkbox" .checked="isActive" />
```

```html
<!-- Stops updating once the field has been edited -->
<input type="text" value="{{openBrace}} name {{closeBrace}}" />
```

This matters most inside `*for`. Rows keep their DOM nodes when the list is reassigned, so an attribute binding on a reused row shows whatever was typed into it earlier, not the new record's value. A property binding shows the record. Adding `track` to the `*for` keeps each row with its own record across reorders; see [`*for`](directive-for.html).

## Reading the value back

Bind `@input` to react to what the user typed. `@change` on a text field fires when the field loses focus, which makes a Save button look broken until the user tabs away. `input` fires on every edit, including paste and autofill, and before `change` for every kind of control.

```html
<input .value="name" @input="setName($event.target.value)" />
```

## `<select>`

A `<select>` takes its value from its `<option>` children. When the options come from `*for`, they do not exist yet when `.value` on the select is applied, so the assignment does nothing. Set the value once the options exist: keep the select with [`#ref`](directive-ref.html) and assign `select.value` in `onViewInit()`, and again in `onChange()` when the data the options come from arrives.

## Boolean attributes

`disabled="{{openBrace}} isLocked {{closeBrace}}"` adds the attribute when the expression is truthy and removes it otherwise, because the braces are the entire attribute value. With any character outside the braces the value is a string and the attribute is always present, which for `disabled` means always disabled. See [Bindings](bindings.html).
