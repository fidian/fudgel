---
title: Getting Started (Fudgel.js)
---

# Getting Started

<u>Step 1:</u> Install Fudgel or include it into your project. This can take several forms, depending on your needs. This can be loaded from a CDN (as shown below, both as UMD or a module), or installed locally as a package.

<code-sample sample="samples/umd-from-cdn.html"></code-sample>

<code-sample sample="samples/module-from-cdn.html"></code-sample>

Installing locally as a package is simple.

* `npm install fudgel`
* `yarn add fudgel`
* `bower install fudgel`


<u>Step 2:</u> At this point you have access to the `Fudgel` object or the module's exports. It's time to write your first controller. Select the chunk of code that best fits your needs.

<code-sample sample="samples/hello-world-module.js"></code-sample>

<code-sample sample="samples/hello-world-umd.html"></code-sample>

<code-sample sample="samples/hello-world-typescript.js" no-playground></code-sample>

<u>Step 3:</u> You've already made a custom element at this point. What's left is adding content to the template and handling actions by users. Investigate the following topics to learn more about Fudgel's features.

Component creation and configuration:

* [Best Practices](best-practices.html) - How to get the most benefit and avoid problems.
* [Component Config](component-config.html) - Configure your component.
* [Styling](styling.html) - Style using either Light DOM or Shadow DOM.

Directives and data bindings used within the templates:

* [Bindings](bindings.html) - Connect the template to a controller.
* [Directive Basics](directives.html) - Overview of directives.
* [Event `@` Directive](directive-event.html) - Respond to user actions.
* [Property `.` Directive](directive-property.html) - Set properties on elements.
* [`#class` Directive](directive-class.html) - Conditionally set CSS classes.
* [`#ref` Directive](directive-ref.html) - Reference elements in your controller.
* [`*for` Directive](directive-for.html) - Repeat elements based on data.
* [`*if` Directive](directive-if.html) - Conditionally include elements.
* [`*repeat` Directive](directive-repeat.html) - Repeat elements a number of times.

Data flow:

* [Content Projection](content-projection.html) - Insert user content into your component.
* [Events](events.html) - Communicate using custom events.
* [Input](input.html) - Receive information from outside.
* [Output](output.html) - Send information to outside.

Everything Else:

* [Expressions](expressions.html) - Use expressions in bindings and directives.
* [Lifecycle](lifecycle.html) - Respond to component lifecycle stages through events and methods.
* [Routing](routing.html) - Create single-page applications with routing.
* [Upgrading](upgrading.html) - Upgrade from older versions of Fudgel to the current version.
* [Utilities](utilities.html) - Helpful utility functions provided by Fudgel.
