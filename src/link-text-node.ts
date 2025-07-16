import { addBindings } from './bindings.js';
import { getScope } from './scope.js';
import { parseText } from './parse.js';
import { win } from './elements.js';

export function linkTextNode(controller: Object, currentNode: Text): void | number {
    // Node.TEXT_NODE === 3
    if (currentNode.nodeType === 3) {
        const result = parseText(currentNode.textContent || '');

        if (result) {
            const scope = getScope(currentNode);
            const update = (thisRef: Object) => {
                currentNode.nodeValue = result[0]([scope, thisRef]);
            };
            addBindings(controller, currentNode, update, result[1], scope);
            update(controller);

            return 1;
        }
    }
}
