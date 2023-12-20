import { directives, GENERAL_DIRECTIVE_INDEX } from './directive/index';

export function linkElementNode(
    controller: Object,
    currentNode: HTMLElement
): void | number {
    // Node.ELEMENT_NODE === 1
    if (currentNode.nodeType === 1) {
        for (const attr of [...currentNode.attributes]) {
            const attrName = attr.nodeName;
            const firstChar = attrName.charAt(0);

            // Structural directives (those starting with '*') are applied
            // earlier and have been removed by this point.
            const directiveList = directives[GENERAL_DIRECTIVE_INDEX];
            const applyDirective =
                directiveList[attrName] ||
                directiveList[firstChar] ||
                directiveList[''];

            applyDirective && applyDirective(controller, currentNode, attr.nodeValue || '', attrName);
        }
    }

    return 1;
}
