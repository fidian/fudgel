Fudgel
======

Want to investigate web components but don't like the amount of overhead needed to add and remove elements? Feel like making a custom element that can work with any framework, yet shudder when you think of the heavy lifting that's required to automatically update text shown in the browser? Need a reason to reduce the amount of code overhead while still feeling a sense of relief when you realize that other tools are doing the majority of the work?

Introducing Fudgel: Write less. Do more.

This lightweight (under 8k minified and gzipped, under 6k if you only use `component()`) library gives you many of the powerful features of today's frameworks without the annoyance of the bulk. No build system is required; you can write plain JavaScript. This fully supports tree shaking, TypeScript, and augmentation as your needs grow.

For detailed information and live examples, check out the [documentation site](https://fudgel.js.org). Offline? Hopefully you were able to install dependencies with `npm install` while you were online, then use `npm run start` to view the documentation locally.

Upgrading
---------

See the [Upgrading](https://fudgel.js.org/upgrading.html) page for what changed in each version and what, if anything, to adjust.

Developing
----------

* `npm test` builds the library, type-checks it under both decorator modes, checks tree shaking and the ES2018 syntax ceiling, and runs the Vitest suite (the expression parser under Node, everything else in Chromium).
* `npm run test:watch` re-runs tests as files change.
* `AGENTS.md` describes the conventions for working on the library.
