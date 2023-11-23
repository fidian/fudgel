import { addBindings } from './bindings';
import { getScope } from './scope';
import { parseText } from './parse';

export function linkTextNode(controller: Object, parentNode: Node, node: Text) {
    // Node.TEXT_NODE === 3
    if (node.nodeType !== 3) {
        return false;
    }

    const result = parseText(node.textContent || '');
    parentNode.appendChild(node);

    if (result) {
        const update = (thisRef: Object) => {
            node.nodeValue = result.fn.call(thisRef, getScope(node));
        };
        addBindings(controller, node, update, result.binds);
        update(controller);
    }

    return true;
}
