Fudgel
======

Want to investigate web components but don't like the amount of overhead needed to add and remove elements? Feel like making a custom element that can work with any framework, yet shudder when you think of the heavy lifting that's required to automatically update text shown in the browser? Need a reason to reduce the amount of code overhead while still feeling a sense of relief when you realize that other tools are doing the majority of the work?

Introducing Fudgel: Write less. Do more.

This lightweight (under 5k minified and gzipped) library gives you many of the powerful features of today's frameworks without the annoyance of the bulk. No build system is required; you can write plain JavaScript. This fully supports tree shaking, TypeScript, and augmentation as your needs grow.

For detailed information and live examples, check out the [documentation site](https://fudgel.js.org). Offline? Hopefully you were able to install dependencies with `npm install` while you were online, then use `npm run start` to view the documentation locally.

Upgrading
---------

* 1.2.0
    * Went back to shadow DOM styles, so change `:scope` to `:host` in your
      styles. This will automatically be changed to work if your element only
      uses light DOM.
    * Initialization of the `slot-like` custom element (using any name) will
      automatically register it for use for all light DOM elements. You no
      longer need to call `slotInit()` for slots to work in light DOM
      components.
* 1.0.0
    * In order to work with Content-Security-Policy settings, function
      generation using `new Function()` has been removed. A new expression
      parser is added, so your bindings now will change. Remove `this` and
      `$scope` from your templates and everything should work. Properties will
      now be looked up in `$scope` first and fallback to `this` (the
      controller) if not found. For example, `{{this.person.firstName}}`
      becomes `{{person.firstName}}` and `{{this.update($scope.key,
      $scope.value, true)}}` becomes `{{update(key, value, true)}}`.
