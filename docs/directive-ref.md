---
title: #ref Directive (Fudgel.js)
---

# `#ref` Directive

At times, you may need to get an element reference and use it in your controller. By marking an element with the `#ref` [directive](directives.html) in your template, that same property will be assigned the element reference when it is added to the DOM.

<code-sample sample="samples/directive-ref.js"></code-sample>

Technically, with this simple example, you could use `inputField.focus()` directly without a controller.  This example just makes it more clear that the property is added to the controller.

## Caveats

The element reference is not removed when the element is removed from the DOM.
