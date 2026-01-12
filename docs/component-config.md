---
title: Component Config (Fudgel.js)
---

# Component Config

The `component()` function will create a new element and register it with
`window.customElements` as long as the element was not yet defined. The newly
defined custom element will be assigned a constructor of `FudgelElement`, not
your class. This is done to allow you to utilize any property in your class
without fear of overwriting something important to `HTMLElement`.

The call to `component()` accepts three parameters:

1. The name of the custom element, which must contain a hyphen and be a valid
   custom element name.
2. An object containing configuration to define for the new element.
3. An optional class to instantiate as the controller.

<code-sample sample="samples/hello-world-module.js"></code-sample>

If you use TypeScript, you can also use the `@Component()` decorator, which takes only the first two parameters; the element name and the object of static values.

<code-sample sample="samples/hello-world-typescript.js" no-playground></code-sample>

## Configuration

The configuration supplied as the second parameter will define the template,
styles, and if the Shadow DOM will be used. This is done by setting the
following properties in the object.

### `attr` (optional, array of strings)

Monitor these attributes on the element for changes. When a listed attribute is changed, the controller's matching property name will be updated to match the new value, the `change` event will be fired, `onChange()` will be called, and any bindings using that property will be updated.

Attributes are always in camelCase in this list, even though they are in kebab-case in HTML. For example, to monitor the `data-value` attribute, you would add `"dataValue"` to this list and the controller's `.dataValue` property will be updated.

When the controller's property is changed, the attribute will be updated accordingly in the DOM. Make sure to assign only string values to properties that are linked to attributes, as attributes can only hold string values.

When a name is listed in both `attr` and `prop`, the most recently changed source (attribute or property) will update the other.

Learn more about [component inputs](input.html) and how attributes and properties work.

### `prop` (optional, array of strings)

Performs two-way mirroring of these properties, linking the element's property to the controller's property. When either one is changed, the other will be updated to match, the `change` event will be fired, `onChange()` will be called, and any bindings using that property will be updated.

Properties can hold any type of value, including objects and dates.

When a name is listed in both `attr` and `prop`, the most recently changed source (attribute or property) will update the other.

Learn more about [component inputs](input.html) and how attributes and properties work.

### `style` (optional, string)

CSS styles for your custom element. These will be added to the document when your element is used. The technique changes if you are using the Shadow DOM or not.

Shadow DOM: A `<style>` element is added inside your component when it is created. Style your host element using the `:host` selector, as is normal.

Light DOM: The CSS styles are scoped to your element (plus the template elements are scoped), then the styles are added to the parent document when the component is added. If the parent document already has the styles in play, these are not added again. Style your host element using the `:host` selector, which will automatically be changed to your element's name.

Learn more about [styling components](styling.html).

### `template` (required, string)

This is the HTML that the element will use for its content. This template will be processed in the controller's scope, even when passing content to child custom elements (such as with content projection through slots).

When using an empty string, it will be up to the controller to add the necessary DOM elements and bindings. Elements dynamically added to the DOM through your controller will not be scoped automatically, so you must style them with an embedded `<style>` tag or add the generated class names yourself. This is discussed more in [styling components](styling.html).

### `useShadow` (optional, boolean)

If truthy, encapsulate the component inside a shadow DOM. This is `false` by default because the shadow DOM has a slight performance hit and has specific design trade-offs that may not suit your needs.
