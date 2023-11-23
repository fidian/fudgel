import { metadataScope } from './metadata';

export const getScope = (node: Node) => {
    let scope = metadataScope(node);
    let n = node.parentNode;

    while (!scope && n) {
        scope = metadataScope(n);
        n = n.parentNode;
    }

    return scope || {};
};

export const childScope = (parentScope: Object, childNode: Node) => {
    const scope = Object.create(parentScope);
    metadataScope(childNode, scope);

    return scope;
};
