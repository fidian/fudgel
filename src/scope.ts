import { doc } from './elements.js';
import { metadataScope } from './metadata.js';
import { Obj } from './util.js';

export const GlobalScope = Symbol();

export type Scope = Record<string | symbol, any>;

// When running getScope during initial node linking, the node is not yet
// attached to a parent, so it will not accidentally pick up the parent's
// scope.
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
        scope = metadataScope(doc.body, {});
        (scope as Scope)[GlobalScope] = scope;
    }

    return scope;
};

export const childScope = (parentScope: Scope, childNode: Node): Scope => {
    const scope = Obj.create(parentScope);
    metadataScope(childNode, scope);

    return scope;
};
