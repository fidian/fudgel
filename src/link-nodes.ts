import { Controller } from './controller';
import { createFragment, doc } from './elements';
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
    root: Node,
    controller: Object
) => {
    // NodeFilter.SHOW_ELEMENT = 0x1
    // NodeFilter.SHOW_TEXT = 0x4
    // NodeFilter.SHOW_COMMENT = 0x80 - necessary for structural directives
    const treeWalker = doc.createTreeWalker(root, 0x1 + 0x4 + 0x80);

    // true is a special flag where a controller advanced the pointer but there
    // is no next node.
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
