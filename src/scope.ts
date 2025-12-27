import { doc } from './elements.js';
import { Obj } from './util.js';
import { shorthandWeakMap } from './maps.js';
import { metadata } from './symbols.js';

const elementToScope = shorthandWeakMap<Node, Scope>();;

export type Scope = Record<string | symbol, any>;

// When running getScope during initial node linking, the node is not yet
// attached to a parent, so it will not accidentally pick up the parent's
// scope.
export const getScope = (node: Node): Scope => {
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
}

export const childScope = (parentScope: Scope, childNode: Node): Scope =>
    elementToScope(childNode, Obj.create(parentScope));
