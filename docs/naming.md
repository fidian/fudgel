---
title: Naming Conventions (Fudgel.js)
---

# Naming Conventions

One rule covers every name that crosses between HTML and JavaScript in Fudgel: **camelCase in JavaScript, dash-case in HTML.** Fudgel converts in both directions.

| Where | JavaScript | HTML |
|---|---|---|
| The `attr` list and the controller property | `attr: ['parentSection']` | `<my-el parent-section="...">` |
| The `prop` list and the controller property | `prop: ['isSaveable']` | `<my-el .is-saveable="expression">` |
| Route parameters and `query` names | `path="/user/:userId"`, `query="sortOrder"` | `user-id="123"`, `sort-order="asc"` |
| Custom events | `emit(this, 'valueSave', detail)` | `@value-save="handler($event)"` |
| Event modifiers | | `@keydown.arrow-left`, `@click.outside` |

## Why the rule exists

The HTML parser lowercases attribute names before Fudgel ever sees them. `.isSaveable="x"` reaches Fudgel as `.issaveable="x"`, and there is no way to get the capital letters back. Dash-case survives the parser, and Fudgel turns `is-saveable` into `isSaveable`.

The same applies to a plain attribute: `parentSection="..."` arrives as `parentsection`, which is not the `parentSection` property.

## What happens when it is wrong

A mismatched name is not an error, which is what makes it hard to spot. The property directive sets a property nothing reads. The attribute is set on the element but never reaches the controller. The controller keeps its initial value, and that looks exactly like a reactivity problem. While developing, import `fudgel/dev` (see [Getting Started](getting-started.html)) and Fudgel warns with the spelling to use whenever a lowercased name matches a declared property.

## Events from other libraries

Custom event names are case sensitive and the browser does not convert them. `@sl-change` listens for both `slChange` and `sl-change`, so a dashed event from another component library binds directly. Your own events work with either spelling: `emit(this, 'valueSave')` and `emit(this, 'value-save')` are both heard by `@value-save`.

## What is accepted anyway

A dashed name in the `attr` or `prop` list, such as `attr: ['parent-section']`, is treated as the camelCase name.
