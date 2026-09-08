import { createComment } from './elements.js';
import { structuralDirectives } from './directive/index.js';
import { entries, setAttribute, stringify } from './util.js';
import { StructuralDirective } from './directive/types.js';
import { throwError } from './errors.js';

export const linkStructuralDirective = (
    controller: Object,
    treeWalker: TreeWalker,
    currentNode: HTMLElement
): Node | null | void | 1 | 2 => {
    const attrs = currentNode.attributes;

    if (attrs) {
        let directive: [string, StructuralDirective, string] | undefined;

        for (const [k, v] of entries(structuralDirectives)) {
            const attr = attrs.getNamedItem(k);

            if (attr) {
                // Only allow one structural directive on an element
                if (directive) {
                    throwError(`${directive[0]} breaks ${k}`);
                }

                directive = [k, v, attr.nodeValue || ''];
            }
        }

        if (directive) {
            // Create a comment anchor and insert before current node.
            const anchor = createComment(
                `${directive[0]}=${stringify(directive[2])}`
            );
            currentNode.before(anchor);

            // Move tree walker to the anchor, then pull currentNode out of
            // DOM.
            treeWalker.previousNode();
            currentNode.remove();

            // Move tree walker to the next node. Processing the directive will
            // modify the DOM between the anchor and the current tree walker node.
            const next = treeWalker.nextNode();

            // Remove star directives here so infinite loops are avoided.
            setAttribute(currentNode, directive[0]);

            // Applying the directive may automatically append elements after the anchor.
            directive[1](
                controller,
                anchor,
                currentNode,
                directive[2],
                directive[0]
            );

            if (!next) {
                // Nothing followed the anchor, so nothing is left to walk.
                // Stepping back would land inside the clones the directive
                // just linked and walk them a second time, re-reading any
                // braces in the data they rendered as expressions.
                return 2;
            }

            // Move back one node so the next loop will process the node we're
            // currently pointing at.
            treeWalker.previousNode();

            return 1;
        }
    }
};
