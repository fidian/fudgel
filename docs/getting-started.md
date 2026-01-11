---
title: Getting Started (Fudgel.js)
---

# Getting Started

<u>Step 1:</u> Install Fudgel or include it into your project. This can take several forms, depending on your needs. This can be loaded from a CDN (as shown below, both as UMD or a module), or installed locally as a package.

<code-sample sample="samples/umd-from-cdn.json"></code-sample>

<code-sample sample="samples/module-from-cdn.json"></code-sample>

Installing locally as a package is simple.

* `npm install fudgel`
* `yarn add fudgel`
* `bower install fudgel`


<u>Step 2:</u> At this point you have access to the `Fudgel` object or the module's exports. It's time to write your first controller. Select the chunk of code that best fits your needs.

<code-sample sample="samples/hello-world-module.json"></code-sample>

<code-sample sample="samples/hello-world-umd.json"></code-sample>

<code-sample sample="samples/hello-world-typescript.json"></code-sample>

<u>Step 3:</u> You've already made a custom element at this point. What's left is adding content to the template and handling actions by users. Investigate the following topics to learn more about Fudgel's features.

* [Bindings](bindings.html) - Connect the template to a controller.
* [Events](events.html) - Respond to user actions.
* [Input](input.html) - Receive information from outside.
* [Styling](styling.html) - Style using either Light DOM or Shadow DOM.
