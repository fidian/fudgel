---
title: Content Projection (Fudgel.js)
---

# Content Projection

Imagine you have a utility function to create a styled button.  You'd like the ability to specify the HTML that is displayed on the button, but passing that in via an attribute or property is problematic, especially when you want to have an image on the button. There are two ways you have access to outside content in order to "project" it into your element.

## Normal Process Without Content Projection

Extra content within the custom element will be removed. The DOM elements will be present during `onInit()` and are removed before `onViewInit()`. Both of these are detailed in <a href="lifecycle.html">Lifecycle</a>.

If you wanted this content to be copied into your component, this is easily done using one of the following methods.

## Slots and Shadow DOM

You can use slotted content when your element enables `useShadow: true` in its [configuration](component-config.html). This leverages built-in browser features and works well. To project content, use the `<slot>` element.

You can also project multiple pieces of content into specific areas using named slots. Read more about [`<slot> elements`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) and [`slot` attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/slot).

<code-sample sample="samples/slot-example.html"></code-sample>

## Slots and Light DOM

There is no browser-native support for slots in the light DOM, however Fudgel can provide similar functionality. First, you need to define the custom slot-like element, and after that point all components will have `<slot>` elements rewritten automatically to work as expected. This means you can keep your template looking the same whether using light DOM or shadow DOM.

This slot substitute doesn't work well for changing content.  Avoid using this when your content uses structural directives or otherwise adds/removes elements.

<code-sample sample="samples/slot-like-example.html"></code-sample>

How does this work? Calling `defineSlotComponent()` will define the custom component with the default name of `slot-like`, which you can change by using `defineSlotComponent('custom-element-name')`. Please make sure you do this right away, before your custom elements get created. This function watches for component creation within Fudgel so all light DOM components will have their template rewritten, changing `<slot>` elements into `<slot-like>` elements. This template change happens once during each components initial definition. If the component uses `<slot-like>`, then extra functionality is added to help support content projection.

The downside of this method is that you may see a flicker of the original DOM before it is put into the right places within your component. This is because the DOM structure is built before the template overrides the node's content.

`<slot-like>` is designed to be a lightweight substitute for the native `<slot>` element, including support for named slots.

## Manual Content Retrieval

Your controller can access the custom element and pull its children using a query selector, walking the DOM, or other techniques. Make sure you capture the content during `onParse()` and then add the content to the DOM in `onViewInit()` because the element is cleared and the template is applied between these two method calls. Learn more about these <a href="lifecycle.html">Lifecycle</a>.

One advantage of using this technique is the template element is not rendered, so it can avoid the flicker of the slot-like approach.

<code-sample sample="samples/manual-content-projection.html"></code-sample>
