---
title: Fudgel - Lightweight Web Component Library
---

<style>
    .topContent {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .logo {
        max-width: 200px;
    }

    .titleBlock {
        padding-left: 1em;
    }

    .title {
        font-size: 3em;
    }

    .subtitle {
        font-size: 1.8em;
        padding-top: 0.5em;
    }

    .flexAlign {
        align-items: flex-start;
    }

    @media (max-width: 768px) {
        .logo {
            max-width: 160px;
        }

        .title {
            font-size: 2.2em;
        }

        .subtitle {
            font-size: 1.4em;
        }
    }

    @media (max-width: 480px) {
        .topContent {
            flex-direction: column;
        }

        .titleBlock {
            padding-left: 0;
        }

        .flexAlign {
            align-items: center;
        }
    }
</style>

<div class="flexAlign topContent">
    <img src="logo.png" alt="Fudgel Logo" class="logo" />
    <div class="titleBlock">
        <div class="title">Fudgel</div>
        <div class="subtitle">Write less. Do more.</div>
    </div>
</div>

### Easy and Lightweight Web Components

Do you miss working with plain JavaScript and HTML? Are other frameworks causing pain or bloating your project? Tired of a slow transpile step? Fudgel allows you to write web components easily using familiar JavaScript classes and HTML, staying out of your way and making your life more effortless.

Event bindings are added automatically, calling methods in your controller class. Property changes in your controller automatically update the HTML. Integrates seamlessly with Angular, React, and other frameworks. All of this is done while keeping the bundle size very small, so your users aren't waiting for a massive download just to see your content.

Fudgel uses about <span style="font-size: 1.2em">7k</span> to provide:

-   Automatic DOM updates when properties change
    -   Add and remove elements, classes, loop over data, events, and more
    -   Lifecycle triggers exposed as events and controller methods
-   Creates a custom element using standard Web Component APIs
    -   Two-way property and attribute bindings, plus events for passing data
    -   Works with all major frameworks (eg. Angular, React, Vue, Svelte, etc.)
-   Supports both Shadow DOM and Light DOM rendering
    -   Styles scoped to your component automatically, even when not using Shadow DOM
    -   A simplistic `<slot-like>` element for content projection in the Light DOM
-   Building is optional; works with vanilla JavaScript
    -   Can use the library directly in the browser
    -   Fully tree-shakeable for smaller bundle sizes
    -   Published as both UMD and a module
-   Taking care of developers and security-conscious teams
    -   Works even with "Content-Security-Policy" directives (inline styles could break with a _really strict_ policy)
    -   Full TypeScript support
    -   Dependency injection for services, with overrides for testing

<code-sample sample="samples/welcome-to-fudgel.json"></code-sample>

In the above example, a new custom element is defined. Whenever you use the new HTML element `<my‑custom‑element>`, it will automatically insert "Hello Developer, welcome to Fudgel!" as text. Because of the timeout set up in `onInit` (a lifecycle method), in five seconds the text automatically changes to "Hello Super Developer, welcome to Fudgel!"

Web components make great additions to your browser-based UI because they work everywhere. Self-contained chunks of functionality that can eliminate lots of work on your side. Also, upgrading them or upgrading your existing framework is easier because their dependencies are built into the custom element. The downside is a bit of extra size from the wiring that has to take place, but Fudgel limits that to just the necessities.

<div style="display: flex; flex-direction: column; align-items: center">
<fudgel-sizes></fudgel-sizes>
<playground-button js="fudgel-sizes.js"></playground-button>
</div>

As a comparison, just the HTML for this page is about the same size (excluding JavaScript, CSS, images, and fonts). A standard "Hello, world!" style project using Angular is reported at 35k and React is about 46k; however, both project sizes can vary immensely. With Fudgel, you're looking at adding under 100 bytes to the library size.

## Browser Support

98% of browser traffic work with Fudgel. Here is a list of the minimum supported browser versions:

|      Browser     | Version | Released |
|:----------------:|:-------:|:--------:|
|      Chrome      |    71   | Dec 2018 |
|       Edge       |    79   | Jan 2020 |
|      Safari      |   12.1  | Mar 2019 |
|      Firefox     |    69   | Sep 2019 |
|    iOS Safari    |   12.2  | Mar 2019 |
| Samsung Internet |   10.1  | Sep 2019 |

If you need to support slightly older versions, look at Fudgel 2.x.

See the details on the most restrictive browser features required to run Fudgel using [CanIUse.com feature list](https://caniuse.com/?feats=mdn-html_elements_slot,template,mdn-api_customelementregistry,mdn-api_shadowroot,mdn-javascript_builtins_weakmap,mdn-javascript_builtins_object_getprototypeof,proxy,wf-queuemicrotask). At the bottom, click "Show Summary", "Intersection" and change usage to "all tracked".

## Goals and Prior Work

This project has received the benefit of having others blaze trails in related areas. Thanks to the following projects for their inspiration:

-   [Slim.js](https://slimjs.com/) provided the starting point that a lightweight library can contain lots of functionality, such as the automatic bindings and text parser.
-   [Angular](https://angular.io/) lifecycle hooks and structural directives were useful to mimic.
-   [Alpine.js](https://alpinejs.dev/) has event handlers using `@` prefixes and modifiers.
-   [Vue.js](https://vuejs.org/) is big into using slots for content projection, plus they also have event handlers with modifiers.
-   [Skruv](https://skruv.io/) is a small library that's similar to Slim.js and is the inspiration for the CSS scoping.
-   [jsep](https://github.com/EricSmekens/jsep) is how the basis for how expressions are parsed within templates without using "eval()" or "new Function()".
-   [a-wc-router](https://github.com/colscott/a-wc-router) inspired the `<slot-like>` element for [content projection](content-projection.html) in the light DOM.

## Best Practices

Do not register your custom element in your exported module. That does not allow other developers to resolve conflicts. If your custom element is named "heading-bar" and another library uses the same named element, the conflict is unable to be worked around. Instead, export a function that allows another developer to prefix your element and any other custom elements you require.

In general, you want your element to accept data into the controller using attributes (strings) and properties (any data). Attributes have universal support, where as most support properties. When you need to send data out of your controller, send an event.
