import { Controller } from './controller.js';
import { createFragment, createTreeWalker } from './elements.js';
import { linkElementNode } from './link-element-node.js';
import { linkStructuralDirective } from './link-structural-directive.js';
import { linkTextNode } from './link-text-node.js';

/**
 * Link elements and nodes to functions and the controller.
 *
 * The resulting "resultQueue"'s first element is based on processQueue's
 * first element. The second element for each item is the altered node,
 * comment anchor, or similar. No action is taken here to append to the
 * parent or insert after the previous sibling.
 */
export const linkNodes = (
    root: Node,
    controller: Object
) => {
    const treeWalker = createTreeWalker(root, 0x85);
    let currentNode;

    while (currentNode = treeWalker.nextNode()) {
        if (currentNode.nodeName === 'TEMPLATE') {
            linkNodes((currentNode as HTMLTemplateElement).content, controller);
        }

        linkStructuralDirective(controller, treeWalker, currentNode as HTMLElement) ||
            linkTextNode(controller, currentNode as Text) ||
            linkElementNode(
                controller,
                currentNode as HTMLElement
            );
    }
};

export const linkNodesWrapped = (node: Node, controller: Controller) => {
    const fragment = createFragment();
    fragment.append(node);
    linkNodes(fragment, controller);
}
