import { linkElementNode } from './link-element-node';
import { linkStructuralDirective } from './link-structural-directive';
import { linkTextNode } from './link-text-node';

/**
 * Link elements and nodes to functions and the controller.
 *
 * The resulting "resultQueue"'s first element is based on processQueue's
 * first element. The second element for each item is the altered node,
 * comment anchor, or similar. No action is taken here to append to the
 * parent or insert after the previous sibling.
 */
export const linkNodes = (
    processQueue: [Node, Node][],
    controller: Object
) => {
    // Breadth-first processing across elements.
    while (processQueue.length) {
        let [parentNode, childNode] = processQueue.shift()!;

        // I think I need to move the appending of the node to within the link
        linkStructuralDirective(controller, parentNode, childNode as HTMLElement) ||
            linkTextNode(controller, parentNode, childNode as Text) ||
            linkElementNode(
                controller,
                parentNode as HTMLElement,
                true,
                childNode as HTMLElement,
                processQueue
            ) || (parentNode.appendChild(childNode));
    }
};
