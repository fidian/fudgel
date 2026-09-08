# AGENTS.md

This is the Fudgel library itself: a small web component library. This file
is for anyone changing the library. The rules for *using* Fudgel are in
`docs/llms.txt` (short) and `docs/llms-full.txt` (every documentation page).

## Layout

- `src/` - the library. `src/fudgel.ts` is the public entry; `src/dev.ts` is
  the opt-in `fudgel/dev` warning module and is built separately.
- `test/unit/` - Vitest under Node: the expression parser, `di()`, helpers.
- `test/browser/` - Vitest in Playwright Chromium: everything that touches the
  DOM. `test/support/dom.ts` has `mount()` and retrying assertions.
- `docs/` - the documentation site, Markdown compiled by `scripts/build-docs`.
  `docs/e2e/` holds the lifecycle-order pages the browser tests load in an
  iframe. `docs/samples/` are the live examples the pages embed.
- `type-tests/` - files that must type-check but never run.
- `dist/` - build output, not committed. `scripts/build` copies the builds
  into `docs/` (`fudgel.min.js`, `playground/fudgel.js`, `e2e/fudgel.umd.js`)
  and rewrites `docs/fudgel-sizes.json`; those copies are committed.

## Commands

```bash
npm test              # build, type checks, tree shaking, ES2018 check, Node import, Vitest
npm run test:watch    # vitest in watch mode
npm run build         # docs then library
npm start             # serve docs/ on :8080 (SSI's Manage dev server also uses 8080)
```

`npm test` takes about six seconds. If it is slow, something is wrong.

## Rules

- **Every fix ships with a test that fails on the previous build.** Write
  the test first, run it, then fix. Browser behavior is tested in a real
  browser; do not add a DOM shim.
- **Size is a feature.** `docs/fudgel-sizes.json` is rewritten by every
  build; read the gzipped delta of `Everything (ESM)` before and after and
  say what it is. Prefer a shared one-line helper (`isString`,
  `isFunction`, `newSet`) over an inline check, and the smallest form terser
  produces over the most readable one when they differ. Comments are free.
- **ES2018 only.** The build is checked with acorn at `ecmaVersion: 2018`
  so Safari 11.1 can parse it. TypeScript downlevels `?.` and `??`; do not
  use `flatMap`, `flat`, `Object.fromEntries`, `globalThis` outside the one
  guarded fallback in `src/elements.ts`, or any other ES2019+ API.
- **No `new Function`, no `eval`.** Expressions are parsed by `src/jsep.ts`
  so the library works under a strict Content-Security-Policy.
- **Module-level state must be marked pure** (`/*@__PURE__*/ newSet()`) or
  agadoo fails the tree-shaking check.
- **Everything the library needs from the environment goes through
  `src/elements.ts`** (`win`, `doc`, `createElement`...). `win` falls back to
  `globalThis` so the library imports under Node.
- **Directives pass their scopes first and the controller last** when
  evaluating an expression. `fudgel/dev` relies on that order.
- **Properties named with a leading underscore are mangled by terser.** A
  property `fudgel/dev` or a user may read from outside must not start with
  `_` (the router's `routes` is public for that reason).
- **A behavior change needs three things:** the code, an `upgrading.md`
  entry, and the documentation page that described the old behavior.
  Breaking changes wait for a major version.
- Formatting: 4-space indent, single quotes, `arrowParens: avoid`
  (`.prettierrc`). Prettier is not enforced by a script; match the file you
  are in.

## Releasing

1. Bump `version` in `package.json`.
2. `npm test` (which builds and refreshes the copies under `docs/`).
3. Add the version's section to `docs/upgrading.md` if it is not there.
4. Commit, tag, `npm publish`. The published package is `dist/` only.

## Where things are decided

- Attribute and property conversion: `src/util.ts` (`camelToDash`,
  `dashToCamel`); documented on the Naming Conventions page.
- What triggers a binding: `src/bindings.ts` (`addBindings`,
  `findBindingTarget`) and `src/setter.ts`; documented on the Reactivity page.
- Style scoping: `scopeStyleRule` in `src/component.ts`.
- Lifecycle order: `src/component.ts` (`connectedCallback`) and
  `src/when-parsed.ts`; pinned by `test/browser/event-order.test.ts`.
- Routing: `src/custom-elements/router.ts`; history is patched once per page.
