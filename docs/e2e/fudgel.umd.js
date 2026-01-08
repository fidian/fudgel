(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Fudgel = {}));
})(this, (function (exports) { 'use strict';

    const allControllers = new Set();

    const metadata = Symbol();

    const newSet = (...iterables) => new Set(iterables.flatMap(list => [...list]));

    const dispatchCustomEvent = (e, eventName, detail, customEventInit = {}) => {
        e.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail,
            ...customEventInit,
        }));
    };
    const emit = (controller, eventName, detail, customEventInit = {}) => {
        const e = controller[metadata]?.host;
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
        if (controller.onChange) {
            const { attr, prop } = controller[metadata];
            for (const name of newSet(prop, attr)) {
                controller.onChange(name, controller[name], controller[name]);
            }
        }
        controller[metadata]?.events.emit('update');
    };

    class Emitter {
        constructor() {
            this._m = new Map();
        }
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

    const allComponents = new Set();

    const Obj = Object;
    const stringify = (x) => JSON.stringify(x);
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
    const entries = (iterable) => iterable.entries?.() ?? Obj.entries(iterable);
    const isTemplate = (node) => node.nodeName == 'TEMPLATE';

    const doc = document;
    const win = window;
    const cloneNode = (node) => node.cloneNode(true);
    const createElement = (name) => doc.createElement(name);
    const createTextNode = (content) => doc.createTextNode(content);
    const createComment = (content) => doc.createComment(content);
    const createFragment = () => doc.createDocumentFragment();
    const createTemplate = () => createElement('template');
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
            const onRemove = (removedNode) => {
                if (removedNode.contains(node)) {
                    onDestroy();
                }
            };
            const removers = [
                controller[metadata]?.events.on('update', callback),
                controller[metadata]?.events.on('unlink', onRemove),
                controller[metadata]?.events.on('destroy', onDestroy)
            ];
        }
    };
    const findBindingTarget = (controller, scope, binding) => hasOwn(scope, binding)
        ? scope
        : hasOwn(scope, metadata)
            ? controller
            : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);

    const elementToScope = shorthandWeakMap();
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

    let expr = '';
    let index = 0;
    let code = 0;
    let moreToParse = false;
    const escapeCodes = {
        b: '\b',
        f: '\f',
        n: '\n',
        r: '\r',
        t: '\t',
        v: '\v',
    };
    const unaryOps = {
        '-': arg => root => [-arg(root)[0]],
        '!': arg => root => [!arg(root)[0]],
        '~': arg => root => [~arg(root)[0]],
        '+': arg => root => [+arg(root)[0]],
        typeof: arg => root => [typeof arg(root)[0]],
    };
    const binaryOps = {
        '||': [3, (left, right) => root => [left(root)[0] || right(root)[0]]],
        '??': [3, (left, right) => root => [left(root)[0] ?? right(root)[0]]],
        '&&': [4, (left, right) => root => [left(root)[0] && right(root)[0]]],
        '|': [5, (left, right) => root => [left(root)[0] | right(root)[0]]],
        '^': [6, (left, right) => root => [left(root)[0] ^ right(root)[0]]],
        '&': [7, (left, right) => root => [left(root)[0] & right(root)[0]]],
        '===': [8, (left, right) => root => [left(root)[0] === right(root)[0]]],
        '==': [8, (left, right) => root => [left(root)[0] == right(root)[0]]],
        '!==': [8, (left, right) => root => [left(root)[0] !== right(root)[0]]],
        '!=': [8, (left, right) => root => [left(root)[0] != right(root)[0]]],
        '<<': [10, (left, right) => root => [left(root)[0] << right(root)[0]]],
        '>>>': [10, (left, right) => root => [left(root)[0] >>> right(root)[0]]],
        '>>': [10, (left, right) => root => [left(root)[0] >> right(root)[0]]],
        '<=': [9, (left, right) => root => [left(root)[0] <= right(root)[0]]],
        '<': [9, (left, right) => root => [left(root)[0] < right(root)[0]]],
        '>=': [9, (left, right) => root => [left(root)[0] >= right(root)[0]]],
        '>': [9, (left, right) => root => [left(root)[0] > right(root)[0]]],
        instanceof: [
            9,
            (left, right) => root => [left(root)[0] instanceof right(root)[0]],
        ],
        in: [9, (left, right) => root => [left(root)[0] in right(root)[0]]],
        '+': [11, (left, right) => root => [left(root)[0] + right(root)[0]]],
        '-': [11, (left, right) => root => [left(root)[0] - right(root)[0]]],
        '**': [13, (left, right) => root => [left(root)[0] ** right(root)[0]], 1],
        '*': [12, (left, right) => root => [left(root)[0] * right(root)[0]]],
        '/': [12, (left, right) => root => [left(root)[0] / right(root)[0]]],
        '%': [12, (left, right) => root => [left(root)[0] % right(root)[0]]],
    };
    const literals = {
        true: true,
        false: false,
        null: null,
        undefined: undefined,
    };
    const defaultValueProvider = () => [() => [], newSet()];
    const jsep = (exprToParse) => {
        expr = exprToParse;
        index = -1;
        gobbleSpaces(1);
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
        catch (ignore) { }
        return [
            (...roots) => result[0](new Proxy({}, {
                get(_ignoreTarget, prop) {
                    for (const root of roots) {
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
    const advance = (n = 1) => {
        index += n;
        code = expr.charCodeAt(index);
        moreToParse = code >= 0;
    };
    const char = () => expr.charAt(index);
    const isDecimalDigit = (charCode = code) => charCode > 47 && charCode < 58;
    const isIdentifierStart = (charCode = code) => (charCode > 64 && charCode < 91) ||
        (charCode > 96 && charCode < 123) ||
        charCode > 127 ||
        charCode == 36 ||
        charCode == 95;
    const isIdentifierPart = (charCode) => isIdentifierStart(charCode) || isDecimalDigit(charCode);
    const throwJsepError = () => {
        throwError(`Parse error at index ${index}: ${expr}`);
    };
    const gobbleSpaces = (advanceChars = 0) => {
        if (advanceChars) {
            advance(advanceChars);
        }
        while (code == 32 ||
            code == 9 ||
            code == 10 ||
            code == 13) {
            advance();
        }
    };
    const gobbleExpression = () => {
        const combineLast = () => {
            const r = stack.pop(), op = stack.pop(), l = stack.pop();
            stack.push([op[1](l[0], r[0]), newSet(l[1], r[1])]);
        };
        const left = gobbleToken();
        if (!left) {
            return left;
        }
        let biop = gobbleTokenFromList(binaryOps);
        if (!biop) {
            return left;
        }
        const stack = [
            left,
            biop,
            gobbleToken() || throwJsepError(),
        ];
        const comparePrev = (prev) => prev[2] ^ (biop[0] <= prev[0]);
        while ((biop = gobbleTokenFromList(binaryOps))) {
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
    const gobbleTokenFromList = (tokenList) => {
        for (const item of Obj.keys(tokenList)) {
            if (expr.substr(index, item.length) == item) {
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
        if (isDecimalDigit() || code == 46) {
            return gobbleNumericLiteral();
        }
        if (code == 34 || code == 39) {
            const str = gobbleStringLiteral();
            node = [() => [str], newSet()];
        }
        else if (code === 91) {
            gobbleSpaces(1);
            node = gobbleArguments(93, true);
        }
        else if (code === 123) {
            node = gobbleObjectLiteral();
        }
        else {
            const op = gobbleTokenFromList(unaryOps);
            if (op) {
                const argument = gobbleToken() || throwJsepError();
                return [op(argument[0]), argument[1]];
            }
            const identifier = gobbleIdentifier();
            node =
                identifier in literals
                    ? [() => [literals[identifier]], newSet()]
                    : [root => root[identifier], newSet([identifier])];
        }
        return gobbleTokenProperty(node);
    };
    const gobbleTokenProperty = (node) => {
        while (code == 46 ||
            code == 91 ||
            code == 40 ||
            code == 63) {
            let optional;
            let action;
            let bindings = newSet();
            let prevNode = node;
            if (code == 63) {
                advance();
                if (code !== 46) {
                    advance(-1);
                    return node;
                }
                optional = true;
            }
            if (code == 91) {
                gobbleSpaces(1);
                const expression = gobbleExpression() || throwJsepError();
                action = (value, root) => [
                    value[0][expression[0](root)[0]],
                    value[0],
                ];
                bindings = expression[1];
                if (code !== 93) {
                    throwJsepError();
                }
                gobbleSpaces(1);
            }
            else if (code == 40) {
                gobbleSpaces(1);
                const args = gobbleArguments(41);
                action = (value, root) => [
                    value[0].apply(value[1], args[0](root)[0]),
                ];
                bindings = args[1];
            }
            else if (code == 46) {
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
        if (code == 46) {
            number += '.';
            advance();
            while (isDecimalDigit()) {
                number += char();
                advance();
            }
        }
        if (code == 101 || code == 69) {
            number += char();
            advance();
            if (code == 43 || code == 45) {
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
        if (isIdentifierStart()) {
            throwJsepError();
        }
        else if (code == 46 || number == '.') {
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
                advance();
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
    const gobbleArguments = (terminator, allowEmpty) => {
        const args = [];
        while (code !== terminator) {
            if (!moreToParse) {
                throwJsepError();
            }
            args.push(allowEmpty && code == 44 ? defaultValueProvider() : gobbleExpression());
            if (code == 44) {
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
        while (code !== 125) {
            let propName;
            let propNameProvider;
            if (!moreToParse) {
                throwJsepError();
            }
            if (isDecimalDigit() || code == 46) {
                propNameProvider = gobbleNumericLiteral();
            }
            else if (code == 34 || code == 39) {
                propName = gobbleStringLiteral();
            }
            else if (code == 91) {
                gobbleSpaces(1);
                propNameProvider = gobbleExpression();
                if (code != 93) {
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
            if (code == 58) {
                gobbleSpaces(1);
                props.push([propNameProvider, gobbleExpression()]);
            }
            else if (!propName) {
                throwJsepError();
            }
            else {
                props.push([
                    propNameProvider,
                    [root => [root[propName][0]], newSet([propName])],
                ]);
            }
            if (code == 44) {
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

    const memoize = (fn) => {
        const cache = new Map();
        return (arg) => cache.has(arg) ? cache.get(arg) : cache.set(arg, fn(arg)).get(arg);
    };
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
    const parseAttr = (text) => {
        const splitResult = splitText(text);
        const first = splitResult?.[0];
        if (first?.length == 3 && first[0] == '' && first[2] == '') {
            return [
                (...roots) => {
                    const x = first[1](...roots);
                    return typeof x == 'boolean' ? x : toString(x);
                },
                splitResult[1],
            ];
        }
        return assembleCall(splitResult);
    };
    const parseText = (text) => assembleCall(splitText(text));
    const parse = {
        attr: memoize(parseAttr),
        js: memoize(jsep),
        text: memoize(parseText),
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

    const modifierGuards = {
        stop: e => e.stopPropagation(),
        prevent: e => e.preventDefault(),
        self: (e, node) => e.target !== node,
        outside: (e, node) => node.contains(e.target),
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
                toggleClass(node, key, !!value);
            }
        };
        addBindings(controller, node, update, parsed[1], scope);
        update();
        setAttribute(node, attrName);
    };

    const change = (controller, propertyName, newValue) => {
        if (controller?.[metadata]) {
            const oldValue = controller[propertyName];
            if (oldValue !== newValue) {
                controller[propertyName] = newValue;
                controller.onChange?.(propertyName, newValue, oldValue);
                controller[metadata]?.events.emit('change', propertyName);
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
            for (const [key, value] of entries(iterable)) {
                let copy = oldNodes.get(key);
                oldNodes.delete(key);
                if (copy === lastNode.nextSibling) {
                    const scope = getScope(copy);
                    scope[valueName] = value;
                }
                else {
                    if (copy) {
                        unlink(controller, copy);
                        copy.remove();
                    }
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
                    activeNode = cloneNode(source);
                    childScope(scope, activeNode);
                    link(controller, activeNode);
                    anchor.after(activeNode);
                }
            }
            else {
                if (activeNode) {
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
                    if (directive) {
                        throwError(`${directive[0]} breaks ${k}`);
                    }
                    directive = [k, v, attr.nodeValue || ''];
                }
            }
            if (directive) {
                const anchor = createComment(`${directive[0]}=${stringify(directive[2])}`);
                currentNode.before(anchor);
                treeWalker.previousNode();
                currentNode.remove();
                treeWalker.nextNode();
                setAttribute(currentNode, directive[0]);
                directive[1](controller, anchor, currentNode, directive[2], directive[0]);
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

    const link = (controller, node) => {
        const fragment = createFragment();
        fragment.append(node);
        linkNodes(controller, fragment);
    };
    const linkNodes = (controller, root) => {
        const treeWalker = createTreeWalker(root, 0x85);
        let currentNode;
        while (currentNode = treeWalker.nextNode()) {
            if (isTemplate(currentNode)) {
                linkNodes(controller, currentNode.content);
            }
            const type = currentNode.nodeType;
            if (type == 3) {
                linkTextNode(controller, currentNode);
            }
            else if (type == 1) {
                linkStructuralDirective(controller, treeWalker, currentNode) ||
                    linkElementNode(controller, currentNode);
            }
        }
    };
    const unlink = (controller, root) => {
        controller[metadata]?.events.emit('unlink', root);
    };

    const metadataMutationObserver = shorthandWeakMap();
    const DOMContentLoaded = 'DOMContentLoaded';
    const whenParsed = (element, root, callback) => {
        const ownerDocument = element.ownerDocument;
        const isReady = () => {
            let node = element;
            do {
                if (node.nextSibling) {
                    return true;
                }
            } while ((node = node.parentNode));
        };
        if (root != element ||
            ownerDocument.readyState != 'loading' ||
            isReady()) {
            callback();
        }
        else {
            const unobserve = observe(ownerDocument, element, (isLoaded) => {
                if (isLoaded || isReady()) {
                    unobserve();
                    callback(true);
                }
            });
        }
    };
    const observe = (doc, element, callback) => {
        const onLoad = () => {
            callback(true);
        };
        doc.addEventListener(DOMContentLoaded, onLoad);
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
            template: template.innerHTML,
        };
        class CustomElement extends HTMLElement {
            static { this.observedAttributes = [...config.attr].map(camelToDash); }
            attributeChangedCallback(attributeName, _oldValue, newValue) {
                change(this[metadata], dashToCamel(attributeName), newValue);
            }
            connectedCallback() {
                const root = config.useShadow
                    ? this.shadowRoot || this.attachShadow({ mode: 'open' })
                    : this;
                const controllerMetadata = {
                    ...config,
                    events: new Emitter(),
                    host: this,
                    root,
                };
                const controller = new constructor(controllerMetadata);
                this[metadata] = controller;
                controller[metadata] = controllerMetadata;
                allControllers.add(controller);
                toggleClass(this, cssClassName, true);
                for (const propertyName of config.attr) {
                    const attributeName = camelToDash(propertyName);
                    change(controller, propertyName, getAttribute(this, attributeName));
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
                    patchSetter(this, propertyName, (newValue) => change(controller, propertyName, newValue));
                    patchSetter(controller, propertyName, (newValue) => (this[propertyName] = newValue));
                    this[propertyName] = controller[propertyName];
                }
                controller.onInit?.();
                whenParsed(this, root, (wasAsync) => {
                    if (controller[metadata]) {
                        controller.onParse?.(wasAsync);
                        const template = createTemplate();
                        template.innerHTML = config.template;
                        linkNodes(controller, template.content);
                        root.innerHTML = '';
                        const styleParent = root.getRootNode();
                        if (config.style &&
                            !styleParent.querySelector('style.' + cssClassName)) {
                            const s = createElement('style');
                            toggleClass(s, cssClassName, true);
                            s.prepend(createTextNode(config.style));
                            (styleParent.body || styleParent).prepend(s);
                        }
                        root.append(template.content);
                        controller.onViewInit?.(wasAsync);
                    }
                });
            }
            disconnectedCallback() {
                const controller = this[metadata];
                controller.onDestroy?.();
                controller[metadata].events.emit('destroy');
                allControllers.delete(controller);
                removeSetters(this);
                delete controller[metadata];
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
        catch (_) { }
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
            tagForScope = '';
        }
        for (const childRule of rule.cssRules ?? []) {
            scopeStyleRule(childRule, tagForScope, className, useShadow);
        }
        return rule.cssText;
    };
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
                this._routeElements = Array.from(firstChild.content.children);
            }
            else {
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
            dispatchCustomEvent(doc.body, 'routeChange', url);
        }
    }
    const defineRouterComponent = (name = 'router-outlet') => {
        customElements.define(name, RouterComponent);
    };

    const metadataElementSlotContent = shorthandWeakMap();
    const getFragment = (slotInfo, name) => slotInfo.n[name] || (slotInfo.n[name] = createFragment());
    const getParent = (element) => element.parentElement ||
        (element.getRootNode() || {}).host;
    const defineSlotComponent = (name = 'slot-like') => {
        class SlotComponent extends HTMLElement {
            constructor() {
                super();
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
        const rewrite = (_baseClass, controllerConstructor, config) => {
            if (!config.useShadow) {
                let rewrittenSlotElement = false;
                let foundSlotLikeElement = false;
                const template = createTemplate();
                template.innerHTML = config.template;
                const treeWalker = createTreeWalker(template.content, 0x01);
                let currentNode;
                while ((currentNode = treeWalker.nextNode())) {
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
                    const proto = controllerConstructor.prototype;
                    const onParse = proto.onParse;
                    const onDestroy = proto.onDestroy;
                    proto.onParse = function () {
                        const controllerMetadata = this[metadata];
                        const root = controllerMetadata.root;
                        const slotInfo = metadataElementSlotContent(root, {
                            c: root.innerHTML,
                            e: new Emitter(),
                            n: {
                                '': createFragment(),
                            },
                            s: getScope(getParent(controllerMetadata.host)),
                        });
                        for (const child of [...root.querySelectorAll('[slot]')]) {
                            getFragment(slotInfo, getAttribute(child, 'slot') || '').append(child);
                        }
                        for (const child of [...root.childNodes]) {
                            slotInfo.n[''].append(child);
                        }
                        onParse?.call(this);
                    };
                    proto.onDestroy = function () {
                        const root = this[metadata].root;
                        const slotInfo = metadataElementSlotContent(root);
                        root.innerHTML = slotInfo.c;
                        onDestroy?.call(this);
                    };
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
