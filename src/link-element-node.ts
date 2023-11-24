import { addBindings } from './bindings';
import { directives, GENERAL_DIRECTIVE_INDEX } from './directive/index';
import { getScope } from './scope';
import { parseText } from './parse';

export function linkElementNode(
    controller: Object,
    parentNode: HTMLElement | Comment,
    useAppend: boolean,
    node: HTMLElement,
    processQueue: [Node, Node][]
) {
    // Node.ELEMENT_NODE === 1
    if (node.nodeType !== 1) {
        return false;
    }

    for (const childNode of [...node.childNodes]) {
        childNode.remove();
        processQueue.push([node, childNode]);
    }

    if (useAppend) {
        parentNode.appendChild(node);
    } else {
        parentNode.after(node);
    }

    for (const attr of [...node.attributes]) {
        const attrName = attr.nodeName;
        const firstChar = attrName.charAt(0);

        // Structural directives (those starting with '*') are applied
        // earlier and have been removed by this point.
        const directiveList = directives[GENERAL_DIRECTIVE_INDEX];
        const applyDirective =
            directiveList[attrName] ||
            directiveList[firstChar] ||
            directiveList[''];

        applyDirective && applyDirective(controller, node, attr.nodeValue || '', attrName);
    }

    const result = parseText(node.textContent || '');

    if (result) {
        const update = (thisRef: Object) => {
            node.nodeValue = result.fn.call(thisRef, getScope(node));
        };
        addBindings(controller, node, update, result.binds);
        update(controller);
    }

    return true;
}
