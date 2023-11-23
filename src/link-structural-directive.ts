import { createComment } from './elements';
import { directives, STRUCTURAL_DIRECTIVE_INDEX } from './directive/index';
import { removeAttribute, stringify } from './util';
import { StructuralDirective } from './directive/index';

export const linkStructuralDirective = (
    controller: Object,
    parentNode: Node,
    node: HTMLElement
) => {
    const attrs = node.attributes;

    // Node.ELEMENT_NODE === 1
    if (node.nodeType !== 1 || !attrs) {
        return false;
    }

    let directive: [string, StructuralDirective, string] | undefined;

    for (const [k, v] of Object.entries(
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

    if (!directive) {
        return false;
    }

    const anchor = createComment(`${directive[0]}=${stringify(directive[2])}`);
    parentNode.appendChild(anchor);

    // Remove star directives here so infinite loops are avoided.
    removeAttribute(node, directive[0]);

    // Applying the directive may automatically append elements.
    const copy = node.cloneNode(true) as HTMLElement;
    directive[1](controller, anchor, copy, directive[2], directive[0]);

    return true;
};
