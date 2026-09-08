---
title: Styling Components (Fudgel.js)
---

# Styling Components

Web components need styling in order to look good. Fudgel helps with styling by scoping your styles so they don't automatically affect the rest of the page. This is done using a few different techniques, based on what the browser supports. Before we dive into those more complicated questions, let's look at one example.

<code-sample sample="samples/basic-styling.js"></code-sample>

This styles the host element to have a light yellow background, a border, and some padding. The paragraph inside has blue text.

The `css` template function does not do anything special. It's only there as a flag to outside build tools to indicate that this string contains CSS. It's detailed more in the [utilities](utilities.html) section.

## Styling the Host Element

The above example used the `:host` pseudo-class to style the host element itself. This works in both Light DOM and Shadow DOM, thanks to Fudgel's CSS rewriting. One less thing to remember and your component could switch between Light DOM and Shadow DOM without changing your styles.

## Selectors Fudgel Rewrites

In the light DOM, `:host` becomes the element's tag name, `:host(.active)` becomes `my-tag.active`, and `:host-context(.dark) p` becomes `.dark my-tag p`. Every other selector is prefixed with the tag name and given the component's class on its last part, so `p::before` becomes `my-tag p.fudgel_my-tag::before` and `:is(a, b) span` keeps its comma. In the shadow DOM the host forms are left as they are and descendants receive the class, so a nested light DOM component inside the shadow root is not styled by accident.

If a selector cannot be rewritten into one the browser accepts, Fudgel logs "Unable to scope selector" and the rule is left unscoped. Simplify the selector if you see that message.

## Avoiding Style Scoping

When your custom element needs to inject other DOM elements, they will not have the generated class name applied automatically. This will affect your CSS. For instance, the code samples seen on this page leverage [Highlight.js](https://highlightjs.org/) to colorize the code. These elements are dynamically added to the DOM and need to be styled, so the component needs to inject the styles itself.

Fudgel will not modify any styles that are in a `<style>` tag in your template.

<code-sample sample="samples/avoid-style-scoping.js"></code-sample>

## Light DOM

<code-sample sample="samples/styling-example-light-dom.html"></code-sample>

If you go into the playground and try it out, you'll see a regular button and a larger, styled button. The larger button is styled through `:host` in the component's `style` configuration. Normally that only works for Shadow DOM, but Fudgel rewrites it so there's one syntax for both Shadow DOM and Light DOM.

You might now wonder about the styling for `button` and why both buttons aren't extra large. Keen observation!  Fudgel automatically scopes your styles so they don't leak out to the rest of the page. This is done by rewriting your CSS to target only your component. Your component's HTML template is also rewritten to include the necessary classes for scoping.

This is effectively what Fudgel would generate for the above component.

<code-sample sample="samples/styling-example-light-dom-generated.html" no-playground></code-sample>

## Shadow DOM

Things are slightly different for Shadow DOM. This next example simply changes `useShadow: true` to leverage Shadow DOM.

<code-sample sample="samples/styling-example-shadow-dom.html"></code-sample>

Because of the encapsulation provided by Shadow DOM, Fudgel doesn't need to do as much to rewrite your CSS for scoping. Here would be what Fudgel generates for the above example component.

<code-sample sample="samples/styling-example-shadow-dom-generated.html" no-playground></code-sample>
