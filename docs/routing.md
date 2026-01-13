---
title: Routing (Fudgel.js)
---

# Routing

A declarative, minimalistic router is shipped with Fudgel. With this, you can declare routes, have named parameters, match routes on regular expressions, instantiate custom web components, and track the browser's location through the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).  There's a section later in this document if you're interested in using hashes instead.

## Overly Complex Example

Let's show you how it works with a fairly elaborate bit of code.  Don't worry, each feature and option will be explained again later.

<code-sample sample="samples/routing-example.js"></code-sample>

Try playing with the live demo and you can see that routing does indeed work. There's also custom component instantiation, passing route parameters as attributes, setting the document title, automatically handling links, and more. There's a lot to unpack, so each of the following sections will talk about specific aspects.

## Defining the Component

The router component is not declared automatically when you import Fudgel. This is to allow for better tree shaking, so you can pick and choose what you want to use from the library. This technique of exporting a component definition function also allows a developer to deal with custom component name collisions or to swap in a different router more easily.

<code-sample sample="samples/routing-define-router-component.js" no-playground></code-sample>

This creates a new custom element named `<app-router>`. For the rest of the examples in the documentation, we will use `<app-router>` as the router element name, but you can substitute your own name if you like.

## Creating Routes

Any direct child of the router element is able to be routed.  If it has a path, then the path is matched against the URL and all specified segments must match (more on this later). If there is no path, then it defaults to "**", which matches all paths.

<code-sample sample="samples/routing-routes.html"></code-sample>

Route matching will match entire path segments but ignore segments in the URL that don't exist in the path, plus only the first matching route will be shown. Make sure you order the children from most specific path to least specific. For example, the route `/user/123` correctly maps to "Show info for a specific user", but `/store/123` will scan through the elements and stop on "Show store list" because it matches the beginning of the URL first.

Some more examples of routing with the above example:

* URL: `/` → Result: "This matches everything"
* URL: `/user` → Result: "Show user list"
* URL: `/user/` → Result: "Show user list"
* URL: `/user/1234` → Result: "Show info for a specific user

Elements that are routes can have several attributes to control what they do.

* `component` - When the path matches, create an element with this name. If the path has named parameters, assign them to the created element as attributes.
* `path` - The URL to match against. Can use named parameters, such as `:id` with a leading colon and the values are all assigned to the element as attributes. Can use wildcards; `*` matches a single path segment, `**` matches one or more path segments. Can use a regular expression when combined with `regexp` attribute.
* `regexp` - By including this attribute, the `path` attribute will be interpreted as a regular expression.
* `title` - When the route matches, change the document's title to match this attribute.

<code-sample sample="samples/routing-route-attributes.html"></code-sample>

Be careful about custom components - you must either use the `component` attribute to initialize them as shown above, or you need to wrap all of your routes in a `<template>` element. Failure to do either of these methods will cause your component to be instantiated and then copied, which will probably not work well for any event bindings.

<code-sample sample="samples/routing-with-components.html" no-playground></code-sample>

Named parameters are passed to elements as attributes. The named parameters are expected to be written in camel case, such as `/user/:userId` in the example below. This will get changed into the attribute `user-id` on the HTML element because attributes are case-insensitive. You can see this if you inspect the DOM of the live example.

To make the effect more obvious, a Fudgel component named `show-user` sets up the internal property `this.userId` to mirror the element's `user-id` attribute, and the template shows the current user ID. This allows the example to be seen and prove that everything's working as expected without involving any debug tooling.

<code-sample sample="samples/routing-parameters.js"></code-sample>

## Navigation

An event listener is added to `document.body` that waits for all clicked links. When one is found, it will be checked to see if it is within the current page. If so, the event's default navigation is prevented and the history state is updated with the new URL.

The [History API](https://developer.mozilla.org/docs/Web/API/History) is patched in order to capture routing events, so your application can use `history.pushState(null, null, url)`, `history.back()` and all of the other methods to navigate.

You can also get a reference to the router element and call it's `go(url)` method.

The [Navigation API](https://developer.mozilla.org/docs/Web/API/Navigation) is not used because it is experimental and isn't [widely adopted](https://caniuse.com/mdn-api_navigation) enough.

<code-sample sample="samples/routing-navigation.js" no-playground></code-sample>

## Getting Notified

When the router notices changes to the location, a custom `routeChange` event is triggered on `document.body`. Note that the same route can be emitted multiple times when there are multiple routers used for nested routing.

<code-sample sample="samples/routing-notification.js"></code-sample>

## Watch Out For Problems

Because this is a simplistic router, there is the caveat that elements within need to be static. Do not add or remove elements, which means avoiding the use of structural directives within the router element and its children. If you need to do this, consider making the route into a component and let the router initialize the component.

## What About Using Hashes?

This router manipulates the History API for the following reasons:

* URLS look more "normal" to users. Seeing hashes in URLs makes people wonder because it's unusual.
* Links can operate normally and can operate in a single-page application. I can send a URL to a friend and it could still work.
* Better SEO. Search engines have a bit more difficulty traversing hash-based routes. Google used to suggest using the prefix "#!", but has now dropped it because of the History API.

**But what if I need to use hashes?** Yes, I was in the same situation with a static file server and no way for me to serve the same `index.html` for all of the routes in the application. Fortunately, it might be possible to create a custom 404 page. If you can, put this in your 404 page and it will make the browser turn it into a 301 status code, which does index well.

<code-sample sample="samples/single-page-app-404.html" no-playground></code-sample>

This will store the location in session storage and redirect you immediately to the single page app. Inside your app, before any other code, you will need to add this JavaScript to restore the location.

<code-sample sample="samples/single-page-app-restore-location.js" no-playground></code-sample>

This technique is provided from [S(GH)PA: The Single-Page App Hack for GitHub Pages](https://backalleycoder.com/posts/sghpa-the-single-page-app-hack-for-github-pages/) by Daniel Buchner.

## Need More Functionality?

This is just a slimmed-down version of a few other fantastic web component routers that were combined. This router's goal is to be fairly minimal and provide enough for most smaller projects.  If you are looking for something with a bit more pizzaz, check these out.


* [a-wc-router](https://github.com/colscott/a-wc-router) by Colin Scott
* [app-router](https://github.com/erikringsmuth/app-router) by Erik Ringsmuth
* [router-component](https://github.com/markcellus/router-component) by Mark Cellus
* [router-sample](https://github.com/jasimea/router-sample) by Jasime Alvarado
