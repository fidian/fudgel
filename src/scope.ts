import { doc } from './elements.js';
import { metadataScope } from './metadata.js';

export const getScope = (node: Node) => {
    let scope = metadataScope(node);
    let n = node.parentNode;

    while (!scope && n) {
        scope = metadataScope(n);
        n = n.parentNode;
    }

    if (!scope) {
        scope = {};
        metadataScope(doc.body, scope);
    }

    return scope;
};

export const childScope = (parentScope: Object, childNode: Node) => {
    const scope = Object.create(parentScope);
    metadataScope(childNode, scope);

    return scope;
};
