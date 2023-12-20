import { createComment } from './elements';
import { directives, STRUCTURAL_DIRECTIVE_INDEX } from './directive/index';
import { entries, setAttribute, stringify } from './util';
import { StructuralDirective } from './directive/types';

export const linkStructuralDirective = (
    controller: Object,
    treeWalker: TreeWalker,
    currentNode: HTMLElement
): Node | null | void | 1 => {
    const attrs = currentNode.attributes;

    // Node.ELEMENT_NODE === 1
    if (currentNode.nodeType === 1 && attrs) {
        let directive: [string, StructuralDirective, string] | undefined;

        for (const [k, v] of entries(
            directives[STRUCTURAL_DIRECTIVE_INDEX]
        )) {
            const attr = attrs.getNamedItem(k);

            if (attr) {
                // Only allow one structural directive on an element
                if (directive) {
                    throw new Error(`${directive[0]} breaks ${k}`);
                }

                directive = [k, v, attr.nodeValue || ''];
            }
        }

        if (directive) {
            // Create a comment anchor and insert before current node.
            const anchor = createComment(`${directive[0]}=${stringify(directive[2])}`);
            currentNode.before(anchor);

            // Move tree walker to the anchor, then pull currentNode out of
            // DOM.
            treeWalker.previousNode();
            currentNode.remove();

            // Remove star directives here so infinite loops are avoided.
            setAttribute(currentNode, directive[0]);

            // Applying the directive may automatically append elements after the anchor.
            directive[1](controller, anchor, currentNode, directive[2], directive[0]);

            return 1;
        }
    }
};
