import { Controller } from './controller';
import { doc, win } from './elements.js';
import { metadataScope } from './metadata.js';

export type Scope = Record<string | symbol, any>;

export const getScope = (node: Node): Scope => {
    let scope = metadataScope(node);

    if (node) {
        let n = node.parentNode;

        while (!scope && n) {
            scope = metadataScope(n);
            n = n.parentNode;
        }
    }

    if (!scope) {
        scope = {};
        metadataScope(doc.body, scope);
    }

    return scope;
};

export const childScope = (parentScope: Scope, childNode: Node): Scope => {
    const scope = Object.create(parentScope);
    metadataScope(childNode, scope);

    return scope;
};

// Used when running the parsed function. This proxy will search the active
// scope, then the controller, and finally fall back on the global object.
export const scopeProxy = (controller: Controller, scope: Scope) => {
    return new Proxy(controller, {
        get: (target, key) =>
            key in scope
                ? [scope[key], scope]
                : key in target
                  ? [target[key], target]
                  : [win[key as any], win],
    });
};
