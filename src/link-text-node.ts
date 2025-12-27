import { addBindings } from './bindings.js';
import { getScope } from './scope.js';
import { parse } from './parse.js';

export const linkTextNode = (controller: Object, currentNode: Text): void | number => {
    const result = parse.text(currentNode.textContent || '');

    if (result) {
        const scope = getScope(currentNode);
        const update = () => {
            currentNode.nodeValue = result[0](scope, controller);
        };
        addBindings(controller, currentNode, update, result[1], scope);
        update();

        return 1;
    }
}
