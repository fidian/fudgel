import { doc } from './elements.js';
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
