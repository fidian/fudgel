import { generalDirectives } from './directive/index.js';

export const linkElementNode = (
    controller: Object,
    currentNode: HTMLElement
): void => {
    for (const attr of [...currentNode.attributes]) {
        const attrName = attr.nodeName;
        const firstChar = attrName.charAt(0);

        // Structural directives (those starting with '*') are applied
        // earlier and have been removed by this point.
        const applyDirective =
            generalDirectives[attrName] ||
            generalDirectives[firstChar] ||
            generalDirectives[''];

        applyDirective?.(
            controller,
            currentNode,
            attr.nodeValue || '',
            attrName
        );
    }
};
