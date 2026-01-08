import { Controller } from './controller-types.js';
import { createFragment, createTreeWalker } from './elements.js';
import { lifecycle } from './lifecycle.js';
import { linkElementNode } from './link-element-node.js';
import { linkStructuralDirective } from './link-structural-directive.js';
import { linkTextNode } from './link-text-node.js';
import { isTemplate } from './util.js';

/**
 * Link unattached nodes by first putting them into a fragment, then linking
 * them to the controller and child scopes. The DOM structure will change. When
 * everything is done, the node is ready to be appended into the live document.
 *
 * Use this function when a node is not yet attached to the document.
 */
export const link = (controller: Controller, node: Node) => {
    const fragment = createFragment();
    fragment.append(node);
    linkNodes(controller, fragment);
}

/**
 * Link elements and nodes to functions and the controller.
 *
 * The resulting "resultQueue"'s first element is based on processQueue's
 * first element. The second element for each item is the altered node,
 * comment anchor, or similar. No action is taken here to append to the
 * parent or insert after the previous sibling.
 *
 * Only use this function when the node is attached to a parent, such as the
 * document, a fragment, or template.
 */
export const linkNodes = (
    controller: Object,
    root: Node
) => {
    const treeWalker = createTreeWalker(root, 0x85);
    let currentNode;

    while (currentNode = treeWalker.nextNode()) {
        if (isTemplate(currentNode)) {
            // Recurse into the template
            linkNodes(controller, (currentNode as HTMLTemplateElement).content);
        }

        const type = currentNode.nodeType;

        // Node.TEXT_NODE === 3
        if (type == 3) {
            linkTextNode(controller, currentNode as Text);
        } else if (type == 1) {
            linkStructuralDirective(controller, treeWalker, currentNode as HTMLElement) ||
            linkElementNode(
                controller,
                currentNode as HTMLElement
            );
        }
    }
};

/**
 * Issue an unlink event on the controller.
 */
export const unlink = (controller: Controller, root: Node) => {
    lifecycle(controller, 'unlink', root);
};
