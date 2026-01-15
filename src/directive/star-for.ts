import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { cloneNode, createDocumentFragment } from '../elements.js';
import { Controller } from '../controller-types.js';
import { entries } from '../util.js';
import { link, unlink } from '../link-unlink.js';
import { parse } from '../parse.js';
import { StructuralDirective } from './types.js';

export const starForDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    source: HTMLElement,
    attrValue: string
) => {
    let keyName = 'key';
    let valueName = 'value';
    const matches = attrValue.match(
        /^\s*(?:(?:(\S+)\s*,\s*)?(\S+)\s+of\s+)?(\S+)\s*$/
    );

    if (matches) {
        keyName = matches[1] || keyName;
        valueName = matches[2] || valueName;
        attrValue = matches[3];
    }

    const parsed = parse.js(attrValue);
    const anchorScope = getScope(anchor);
    let activeNodes = new Map<any, HTMLElement>();
    const update = () => {
        const iterable = parsed[0](anchorScope, controller) || [];
        let oldNodes = activeNodes;
        activeNodes = new Map();
        let lastNode: HTMLElement | Comment = anchor;

        // Attempt to reuse nodes based on the key of the iterable
        for (const [key, value] of entries(iterable)) {
            // Attempt to find the old node
            let copy = oldNodes.get(key);
            oldNodes.delete(key);

            if (copy === lastNode.nextSibling) {
                // Next node is in the right position. Update the value in
                // scope, which should trigger bindings.
                const scope = getScope(copy);
                (scope as any)[valueName] = value;
            } else {
                // Delete the old node if it exists
                if (copy) {
                    unlink(controller, copy);
                    copy.remove();
                }

                // Create a new node and set its scope
                copy = cloneNode(source);
                const scope = childScope(anchorScope, copy);
                (scope as any)[keyName] = key;
                (scope as any)[valueName] = value;
                link(controller, copy);
                lastNode.after(copy);
            }

            lastNode = copy;
            activeNodes.set(key, lastNode);
        }

        // Clean up any remaining nodes. It's faster to call `unlink()` once,
        // so collect all nodes into a document fragment and flag that fragment
        // for unlinking. The act of moving the nodes into the fragment will
        // remove them from the DOM.
        const fragment = createDocumentFragment();

        for (const old of oldNodes.values()) {
            fragment.appendChild(old);
        }

        unlink(controller, fragment);
    };
    addBindings(controller, anchor, update, parsed[1], anchorScope);
    update();
};
