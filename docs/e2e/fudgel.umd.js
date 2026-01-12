(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Fudgel = {}));
})(this, (function (exports) { 'use strict';

    const newSet = (...iterables) => new Set(iterables.flatMap(list => [...list]));

    const allComponents = /*@__PURE__*/ newSet();

    const allControllers = /*@__PURE__*/ newSet();

    // CustomElement[metadata] -> Controller
    // Controller[metadata] -> ControllerMetadata (events, host, root)
    // Scope[metadata] -> true if global scope
    const metadata = Symbol();

    class Emitter {
        constructor() {
            this._m = new Map();
        }
        // Emits a value to all event listeners. If one listener removes a later
        // listener from the list, the later listener will still be called.
        emit(name, ...data) {
            for (const cb of [...(this._m.get(name) ?? [])]) {
                cb(...data);
            }
        }
        off(name, callback) {
            const list = this._m.get(name)?.filter(item => item !== callback);
            if (list) {
                this._m.set(name, list);
            }
            else {
                this._m.delete(name);
            }
        }
        on(name, callback) {
            (this._m.get(name) ?? this._m.set(name, []).get(name)).push(callback);
            return () => this.off(name, callback);
        }
    }

    const events = new Emitter();

    const lifecycle = (controller, phase, ...args) => {
        events.emit(phase, controller, ...args);
        controller[metadata]?.events.emit(phase, ...args);
        controller[`on${phase[0].toUpperCase()}${phase.slice(1)}`]?.(...args);
    };

    const dispatchCustomEvent = (e, eventName, detail, customEventInit = {}) => {
        e.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            cancelable: false,
            composed: true, // To go outside a shadow root
            detail,
            ...customEventInit,
        }));
    };
    const emit = (source, eventName, detail, customEventInit = {}) => {
        const e = source instanceof Element ? source : source[metadata]?.host;
        if (e) {
            dispatchCustomEvent(e, eventName, detail, customEventInit);
        }
    };
    const update = (controller) => {
        if (controller) {
            updateController(controller);
        }
        else {
            for (const registeredController of allControllers) {
                updateController(registeredController);
            }
        }
    };
    const updateController = (controller) => {
        // Mark all attributes and properties as being changed so internals get
        // updated. Necessary when deeply nested objects are passed as input
        // properties to directives and are updated in scopes.
        const { attr, prop } = controller[metadata];
        // Only trigger updates once per property, so deduplicate names here
        for (const name of newSet(prop, attr)) {
            lifecycle(controller, 'change', name, controller[name], controller[name]);
        }
        // Update all bound functions
        controller[metadata]?.events.emit('update');
    };

    const Obj = Object;
    const stringify = (x) => JSON.stringify(x);
    // Memoizing reduces repeats by a factor of ~200.
    const dashToCamel = (dashed) => dashed.replace(/-(\p{Ll})/gu, match => match[1].toUpperCase());
    const camelToDash = (camel) => camel.replace(/\p{Lu}/gu, match => `-${match[0]}`.toLowerCase());
    const pascalToDash = (pascal) => camelToDash(pascal.replace(/^\p{Lu}/gu, match => match.toLowerCase()));
    const toString = (value) => `${value ?? ''}`;
    const isString = (x) => typeof x == 'string';
    const getAttribute = (node, name) => node.getAttribute(name);
    const hasOwn = (obj, prop) => Obj.hasOwn(obj, prop);
    const setAttribute = (node, name, value) => {
        if (value === true) {
            value = '';
        }
        if (isString(value)) {
            node.setAttribute(name, value);
        }
        else {
            node.removeAttribute(name);
        }
    };
    // Return the entries of an Iterable or fall back on Object.entries for
    // normal objects and arrays.
    const entries = (iterable) => iterable.entries?.() ?? Obj.entries(iterable);
    const isTemplate = (node) => node.nodeName == 'TEMPLATE';

    /**
     * Shorthands for creating elements. Using these is better for minification.
     *
     * Both `doc` and `win` have a fallback to an object to support unit testing of
     * some things in a non-browser environment, such as `di()`.
     */
    const doc = document;
    const win = window;
    const cloneNode = (node) => node.cloneNode(true);
    const createElement = (name) => doc.createElement(name);
    const createTextNode = (content) => doc.createTextNode(content);
    const createComment = (content) => doc.createComment(content);
    const createFragment = () => doc.createDocumentFragment();
    const createTemplate = () => createElement('template');
    // NodeFilter.SHOW_ELEMENT = 0x01
    // NodeFilter.SHOW_TEXT = 0x04
    // NodeFilter.SHOW_COMMENT = 0x80 - necessary for structural directives
    const createTreeWalker = (root, filter) => doc.createTreeWalker(root, filter);
    const sandboxStyleRules = (css) => {
        const sandbox = doc.implementation.createHTMLDocument('');
        const style = sandbox.createElement('style');
        style.textContent = css;
        sandbox.body.append(style);
        return style.sheet.cssRules || [];
    };
    const toggleClass = (node, className, force) => node.classList.toggle(className, force);

    const shorthandWeakMap = () => {
        const map = new WeakMap();
        const fn = (key, value) => (value ? map.set(key, value) : map).get(key);
        return fn;
    };

    const patchedSetters = shorthandWeakMap();
    const removeSetters = (obj) => {
        for (const [_, callbacks] of entries(patchedSetters(obj) || {})) {
            callbacks.length = 0;
        }
    };
    const patchSetter = (obj, property, callback) => {
        const trackingObject = patchedSetters(obj) || patchedSetters(obj, {});
        let callbacks = trackingObject[property];
        if (!callbacks) {
            let value = obj[property];
            const desc = Obj.getOwnPropertyDescriptor(obj, property) || {};
            callbacks = [];
            trackingObject[property] = callbacks;
            Obj.defineProperty(obj, property, {
                get: desc.get || (() => value),
                set: function (newValue) {
                    const oldValue = value;
                    // Distinguish between different NaN values or +0 and -0.
                    if (!Obj.is(newValue, oldValue)) {
                        desc.set?.(newValue);
                        value = newValue;
                        for (const cb of callbacks) {
                            cb(newValue, oldValue);
                        }
                    }
                },
            });
        }
        callbacks.push(callback);
    };

    const addBindings = (controller, node, callback, bindingList, scope) => {
        for (const binding of bindingList) {
            const target = findBindingTarget(controller, scope, binding);
            patchSetter(target, binding, callback);
            const onDestroy = () => {
                for (const remover of removers) {
                    remover?.();
                }
            };
            const events = controller[metadata]?.events;
            const removers = [
                events?.on('update', callback),
                events?.on('unlink', (removedNode) => {
                    if (removedNode.contains(node)) {
                        onDestroy();
                    }
                }),
                events?.on('destroy', onDestroy)
            ];
        }
    };
    const findBindingTarget = (controller, scope, binding) => hasOwn(scope, binding)
        ? scope
        : hasOwn(scope, metadata)
            ? controller
            : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);

    const elementToScope = shorthandWeakMap();
    // When running getScope during initial node linking, the node is not yet
    // attached to a parent, so it will not accidentally pick up the parent's
    // scope.
    const getScope = (node) => {
        let scope = elementToScope(node);
        if (node) {
            let n = node.parentNode;
            while (!scope && n) {
                scope = elementToScope(n);
                n = n.parentNode;
            }
        }
        return scope || elementToScope(doc.body) || elementToScope(doc.body, {
            [metadata]: true,
        });
    };
    const childScope = (parentScope, childNode) => elementToScope(childNode, Obj.create(parentScope));

    const throwError = (message) => {
        const error = new Error(message);
        console.error(error);
        throw error;
    };

    // Global variables used during synchronous parsing.
    let expr = ''; // The expression to parse
    let index = 0; // Current index
    let code = 0; // Char code at the current index
    let moreToParse = false; // If we are at the end of the expression
    // String literal escape codes that do not map to the same character.
    // Eg. "\z" maps to "z" - those don't need to be listed.
    const escapeCodes = {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
        v: '\v',
    };
    // Unary operators that take a single argument to the right of the operator
    const unaryOps = {
        '-': arg => root => [-arg(root)[0]],
        '!': arg => root => [!arg(root)[0]],
        '~': arg => root => [~arg(root)[0]],
        '+': arg => root => [+arg(root)[0]],
        typeof: arg => root => [typeof arg(root)[0]],
    };
    const binaryOps = {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
        // 1 Skip: , (comma)
        // 2 Skip: ...x, yield, =>, x?y:z, assignments
        '||': [3, (left, right) => root => [left(root)[0] || right(root)[0]]],
        '??': [3, (left, right) => root => [left(root)[0] ?? right(root)[0]]],
        '&&': [4, (left, right) => root => [left(root)[0] && right(root)[0]]],
        '|': [5, (left, right) => root => [left(root)[0] | right(root)[0]]], // After ||
        '^': [6, (left, right) => root => [left(root)[0] ^ right(root)[0]]],
        '&': [7, (left, right) => root => [left(root)[0] & right(root)[0]]], // After &&
        '===': [8, (left, right) => root => [left(root)[0] === right(root)[0]]],
        '==': [8, (left, right) => root => [left(root)[0] == right(root)[0]]], // After ===
        '!==': [8, (left, right) => root => [left(root)[0] !== right(root)[0]]],
        '!=': [8, (left, right) => root => [left(root)[0] != right(root)[0]]], // After !==
        '<<': [10, (left, right) => root => [left(root)[0] << right(root)[0]]], // Forced earlier
        '>>>': [10, (left, right) => root => [left(root)[0] >>> right(root)[0]]], // Forced earlier
        '>>': [10, (left, right) => root => [left(root)[0] >> right(root)[0]]], // After >>>
        '<=': [9, (left, right) => root => [left(root)[0] <= right(root)[0]]], // After <<
        '<': [9, (left, right) => root => [left(root)[0] < right(root)[0]]], // After <=
        '>=': [9, (left, right) => root => [left(root)[0] >= right(root)[0]]], // After >>
        '>': [9, (left, right) => root => [left(root)[0] > right(root)[0]]], // After >
        instanceof: [
            9,
            (left, right) => root => [left(root)[0] instanceof right(root)[0]],
        ],
        in: [9, (left, right) => root => [left(root)[0] in right(root)[0]]], // After instanceof
        '+': [11, (left, right) => root => [left(root)[0] + right(root)[0]]],
        '-': [11, (left, right) => root => [left(root)[0] - right(root)[0]]],
        '**': [13, (left, right) => root => [left(root)[0] ** right(root)[0]], 1], // right-to-left, forced earlier
        '*': [12, (left, right) => root => [left(root)[0] * right(root)[0]]], // After *
        '/': [12, (left, right) => root => [left(root)[0] / right(root)[0]]],
        '%': [12, (left, right) => root => [left(root)[0] % right(root)[0]]],
        // 14 Skip: these are unary
        // 15 Skip: these are unary
        // 16 Skip: new
    };
    // Literals - when encountered, they are replaced with their value.
    const literals = {
        true: true,
        false: false,
        null: null,
        undefined: undefined,
    };
    const defaultValueProvider = () => [() => [], newSet()];
    // Parses an expression. Always returns a ValueProviderRoot, which is a tuple:
    // [function, string[]].  The function takes a list of objects that are
    // searched for root values and returns a value. The returned string[] is a
    // list of bound properties that the function uses.
    const jsep = (exprToParse) => {
        // Assign to a global variable
        expr = exprToParse;
        // Set up index and code (global variables)
        index = -1;
        gobbleSpaces(1);
        // Use a default return value
        let result = defaultValueProvider();
        try {
            if (moreToParse) {
                result = gobbleExpression() || throwJsepError();
            }
            if (moreToParse) {
                result = defaultValueProvider();
                throwJsepError();
            }
        }
        catch (_ignore) { }
        // Unwrap the result - change it from a ValueProvider result to a ValueProviderRoot.
        // When calling result[0], the root object needs to wrap the values in an array
        // to produce ProvidedValue results;
        return [
            (...roots) => result[0](
            // Wrap all values provided from the root objects (or the
            // window fallback) in arrays to preserve their context. All
            // calls to any getter will produce a ProvidedValue.
            new Proxy({}, {
                get(_ignoreTarget, prop) {
                    for (const root of roots) {
                        // "in" searches the object and its prototype chain
                        if (prop in root) {
                            return [root[prop], root];
                        }
                    }
                    return [win[prop], win];
                },
            }))[0],
            result[1],
        ];
    };
    // Move to the next character in the expression.
    const advance = (n = 1) => {
        index += n;
        code = expr.charCodeAt(index);
        moreToParse = code >= 0; // NaN fails this check
    };
    // Trivial functions for minification
    const char = () => expr.charAt(index);
    const isDecimalDigit = (charCode = code) => charCode > 47 && charCode < 58; // 0...9
    const isIdentifierStart = (charCode = code) => 
    /* A-Z */ (charCode > 64 && charCode < 91) ||
        /* a-z */ (charCode > 96 && charCode < 123) ||
        /* extended */ charCode > 127 ||
        /* $ */ charCode == 36 ||
        /* _ */ charCode == 95;
    const isIdentifierPart = (charCode) => isIdentifierStart(charCode) || isDecimalDigit(charCode);
    const throwJsepError = () => {
        throwError(`Parse error at index ${index}: ${expr}`);
    };
    // Consume whitespace in the expression.
    const gobbleSpaces = (advanceChars = 0) => {
        if (advanceChars) {
            advance(advanceChars);
        }
        while (
        /* space */ code == 32 ||
            /* tab */ code == 9 ||
            /* newline */ code == 10 ||
            /* carriage return */ code == 13) {
            advance();
        }
    };
    const gobbleExpression = () => {
        const combineLast = () => {
            const r = stack.pop(), op = stack.pop(), l = stack.pop();
            stack.push([op[1](l[0], r[0]), newSet(l[1], r[1])]);
        };
        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        // Don't gobble a binary operator without a left-hand-side
        const left = gobbleToken();
        if (!left) {
            return left;
        }
        let biop = gobbleTokenFromList(binaryOps);
        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }
        const stack = [
            left,
            biop,
            gobbleToken() || throwJsepError(),
        ];
        // Compare the previous binary operator against the newly found one.
        // Previous = stack[stack.length-2], newly found one = biop
        //
        // The comparison will check the precedence of the two operators,
        // preferring to combine the operations when the current one is less than
        // or equal to the previous. This logic is flipped when the previous one is
        // a right-to-left operation.
        const comparePrev = (prev) => prev[2] ^ (biop[0] <= prev[0]);
        // Properly deal with precedence using
        // [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while ((biop = gobbleTokenFromList(binaryOps))) {
            // Reduce: make a binary expression from the three topmost entries.
            while (stack.length > 2 &&
                comparePrev(stack[stack.length - 2])) {
                combineLast();
            }
            stack.push(biop, gobbleToken() || throwJsepError());
        }
        while (stack.length > 1) {
            combineLast();
        }
        return stack[0];
    };
    // Objects passed into here must have keys that are sorted so longer keys are first.
    //
    // Example:
    // {
    //   'instanceof': 1,
    //   'in': 2,
    // }
    //
    // This checks each of the keys in the object against the current position in
    // expr. The first one that matches will have its value returned.
    //
    // There's a check to make sure that tokens comprised of alphabetic characters
    // are not followed by an alphabetic character.
    const gobbleTokenFromList = (tokenList) => {
        for (const item of Obj.keys(tokenList)) {
            // If the token matches exactly
            if (expr.substr(index, item.length) == item) {
                // If the first character is NOT a letter, then it's just symbols
                // and we're good. Otherwise, if it is a letter, then a
                // non-identifier character must trail the token.
                if (!isIdentifierStart() ||
                    !isIdentifierPart(expr.charCodeAt(index + item.length))) {
                    gobbleSpaces(item.length);
                    return tokenList[item];
                }
            }
        }
    };
    const gobbleToken = () => {
        let node;
        // 46 is '.'
        if (isDecimalDigit() || code == 46) {
            // Char code 46 is a dot `.`, which can start off a numeric literal
            return gobbleNumericLiteral();
        }
        if (code == 34 || code == 39) {
            // 34 = '"', 39 = "'"
            // Single or double quotes
            const str = gobbleStringLiteral();
            node = [() => [str], newSet()];
        }
        else if (code === 91) {
            // 91 is '['
            // Array literal
            gobbleSpaces(1);
            // 93 is ']'
            node = gobbleArguments(93, true);
        }
        else if (code === 123) {
            // 123 is '{'
            node = gobbleObjectLiteral();
        }
        else {
            const op = gobbleTokenFromList(unaryOps);
            if (op) {
                const argument = gobbleToken() || throwJsepError();
                return [op(argument[0]), argument[1]];
            }
            const identifier = gobbleIdentifier();
            // Careful - "root" is a Proxy that already returns a value wrapped in
            // an array with the context.
            node =
                identifier in literals
                    ? [() => [literals[identifier]], newSet()]
                    : [root => root[identifier], newSet([identifier])];
        }
        return gobbleTokenProperty(node);
    };
    const gobbleTokenProperty = (node) => {
        // '.', '[', '(', '?'
        while (
        /* . */ code == 46 ||
            /* [ */ code == 91 ||
            /* ( */ code == 40 ||
            /* ? */ code == 63) {
            let optional;
            let action;
            let bindings = newSet();
            let prevNode = node;
            // '?'
            if (code == 63) {
                // Checking for optional chaining
                advance();
                // '.'
                if (code !== 46) {
                    advance(-1);
                    return node;
                }
                optional = true;
            }
            // '['
            if (code == 91) {
                gobbleSpaces(1);
                const expression = gobbleExpression() || throwJsepError();
                action = (value, root) => [
                    value[0][expression[0](root)[0]],
                    value[0],
                ];
                bindings = expression[1];
                // ']'
                if (code !== 93) {
                    throwJsepError();
                }
                gobbleSpaces(1);
            }
            else if (code == 40) {
                // '('
                gobbleSpaces(1);
                // A function call is being made; gobble all the arguments
                // 41 is ')'
                const args = gobbleArguments(41);
                action = (value, root) => [
                    value[0].apply(value[1], args[0](root)[0]),
                ];
                bindings = args[1];
            }
            else if (code == 46) {
                // '.'
                gobbleSpaces(1);
                const identifier = gobbleIdentifier();
                action = value => [value[0][identifier], value[0]];
            }
            else {
                throwJsepError();
            }
            node = optional
                ? [
                    root => {
                        const value = prevNode[0](root);
                        // This returns true for undefined and null, false
                        // otherwise for everything else (including false, 0,
                        // and empty string).
                        return value[0] == null
                            ? []
                            : action(value, root);
                    },
                    newSet(prevNode[1], bindings),
                ]
                : [
                    root => action(prevNode[0](root), root),
                    newSet(prevNode[1], bindings),
                ];
            gobbleSpaces();
        }
        return node;
    };
    const gobbleNumericLiteral = () => {
        let number = '';
        while (isDecimalDigit()) {
            number += char();
            advance();
        }
        // '.'
        if (code == 46) {
            // can start with a decimal marker
            number += '.';
            advance();
            while (isDecimalDigit()) {
                number += char();
                advance();
            }
        }
        // e or E
        if (code == 101 || code == 69) {
            // exponent marker
            number += char();
            advance();
            // '+', '-'
            if (code == 43 || code == 45) {
                // exponent sign
                number += char();
                advance();
            }
            if (!isDecimalDigit()) {
                throwJsepError();
            }
            do {
                number += char();
                advance();
            } while (isDecimalDigit());
        }
        // Check to make sure this isn't a variable name that starts with a number
        // (123abc)
        if (isIdentifierStart()) {
            throwJsepError();
        }
        else if (code == 46 || number == '.') {
            // 46 is '.'
            // Error with "1.." and "."
            throwJsepError();
        }
        gobbleSpaces();
        const value = parseFloat(number);
        return [() => [value], newSet()];
    };
    const gobbleStringLiteral = () => {
        let str = '';
        const quote = code;
        advance();
        while (moreToParse) {
            if (code == quote) {
                break;
            }
            if (code == 92) {
                // 92 is '\\'
                advance();
                // Check for all of the common escape codes
                const c = char();
                str += escapeCodes[c] || c;
            }
            else {
                str += char();
            }
            advance();
        }
        if (!moreToParse) {
            throwJsepError();
        }
        gobbleSpaces(1);
        return str;
    };
    const gobbleIdentifier = () => {
        let start = index;
        if (!isIdentifierStart()) {
            throwJsepError();
        }
        advance();
        while (moreToParse) {
            if (!isIdentifierPart()) {
                break;
            }
            advance();
        }
        const identifier = expr.slice(start, index);
        gobbleSpaces();
        return identifier;
    };
    // This doesn't return the typical ValueProvider.
    const gobbleArguments = (terminator, allowEmpty) => {
        const args = [];
        while (code !== terminator) {
            if (!moreToParse) {
                throwJsepError();
            }
            args.push(allowEmpty && code == 44 ? defaultValueProvider() : gobbleExpression());
            if (code == 44) {
                // 44 is ','
                gobbleSpaces(1);
            }
            else if (code !== terminator) {
                throwJsepError();
            }
        }
        gobbleSpaces(1);
        return [
            root => [args.map(arg => arg[0](root)[0])],
            newSet(...args.map((arg) => arg[1])),
        ];
    };
    const gobbleObjectLiteral = () => {
        gobbleSpaces(1);
        const props = [];
        // 125 is '}'
        while (code !== 125) {
            let propName;
            let propNameProvider;
            if (!moreToParse) {
                throwJsepError();
            }
            // 46 is '.'
            if (isDecimalDigit() || code == 46) {
                // Numeric literal or dot notation
                propNameProvider = gobbleNumericLiteral();
            }
            else if (code == 34 || code == 39) {
                // 34 = '"', 39 = "'"
                // String literal
                propName = gobbleStringLiteral();
            }
            else if (code == 91) {
                // 91 is '['
                // The array syntax can be used to specify a property name
                gobbleSpaces(1);
                propNameProvider = gobbleExpression();
                if (code != 93) {
                    // 93 is ']'
                    throwJsepError();
                }
                gobbleSpaces(1);
            }
            else {
                propName = gobbleIdentifier();
            }
            if (propName) {
                propNameProvider = [() => [propName], newSet()];
            }
            // 58 is ':'
            if (code == 58) {
                gobbleSpaces(1);
                props.push([propNameProvider, gobbleExpression()]);
            }
            else if (!propName) {
                // If there was a property name provider, then it must be followed by a colon
                throwJsepError();
            }
            else {
                props.push([
                    propNameProvider,
                    [root => [root[propName][0]], newSet([propName])],
                ]);
            }
            if (code == 44) {
                // 44 is ','
                gobbleSpaces(1);
            }
            else if (code !== 125) {
                throwJsepError();
            }
        }
        gobbleSpaces(1);
        return [
            root => {
                const obj = {};
                for (const [nameProvider, valueProvider] of props) {
                    obj[nameProvider[0](root)[0]] = valueProvider[0](root)[0];
                }
                return [obj];
            },
            newSet(...(props.map(prop => [prop[0][1], prop[1][1]]).flat()))
        ];
    };

    /**
     * Simplistic memoize for single-argument functions.
     */
    const memoize = (fn) => {
        const cache = new Map();
        return (arg) => cache.has(arg) ? cache.get(arg) : cache.set(arg, fn(arg)).get(arg);
    };
    /**
     * Split text with embedded expressions wrapped in {{ and }}.
     *
     * Returns null if no expressions found.
     *
     * Returns an array of two elements otherwise.
     * [0] is an array that alternates between strings and functions to generate content.
     * [1] is a set of binding strings.
     */
    const splitText = (text) => {
        const textChunks = text.split(/{{(.*?)}}/s);
        if (textChunks.length < 2) {
            return null;
        }
        const result = [];
        let isJs = false;
        let binds = newSet();
        for (const textChunk of textChunks) {
            if (isJs) {
                const parsed = parse.js(textChunk);
                result.push(parsed[0]);
                binds = newSet(binds, parsed[1]);
            }
            else {
                result.push(textChunk);
            }
            isJs = !isJs;
        }
        return [result, binds];
    };
    const assembleCall = (splitResult) => splitResult
        ? [
            (...roots) => splitResult[0]
                .map(x => toString(x?.call ? x(...roots) : x))
                .join(''),
            splitResult[1],
        ]
        : null;
    // Same as parseText, but allows boolean values to be returned.
    // See parseText
    const parseAttr = (text) => {
        const splitResult = splitText(text);
        const first = splitResult?.[0];
        if (first?.length == 3 && first[0] == '' && first[2] == '') {
            return [
                (...roots) => {
                    const x = first[1](...roots) ?? false;
                    return x === !!x ? x : toString(x);
                },
                splitResult[1],
            ];
        }
        return assembleCall(splitResult);
    };
    // Parses a string containing expressions wrapped in braces
    // Produces an array. [0] is a function that takes a root object and returns
    // the generated string. [1] is the list of bindings as an array of strings.
    const parseText = (text) => assembleCall(splitText(text));
    // Parsing functions with memoization for speed.
    // Either returns null for an unparsable string or a ValueProviderRoot.
    // ValueProviderRoot is an array where [0] is a function that takes a root object
    // and returns a value, and [1] is an array of binding strings.
    const parse = {
        attr: memoize(parseAttr), // Like .text() but can also return booleans
        js: memoize(jsep), // Parses JavaScript and returns any value
        text: memoize(parseText), // Returns string values
    };

    const attributeDirective = (controller, node, attrValue, attrName) => {
        const result = parse.attr(attrValue);
        if (result) {
            const scope = getScope(node);
            const update = () => {
                setAttribute(node, attrName, result[0](scope, controller));
            };
            addBindings(controller, node, update, result[1], scope);
            update();
        }
    };

    // When these return truthy values, the guard will STOP and not call the callback.
    //
    // Not all modifiers make it to the modifier set. Some are entirely handled before the event handler is fired, thus those are removed. The following event modifiers are handled before the event listener is added: 'passive', 'capture', 'once', 'window', and 'document'.
    //
    // Some modifiers are processed before the event listener is set up but are still needed as a guard. These are: 'self' and 'outside'.
    const modifierGuards = {
        // Actions
        stop: e => e.stopPropagation(),
        prevent: e => e.preventDefault(),
        // Targeting
        self: (e, node) => e.target !== node,
        outside: (e, node) => node.contains(e.target),
        // Key modifiers
        ctrl: e => !e.ctrlKey,
        shift: e => !e.shiftKey,
        alt: e => !e.altKey,
        meta: e => !e.metaKey,
        left: e => e.button !== 0,
        middle: e => e.button !== 1,
        right: e => e.button !== 2,
        exact: (e, _node, modifierSet) => ['ctrl', 'shift', 'alt', 'meta'].some(m => e[`${m}Key`] && !modifierSet.has(m)),
    };
    const eventDirective = (controller, node, attrValue, attrName) => {
        const [eventName, ...modifiers] = dashToCamel(attrName.slice(1)).split('.');
        const scope = Obj.create(getScope(node));
        const parsed = parse.js(attrValue);
        const fn = (event) => {
            scope.$event = event;
            parsed[0](scope, controller);
        };
        const options = {};
        const modifierSet = newSet(modifiers);
        const checkModifier = (key) => modifierSet.has(key) && (modifierSet.delete(key), 1);
        let eventTarget = node;
        for (const item of [
            'passive',
            'capture',
            'once',
        ]) {
            if (checkModifier(item)) {
                options[item] = true;
            }
        }
        if (checkModifier('window')) {
            eventTarget = win;
        }
        // Do not use 'checkModifier' for 'outside' because the modifierGuards handles it
        // during event processing.
        //
        // Be careful with this logic. We are intentionally removing 'document' if
        // it exists in the set, but preserving 'outside'.
        if (checkModifier('document') || modifierSet.has('outside')) {
            eventTarget = doc;
        }
        eventTarget.addEventListener(eventName, event => {
            if (![...modifierSet].some(modifier => (modifierGuards[modifier] ||
                ((e) => pascalToDash(e.key) !==
                    (modifier.match(/^code-\d+$/)
                        ? String.fromCodePoint(+modifier.split('-')[1])
                        : modifier)))(event, node, modifierSet))) {
                fn(event);
            }
        }, options);
        setAttribute(node, attrName);
    };

    const hashClassDirective = (controller, node, attrValue, attrName) => {
        const parsed = parse.js(attrValue);
        const scope = getScope(node);
        const update = () => {
            for (const [key, value] of entries(parsed[0](scope, controller))) {
                // value can be undefined, but in this context it should be forced
                // to be a boolean. An undefined value here means to remove the
                // class, not toggle the class.
                toggleClass(node, key, !!value);
            }
        };
        addBindings(controller, node, update, parsed[1], scope);
        update();
        setAttribute(node, attrName);
    };

    const change = (controller, propertyName, newValue) => {
        // Only allow the change if the controller is still active
        if (controller?.[metadata]) {
            const oldValue = controller[propertyName];
            if (oldValue !== newValue) {
                controller[propertyName] = newValue;
                lifecycle(controller, 'change', propertyName, oldValue, newValue);
            }
        }
    };

    const hashRefDirective = (controller, node, attrValue, attrName) => {
        const prop = dashToCamel(attrValue);
        change(controller, prop, node);
        setAttribute(node, attrName);
    };

    const propertyDirective = (controller, node, attrValue, attrName) => {
        const parsed = parse.js(attrValue);
        const prop = dashToCamel(attrName.slice(1));
        const scope = getScope(node);
        const update = () => {
            const value = parsed[0](scope, controller);
            node[prop] = value;
        };
        addBindings(controller, node, update, parsed[1], scope);
        update();
        setAttribute(node, attrName);
    };

    const starForDirective = (controller, anchor, source, attrValue) => {
        let keyName = 'key';
        let valueName = 'value';
        const matches = attrValue.match(/^\s*(?:(?:(\S+)\s*,\s*)?(\S+)\s+of\s+)?(\S+)\s*$/);
        if (matches) {
            keyName = matches[1] || keyName;
            valueName = matches[2] || valueName;
            attrValue = matches[3];
        }
        const parsed = parse.js(attrValue);
        const anchorScope = getScope(anchor);
        let activeNodes = new Map();
        const update = () => {
            const iterable = parsed[0](anchorScope, controller) || [];
            let oldNodes = activeNodes;
            activeNodes = new Map();
            let lastNode = anchor;
            // Attempt to reuse nodes based on the key of the iterable
            for (const [key, value] of entries(iterable)) {
                // Attempt to find the old node
                let copy = oldNodes.get(key);
                oldNodes.delete(key);
                if (copy === lastNode.nextSibling) {
                    // Next node is in the right position. Update the value in
                    // scope, which should trigger bindings.
                    const scope = getScope(copy);
                    scope[valueName] = value;
                }
                else {
                    // Delete the old node if it exists
                    if (copy) {
                        unlink(controller, copy);
                        copy.remove();
                    }
                    // Create a new node and set its scope
                    copy = cloneNode(source);
                    const scope = childScope(anchorScope, copy);
                    scope[keyName] = key;
                    scope[valueName] = value;
                    link(controller, copy);
                    lastNode.after(copy);
                }
                lastNode = copy;
                activeNodes.set(key, lastNode);
            }
            // Clean up any remaining nodes.
            for (const old of oldNodes.values()) {
                unlink(controller, old);
                old.remove();
            }
        };
        addBindings(controller, anchor, update, parsed[1], anchorScope);
        update();
    };

    const starIfDirective = (controller, anchor, source, attrValue) => {
        const parsed = parse.js(attrValue);
        const scope = getScope(anchor);
        let activeNode = null;
        const update = () => {
            if (parsed[0](scope, controller)) {
                if (!activeNode) {
                    // Add
                    activeNode = cloneNode(source);
                    childScope(scope, activeNode);
                    link(controller, activeNode);
                    anchor.after(activeNode);
                }
            }
            else {
                if (activeNode) {
                    // Remove
                    unlink(controller, activeNode);
                    activeNode.remove();
                    activeNode = null;
                }
            }
        };
        addBindings(controller, anchor, update, parsed[1], scope);
        update();
    };

    const starRepeatDirective = (controller, anchor, source, attrValue) => {
        let scopeName = 'index';
        const matches = attrValue.match(/^(\S+)\s+as\s+(\S+)$/);
        if (matches) {
            attrValue = matches[1];
            scopeName = matches[2];
        }
        const parsed = parse.js(attrValue);
        const anchorScope = getScope(anchor);
        let activeNodes = [];
        const update = () => {
            let desired = +parsed[0](anchorScope, controller);
            while (activeNodes.length > desired) {
                const target = activeNodes.pop();
                unlink(controller, target);
                target.remove();
            }
            let lastIndex = activeNodes.length + 1;
            let lastNode = activeNodes[lastIndex - 1] || anchor;
            while (activeNodes.length < desired) {
                let copy = cloneNode(source);
                const scope = childScope(anchorScope, copy);
                scope[scopeName] = lastIndex++;
                link(controller, copy);
                activeNodes.push(copy);
                lastNode.after(copy);
                lastNode = copy;
            }
        };
        addBindings(controller, anchor, update, parsed[1], anchorScope);
        update();
    };

    const structuralDirectives = {
        '*for': starForDirective,
        '*if': starIfDirective,
        '*repeat': starRepeatDirective,
    };
    const generalDirectives = {
        '': attributeDirective,
        '@': eventDirective,
        '#class': hashClassDirective,
        '#ref': hashRefDirective,
        '.': propertyDirective,
    };
    const addDirective = (name, directive) => (name.charAt(0) == '*'
        ? structuralDirectives
        : generalDirectives)[name] = directive;

    const linkElementNode = (controller, currentNode) => {
        for (const attr of [...currentNode.attributes]) {
            const attrName = attr.nodeName;
            const firstChar = attrName.charAt(0);
            // Structural directives (those starting with '*') are applied
            // earlier and have been removed by this point.
            const applyDirective = generalDirectives[attrName] ||
                generalDirectives[firstChar] ||
                generalDirectives[''];
            applyDirective?.(controller, currentNode, attr.nodeValue || '', attrName);
        }
    };

    const linkStructuralDirective = (controller, treeWalker, currentNode) => {
        const attrs = currentNode.attributes;
        if (attrs) {
            let directive;
            for (const [k, v] of entries(structuralDirectives)) {
                const attr = attrs.getNamedItem(k);
                if (attr) {
                    // Only allow one structural directive on an element
                    if (directive) {
                        throwError(`${directive[0]} breaks ${k}`);
                    }
                    directive = [k, v, attr.nodeValue || ''];
                }
            }
            if (directive) {
                // Create a comment anchor and insert before current node.
                const anchor = createComment(`${directive[0]}=${stringify(directive[2])}`);
                currentNode.before(anchor);
                // Move tree walker to the anchor, then pull currentNode out of
                // DOM.
                treeWalker.previousNode();
                currentNode.remove();
                // Move tree walker to the next node. Processing the directive will
                // modify the DOM between the anchor and the current tree walker node.
                treeWalker.nextNode();
                // Remove star directives here so infinite loops are avoided.
                setAttribute(currentNode, directive[0]);
                // Applying the directive may automatically append elements after the anchor.
                directive[1](controller, anchor, currentNode, directive[2], directive[0]);
                // Move back one node so the next loop will process the node we're
                // currently pointing at.
                treeWalker.previousNode();
                return 1;
            }
        }
    };

    const linkTextNode = (controller, currentNode) => {
        const result = parse.text(currentNode.textContent || '');
        if (result) {
            const scope = getScope(currentNode);
            const update = () => {
                currentNode.nodeValue = result[0](scope, controller);
            };
            addBindings(controller, currentNode, update, result[1], scope);
            update();
            return 1;
        }
    };

    /**
     * Link unattached nodes by first putting them into a fragment, then linking
     * them to the controller and child scopes. The DOM structure will change. When
     * everything is done, the node is ready to be appended into the live document.
     *
     * Use this function when a node is not yet attached to the document.
     */
    const link = (controller, node) => {
        const fragment = createFragment();
        fragment.append(node);
        linkNodes(controller, fragment);
    };
    /**
     * Link elements and nodes to functions and the controller.
     *
     * The resulting "resultQueue"'s first element is based on processQueue's
     * first element. The second element for each item is the altered node,
     * comment anchor, or similar. No action is taken here to append to the
     * parent or insert after the previous sibling.
     *
     * Only use this function when the node is attached to a parent, such as the
     * document, a fragment, or template.
     */
    const linkNodes = (controller, root) => {
        const treeWalker = createTreeWalker(root, 0x85);
        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            if (isTemplate(currentNode)) {
                // Recurse into the template
                linkNodes(controller, currentNode.content);
            }
            const type = currentNode.nodeType;
            // Node.TEXT_NODE === 3
            if (type == 3) {
                linkTextNode(controller, currentNode);
            }
            else if (type == 1) {
                linkStructuralDirective(controller, treeWalker, currentNode) ||
                    linkElementNode(controller, currentNode);
            }
        }
    };
    /**
     * Issue an unlink event on the controller.
     */
    const unlink = (controller, root) => {
        lifecycle(controller, 'unlink', root);
    };

    const metadataMutationObserver = shorthandWeakMap();
    const DOMContentLoaded = 'DOMContentLoaded';
    // When web components are added dynamically, they are automatically ready.
    // However, when they are added during initial HTML load, the web component's
    // child elements may not be added or may be added in phases. This function
    // waits and determines when the child nodes are ready.
    //
    // Elements using a shadow DOM are always considered ready because they don't
    // need or can't really access projected content from slots.
    const whenParsed = (element, root, callback) => {
        const ownerDocument = element.ownerDocument;
        const isReady = () => {
            let node = element;
            do {
                if (node.nextSibling) {
                    return true;
                }
            } while ((node = node.parentNode));
            // Returns undefined, which is falsy
        };
        // Check if enough of the document is already loaded/parsed.
        // 1. If using a shadow root, we are always ready.
        // 2. If the document is not "loading", then it is ready enough. "loading"
        // means content is still being added. "interactive" and "complete" are
        // both good enough for DOM manipulation.
        // 3. If any parent of the element has a next sibling, then the element
        // must have been parsed already.
        if (root != element ||
            ownerDocument.readyState != 'loading' ||
            isReady()) {
            callback();
        }
        else {
            // Watch the document or document fragment for changes.
            const unobserve = observe(ownerDocument, element, (isLoaded) => {
                if (isLoaded || isReady()) {
                    unobserve();
                    callback(true);
                }
            });
        }
    };
    // Watch the root of a document for node changes anywhere in the tree. Also,
    // fire the callback when the document loads.
    const observe = (doc, element, callback) => {
        // When the document loads, the element is ready
        const onLoad = () => {
            callback(true);
        };
        doc.addEventListener(DOMContentLoaded, onLoad);
        // Watch the DOM for any changes
        const mutationRoot = element.getRootNode();
        const info = metadataMutationObserver(mutationRoot) ||
            metadataMutationObserver(mutationRoot, {
                s: newSet(),
            });
        const onMutation = () => {
            callback(false);
        };
        info.s.add(onMutation);
        if (!info.o) {
            info.o = new MutationObserver(() => {
                for (const cb of [...info.s]) {
                    cb();
                }
            });
            info.o.observe(mutationRoot, {
                childList: true,
                subtree: true,
            });
        }
        return () => {
            info.s.delete(onMutation);
            doc.removeEventListener(DOMContentLoaded, onLoad);
            if (!info.s.size) {
                info.o.disconnect();
                delete info.o;
            }
        };
    };

    /**
     * Set up config and define a custom element.
     */
    // Decorator to wire a class as a custom component
    const Component = (tag, config) => (target) => component(tag, config, target);
    const component = (tag, configInitial, constructor) => {
        const cssClassName = `fudgel_${tag}`;
        const style = scopeStyle(configInitial.style || '', tag, cssClassName, configInitial.useShadow);
        constructor = constructor || class {
        };
        const template = createTemplate();
        const updateClasses = (templateNode) => {
            const treeWalker = createTreeWalker(templateNode.content, 0x01);
            let currentNode;
            while ((currentNode = treeWalker.nextNode())) {
                if (isTemplate(currentNode)) {
                    updateClasses(currentNode);
                }
                toggleClass(currentNode, cssClassName, true);
            }
        };
        template.innerHTML = configInitial.template;
        updateClasses(template);
        const config = {
            ...configInitial,
            attr: newSet(configInitial.attr || []),
            cssClassName,
            prop: newSet(configInitial.prop || []),
            style,
            tag,
            template: template.innerHTML,
        };
        class CustomElement extends HTMLElement {
            static { this.observedAttributes = [...config.attr].map(camelToDash); }
            attributeChangedCallback(attributeName, _oldValue, newValue) {
                change(this[metadata], dashToCamel(attributeName), newValue);
            }
            connectedCallback() {
                // The root is the element where our template content will be placed.
                const root = config.useShadow
                    ? this.shadowRoot || this.attachShadow({ mode: 'open' })
                    : this;
                // Create the controller and set up links between element and controller
                const controllerMetadata = {
                    ...config,
                    events: new Emitter(),
                    host: this,
                    root,
                    tagName: tag,
                };
                const controller = new constructor(controllerMetadata);
                this[metadata] = controller;
                controller[metadata] = controllerMetadata;
                allControllers.add(controller);
                // Set the class on the host element. Child elements will have
                // it set through the preprocessed template string.
                toggleClass(this, cssClassName, true);
                // Set up bindings before adding child nodes
                for (const propertyName of config.attr) {
                    const attributeName = camelToDash(propertyName);
                    // Set initial value - updates are tracked with
                    // attributeChangedCallback.
                    change(controller, propertyName, getAttribute(this, attributeName));
                    // When the internal property changes, update the attribute but only
                    // if it is a string or null.
                    patchSetter(controller, propertyName, (newValue) => {
                        if ((isString(newValue) || newValue === null) &&
                            controller[metadata]) {
                            setAttribute(this, attributeName, newValue);
                        }
                    });
                }
                for (const propertyName of config.prop) {
                    if (hasOwn(this, propertyName)) {
                        change(controller, propertyName, this[propertyName]);
                    }
                    // When element changes, update controller
                    patchSetter(this, propertyName, (newValue) => change(controller, propertyName, newValue));
                    // When controller changes, update element
                    patchSetter(controller, propertyName, (newValue) => (this[propertyName] = newValue));
                    // Assign the property back to the element in case it was
                    // listed as both a property and an attribute.
                    this[propertyName] = controller[propertyName];
                }
                // Initialize before adding child nodes
                lifecycle(controller, 'init');
                whenParsed(this, root, (wasAsync) => {
                    // Verify that the controller is still bound to an element. Avoids
                    // a race condition where an element is added but not "parsed"
                    // immediately, then removed before this callback can fire.
                    if (controller[metadata]) {
                        lifecycle(controller, 'parse', wasAsync);
                        // Create initial child elements from the template. This creates them
                        // and adds them to the DOM, so do not use `link()`.
                        const template = createTemplate();
                        template.innerHTML = config.template;
                        linkNodes(controller, template.content);
                        // Remove all existing content when not using a shadow DOM to simulate
                        // the same behavior shown when using a shadow DOM.
                        root.innerHTML = '';
                        // With a shadow DOM, append styling within the element.
                        // Add styling to either the parent document or the parent shadow root.
                        const styleParent = root.getRootNode();
                        if (config.style &&
                            !styleParent.querySelector('style.' + cssClassName)) {
                            const s = createElement('style');
                            toggleClass(s, cssClassName, true);
                            s.prepend(createTextNode(config.style));
                            (styleParent.body || styleParent).prepend(s);
                        }
                        // Finally, add the processed nodes
                        root.append(template.content);
                        lifecycle(controller, 'viewInit', wasAsync);
                    }
                });
            }
            disconnectedCallback() {
                const controller = this[metadata];
                lifecycle(controller, 'destroy');
                // Remove the controller from the global list
                allControllers.delete(controller);
                // Remove setters on the element.
                // It is not necessary to remove setters on the controller because
                // all references will be lost.
                removeSetters(this);
                // Remove the controller's metadata
                delete controller[metadata];
                // Remove the link to the controller
                delete this[metadata];
            }
        }
        try {
            customElements.define(tag, CustomElement);
            const componentInfo = [
                CustomElement,
                constructor,
                config,
            ];
            allComponents.add(componentInfo);
            events.emit('component', ...componentInfo);
        }
        catch (_ignore) { }
        return CustomElement;
    };
    const scopeStyleRule = (rule, tagForScope, className, useShadow) => {
        if (rule.selectorText) {
            rule.selectorText = rule.selectorText
                .split(',')
                .map((selector) => {
                selector = selector.trim();
                const addSuffix = (x) => `${x}.${className}`;
                const replaceScope = (x, withThis) => x.replace(/:host/, withThis);
                const doesNotHaveScope = replaceScope(selector, '') == selector;
                if (useShadow) {
                    if (doesNotHaveScope || selector.includes(' ')) {
                        selector = addSuffix(selector);
                    }
                }
                else {
                    selector = replaceScope(selector, tagForScope);
                    if (doesNotHaveScope) {
                        selector = `${tagForScope} ${addSuffix(selector)}`;
                    }
                }
                return selector;
            })
                .join(',');
            tagForScope = ''; // Don't need to scope children selectors
        }
        for (const childRule of rule.cssRules ?? []) {
            scopeStyleRule(childRule, tagForScope, className, useShadow);
        }
        return rule.cssText;
    };
    // 6725
    // Exported for easier testing
    const scopeStyle = (style, tag, className, useShadow) => [...sandboxStyleRules(style)]
        .map(rule => scopeStyleRule(rule, tag, className, useShadow))
        .join('');

    const registered = new Map();
    const circular = [];
    const di = (Key) => {
        if (circular.includes(Key)) {
            circular.push(Key);
            throwError(`Circular dependency: ${circular
            .map((Key) => `${Key.name}`)
            .join(' -> ')}`);
        }
        circular.push(Key);
        const value = registered.get(Key) ||
            registered.set(Key, new Key()).get(Key);
        circular.pop();
        return value;
    };
    const diOverride = (Key, value) => {
        registered.set(Key, value);
    };

    class RouterComponent extends HTMLElement {
        constructor() {
            super();
            this._fragment = createFragment();
            this._lastMatched = [];
            this._routeElements = [];
            this._undo = [];
            let children = this.children;
            let firstChild = children[0];
            if (isTemplate(firstChild)) {
                // Use the children within the template
                this._routeElements = Array.from(firstChild.content.children);
            }
            else {
                // Use direct children and move elements to a document fragment
                while (children.length > 0) {
                    const element = children[0];
                    this._routeElements.push(element);
                    this._fragment.append(element);
                }
            }
        }
        connectedCallback() {
            this._listen(win, 'popstate', this._popState);
            this._listen(doc.body, 'click', this._clickedLink);
            this._route(win.location.pathname);
            this._patch(win.history, 'pushState', this._modifyStateGenerator);
            this._patch(win.history, 'replaceState', this._modifyStateGenerator);
        }
        disconnectedCallback() {
            while (this._undo.length) {
                this._undo.pop()();
            }
        }
        go(url) {
            win.history.pushState(null, '', url);
        }
        _activate(matchedRoute) {
            let append = false;
            if (matchedRoute.e !== this._lastMatched[0]) {
                const title = getAttribute(matchedRoute.e, 'title');
                const component = getAttribute(matchedRoute.e, 'component');
                this.innerHTML = '';
                if (title) {
                    doc.title = title;
                }
                this._lastMatched = [
                    matchedRoute.e,
                    component
                        ? createElement(component)
                        : cloneNode(matchedRoute.e),
                ];
                append = true;
            }
            const e = this._lastMatched[1];
            // Careful - iterating over an array of entries
            for (const [key, value] of matchedRoute.g) {
                setAttribute(e, camelToDash(key), value);
            }
            if (append) {
                this.append(e);
            }
        }
        _clickedLink(e) {
            if (!e.defaultPrevented) {
                const link = e
                    .composedPath()
                    .filter((n) => n.tagName == 'A')[0];
                if (link) {
                    if (link.href &&
                        link.origin == win.location.origin &&
                        !link.href.startsWith('blob:')) {
                        e.preventDefault();
                        this.go(`${link.pathname}${link.search}${link.hash}`);
                    }
                }
            }
        }
        _listen(target, eventName, unboundListener) {
            const boundListener = unboundListener.bind(this);
            target.addEventListener(eventName, boundListener);
            this._undo.push(() => target.removeEventListener(eventName, boundListener));
        }
        _match(url) {
            for (const routeElement of this._routeElements) {
                const path = getAttribute(routeElement, 'path') || '**';
                const regexpAttr = getAttribute(routeElement, 'regexp');
                let regexpStr = path;
                if (!isString(regexpAttr)) {
                    regexpStr = path
                        .replace(/\*+/g, match => match.length > 1 ? '.*' : '[^/]*')
                        .replace(/:[^:\/]+/g, match => `(?<${match.slice(1)}>[^/]+)`);
                }
                const regexp = new RegExp(`^${regexpStr}(/.*)?$`);
                const match = url.match(regexp);
                if (match) {
                    return {
                        e: routeElement,
                        g: entries(match.groups || {}),
                    };
                }
            }
            // Returning undefined is falsy
        }
        _modifyStateGenerator(target, original) {
            return (state, title, url) => {
                original.call(target, state, title, url);
                this._route(url || '/');
            };
        }
        _patch(target, methodName, generator) {
            const original = target[methodName];
            target[methodName] = generator.call(this, target, original);
            this._undo.push(() => (target[methodName] = original));
        }
        _popState() {
            this._route(win.location.pathname);
        }
        _route(url) {
            const matchedRoute = this._match(url);
            if (matchedRoute) {
                this._activate(matchedRoute);
            }
            emit(doc.body, 'routeChange', url);
        }
    }
    const defineRouterComponent = (name = 'router-outlet') => {
        customElements.define(name, RouterComponent);
    };

    /* Slot-like component to enable slots in light DOM.
     *
     * Usage:
     *
     * <outer-element> <!-- a custom element; either shadow or light DOM -->
     *     <inner-element> <!-- another custom element; this one uses light DOM -->
     *         <div slot="title">
     *             <!-- named slot content -->
     *             Title
     *         </div>
     *         <!-- default slot content -->
     *         Other content
     *     </inner-element>
     * </outer-element>
     *
     * The inner element has a template similar to this and correctly uses these
     * slot-like components:
     *
     * <h1><slot-like name="title"></slot-like></h1>
     * <slot-like></slot-lik>
     *
     * The resulting DOM will be:
     *
     * <outer-element>
     *     <inner-element>
     *         <h1><slot-like name="title"><div slot="title">
     *             <!-- named slot content -->
     *             Title
     *         </div></slot-like></h1> <!-- named slot content -->
     *         <slot-like><div>
     *             <!-- default slot content -->
     *             Other content
     *         </div></slot-like>
     *     </inner-element>
     * </outer-element>
     */
    const metadataElementSlotContent = shorthandWeakMap();
    const getFragment = (slotInfo, name) => slotInfo.n[name] || (slotInfo.n[name] = createFragment());
    // Given an element, find its parent element. The parent element may be outside
    // of a shadow root.
    const getParent = (element) => element.parentElement ||
        (element.getRootNode() || {}).host;
    const needsSlotPolyfill = /*@__PURE__*/ newSet();
    const defineSlotComponent = (name = 'slot-like') => {
        class SlotComponent extends HTMLElement {
            constructor() {
                super();
                // Find the parent custom element that is using this component.
                // The parent must not change even if this element is later relocated
                // elsewhere (eg. deeper via content projection into content
                // projection) in the DOM.
                let parent = getParent(this);
                while (parent &&
                    !(this._slotInfo = metadataElementSlotContent(parent))) {
                    parent = getParent(parent);
                }
            }
            attributeChangedCallback(_name, oldValue, newValue) {
                const slotInfo = this._slotInfo;
                if (slotInfo && oldValue !== newValue) {
                    this._removeContent(slotInfo, oldValue);
                    this._addContent(slotInfo);
                }
            }
            connectedCallback() {
                const slotInfo = this._slotInfo;
                if (slotInfo) {
                    // Set the scope of this element to be a child of the outer
                    // element's scope.
                    childScope(slotInfo.s, this);
                    this._addContent(slotInfo);
                }
            }
            disconnectedCallback() {
                if (this._slotInfo) {
                    this._removeContent(this._slotInfo, getAttribute(this, 'name') || '');
                }
            }
            _addContent(slotInfo) {
                const name = getAttribute(this, 'name') || '';
                this.append(slotInfo.n[name] || []);
                this._eventRemover = slotInfo.e.on(name, () => {
                    this._removeContent(slotInfo, name);
                    this._addContent(slotInfo);
                });
            }
            _removeContent(slotInfo, oldName) {
                this._eventRemover();
                getFragment(slotInfo, oldName).append(...this.childNodes);
                slotInfo.e.emit(oldName);
            }
        }
        SlotComponent.observedAttributes = ['name'];
        customElements.define(name, SlotComponent);
        events.on('init', controller => {
            if (needsSlotPolyfill.has(controller.constructor)) {
                const { root: controllerRoot, host: controllerHost, events: controllerEvents, } = controller[metadata];
                controllerEvents.on('parse', () => {
                    // When the controller is destroyed, restore the original HTML
                    // content back to the element.
                    const originalHTML = controllerRoot.innerHTML;
                    controllerEvents.on('destroy', () => (controllerRoot.innerHTML = originalHTML));
                    // Track information necessary for the slot-like custom element
                    const slotInfo = metadataElementSlotContent(controllerRoot, {
                        // Event emitter
                        e: new Emitter(),
                        // Slots - named ones are set as additional properties. Unnamed
                        // slot content is combined into the '' fragment.
                        n: {
                            '': createFragment(),
                        },
                        // Scope for the <slot-like> element.
                        s: getScope(getParent(controllerHost)),
                    });
                    // Grab all content for named slots
                    for (const child of [
                        ...controllerRoot.querySelectorAll('[slot]'),
                    ]) {
                        getFragment(slotInfo, getAttribute(child, 'slot') || '').append(child);
                    }
                    // Now collect everything else and add it to the default slot
                    for (const child of [...controllerRoot.childNodes]) {
                        slotInfo.n[''].append(child);
                    }
                });
            }
        });
        // Rewrite templates for custom elements that use slots in light DOM.
        const rewrite = (_baseClass, controllerConstructor, config) => {
            if (!config.useShadow) {
                let rewrittenSlotElement = false;
                let foundSlotLikeElement = false;
                const template = createTemplate();
                template.innerHTML = config.template;
                const treeWalker = createTreeWalker(template.content, 0x01);
                let currentNode;
                while ((currentNode = treeWalker.nextNode())) {
                    // Change DOM elements in the template from <slot> to the
                    // <slot-like>
                    if (currentNode.nodeName == 'SLOT') {
                        rewrittenSlotElement = true;
                        const slotLike = createElement(name);
                        for (const attr of currentNode.attributes) {
                            setAttribute(slotLike, attr.name, attr.value);
                        }
                        treeWalker.previousNode();
                        slotLike.append(...currentNode.childNodes);
                        currentNode.replaceWith(slotLike);
                    }
                    else if (currentNode.nodeName == 'SLOT-LIKE') {
                        foundSlotLikeElement = true;
                    }
                }
                if (rewrittenSlotElement) {
                    config.template = template.innerHTML;
                }
                if (rewrittenSlotElement || foundSlotLikeElement) {
                    needsSlotPolyfill.add(controllerConstructor);
                }
            }
        };
        for (const info of allComponents) {
            rewrite(...info);
        }
        events.on('component', rewrite);
    };

    const css = (strings, ...values) => String.raw({ raw: strings }, ...values);
    const html = css;

    exports.Component = Component;
    exports.Emitter = Emitter;
    exports.RouterComponent = RouterComponent;
    exports.addDirective = addDirective;
    exports.allComponents = allComponents;
    exports.component = component;
    exports.css = css;
    exports.defineRouterComponent = defineRouterComponent;
    exports.defineSlotComponent = defineSlotComponent;
    exports.di = di;
    exports.diOverride = diOverride;
    exports.emit = emit;
    exports.events = events;
    exports.getAttribute = getAttribute;
    exports.getScope = getScope;
    exports.html = html;
    exports.link = link;
    exports.linkNodes = linkNodes;
    exports.metadata = metadata;
    exports.parse = parse;
    exports.setAttribute = setAttribute;
    exports.unlink = unlink;
    exports.update = update;

}));
