---
title: Event @ Directive (Fudgel.js)
---

# Event `@` Directive

Event handler [directives](directives.html) are bound with a `@` prefixed attribute. The event that triggered the action is available as `$event` within the [expression](expressions.html).

<code-sample sample="samples/directive-event.js"></code-sample>

Event handlers can also have modifiers, indicating what should be done with the event. These are separated by a period and appear after the event name, always in kebab-case. They get changed into camelCase within Fudgel; only lowercase letters are allowed for HTML attributes.

* `capture` - Dispatch the event to the registered listener before dispatching to any event targets beneath it in the DOM tree.
* `document` - Bind the event to the document.
* `once` - Invoke the listener at most once.
* `outside` - Bind the event to the document and only fire when it happens from outside of the targeted element.
* `passive` - Signifies that this event is passive and the developer will not call `preventDefault` on the event, allowing the engine to tweak how the event is processed.
* `prevent` - Calls `preventDefault` on the event.
* `self` - Only fires the event when the click is on the target element.
* `stop` - Calls `stopPropagation` on the event.
* `window` - Bind the event to the window.

To help illustrate how these work, consider the following example:

<code-sample sample="samples/test-events.js"></code-sample>

You can also fire events only when certain key combinations are pressed.

* `alt` - The alt key must be pressed.
* `ctrl` - The control key must be pressed.
* `meta` - The meta key must be pressed, which is the same as the Command key on Mac or Super key on Windows.
* `shift` - The shift key must be pressed.
* `exact` - The exact key combination must be pressed. This means using `keypress.ctrl.exact` only fires when a control-key combination is pressed but will not fire if the shift key is also pressed.

<code-sample sample="samples/test-keyboard-events.js"></code-sample>

Finally, any other event modifier will be treated as a key value. This means using `keypress.a` will only fire when the "a" key is pressed. Key values are listed on [MDN's Keyboard Event Key Values page](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values). Make sure to use all lowercase and kebab-case names, such as `keypress.enter` and `keypress.arrow-left`.

Some keys are difficult to represent as HTML attributes, so you can use their ASCII values or code point values, such as `keypress.code-32` for space (hex 0x20, ASCII code point 32) and `keypress.code-252` for ü.

<code-sample sample="samples/test-key-value-events.js"></code-sample>
