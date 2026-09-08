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
    let trackValue: string | undefined;
    // [key,] value of iterable [track expression]
    const matches = attrValue.match(
        /^\s*(?:(?:(\S+)\s*,\s*)?(\S+)\s+of\s+)?(.+?)(?:\s+track\s+(.+?))?\s*$/
    );

    if (matches) {
        keyName = matches[1] || keyName;
        valueName = matches[2] || valueName;
        attrValue = matches[3];
        trackValue = matches[4];
    }

    const parsed = parse.js(attrValue);
    // What identifies an item: the track expression, evaluated with the
    // loop variables in scope, or else the iteration key.
    const track = trackValue && parse.js(trackValue);
    const anchorScope = getScope(anchor);
    let activeNodes = new Map<any, HTMLElement>();
    const update = () => {
        const iterable = parsed[0](anchorScope, controller) || [];
        let oldNodes = activeNodes;
        activeNodes = new Map();
        let lastNode: HTMLElement | Comment = anchor;

        for (const [key, value] of entries(iterable)) {
            const id = track
                ? track[0](
                      { [keyName]: key, [valueName]: value },
                      anchorScope,
                      controller
                  )
                : key;
            let copy = oldNodes.get(id);
            oldNodes.delete(id);

            if (copy) {
                // Keep the node, and with it whatever state it holds. Update
                // the scope, which triggers its bindings, and move it only
                // if it is out of place.
                const scope = getScope(copy);
                scope[keyName] = key;
                scope[valueName] = value;

                if (copy !== lastNode.nextSibling) {
                    lastNode.after(copy);
                }
            } else {
                // Create a new node and set its scope
                copy = cloneNode(source);
                const scope = childScope(anchorScope, copy);
                scope[keyName] = key;
                scope[valueName] = value;
                link(controller, copy);
                lastNode.after(copy);
            }

            lastNode = copy;
            activeNodes.set(id, copy);
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
