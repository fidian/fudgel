import { directives, GENERAL_DIRECTIVE_INDEX } from './directive/index.js';
import { iterate } from './util.js';

export function linkElementNode(
    controller: Object,
    currentNode: HTMLElement
): void {
    // Node.ELEMENT_NODE === 1
    if (currentNode.nodeType === 1) {
        iterate(currentNode.attributes, (attr) => {
            const attrName = attr.nodeName;
            const firstChar = attrName.charAt(0);

            // Structural directives (those starting with '*') are applied
            // earlier and have been removed by this point.
            const directiveList = directives[GENERAL_DIRECTIVE_INDEX];
            const applyDirective =
                directiveList[attrName] ||
                directiveList[firstChar] ||
                directiveList[''];

            applyDirective?.(controller, currentNode, attr.nodeValue || '', attrName);
        });
    }
}
