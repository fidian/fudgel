import { addBindings } from './bindings.js';
import { getScope } from './scope.js';
import { parseText } from './parse.js';

export function linkTextNode(controller: Object, currentNode: Text): void | number {
    // Node.TEXT_NODE === 3
    if (currentNode.nodeType === 3) {
        const result = parseText(currentNode.textContent || '');

        if (result) {
            const update = (thisRef: Object) => {
                currentNode.nodeValue = result.fn.call(thisRef, getScope(currentNode));
            };
            addBindings(controller, currentNode, update, result.binds);
            update(controller);

            return 1;
        }
    }
}
