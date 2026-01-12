---
title: Expressions (Fudgel.js)
---

# Expressions

Fudgel supports binding to expressions in templates. This allows you to insert dynamic values, call functions, and conditionally render content based on the state of your controller.

Most JavaScript syntax works in expressions. It looks like JavaScript and it has access to properties on the controller as well as variables that are defined in various directives. There are several examples on this page along with a list of all operations that are allowed.

The value returned from the expression is used by the [directive](directives.html) or [binding](bindings.html) that contains it.

## Automatic Updates

Top-level properties on the controller are observed for changes when they are used as a part of an expression. When the property changes, any bindings or directives that use that property are automatically updated. This is done using a shallow compare, so if an object or array is used in an expression, the reference must change for the update to be detected. You can use a [utility function](utilities.html) to manually trigger updates if necessary.

<code-sample sample="samples/expressions-bindings.js"></code-sample>

## Scope

Each expression is evaluated in the context of a scope. Scopes are layered on top of the controller's properties. In this example, the controller's name will be shown first. The [`*for` directive](directive-for.html) creates a new scope for each child element. This allows the key and the value in one segment to not collide with the key and value of others. In the next example, `name` is set to the value from the current iteration. This allows you to access properties from the controller as well as variables defined in directives.

<code-sample sample="samples/expression-for.js"></code-sample>

## Allowed Expressions and Operations

Most JavaScript syntax is allowed in expressions.

* Strings: `"Hello"`, `'World'`, `"escaped characters: \b \f \n \r \t \v"`
* Numbers: `42`, `3.14`, `3e-10`
* Literals: `true`, `false`, `null`, `['arrays', true]`, `{"an":"object", ['works']: true}`
* Variables: `myVar`, `myProp.childProp`, `myProp[3]`, `myProp['childProp']`, `myProp?.childProp`
* Unary operators: `!myVar`, `+myVar`, `-myVar`, `~myVar`
* Binary operators: `||`, `??`, `&&`, `|`, `^`, `&`, `==`, `!=`, `===`, `!==`, `<`, `>`, `<=`, `>=`, `<<`, `>>`, `>>>`, `+`, `-`, `*`, `/`, `%`, `**`
* Function calls: `myFunc(arg1, 'arg2', 3)`
* Miscellaneous: `typeof`, `in`, `instanceof`

## Disallowed Expressions and Syntax

Templates should not create complex logic or behaviors. They also should not alter the values in scope, create new functions, or be forced to deal with flow-control statements. Templates should only be used as a bridge to show information to the user, to pass extra information along as an attribute or property, or to bind events to event handlers.

The point of the template is to keep things simple and let the controller do the heavy lifting. Several of the following items are not allowed based on this principle. Others are not allowed because there is no succinct way to implement them while also supporting strict Content-Security-Policy directives.

* Multiple statements: `method1(); method2()`, `method1(), method2()`
* Creation of new functions: `function test() {}`, `() => {}` due to difficulty implementing under strict Content-Security-Policy
* Async, await: `async`, `await` - requires function creation
* Spread operator: `...` - no easy way to implement while also avoiding Content-Security-Policy issues
* Assignments: `=`, `+=`, `-=`, etc.
* Prefix and postfix increment/decrement: `++`, `--`
* Deletion of object properties: `delete propName`
