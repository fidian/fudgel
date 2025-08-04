import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { cloneNode } from '../elements.js';
import { Controller } from '../controller.js';
import { hooksOff } from '../hooks.js';
import { entries } from '../util.js';
import { linkNodesWrapped } from '../link-nodes.js';
import { parse } from '../jsep.js';
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

    const parsed = parse(attrValue);
    const anchorScope = getScope(anchor);
    let activeNodes = new Map<any, HTMLElement>();
    const update = (thisRef: Controller) => {
        const iterable = parsed[0]([anchorScope, thisRef]) || [];
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
                    hooksOff(copy);
                    copy.remove();
                }

                // Create a new node and set its scope
                copy = cloneNode(source);
                const scope = childScope(anchorScope, copy);
                (scope as any)[keyName] = key;
                (scope as any)[valueName] = value;
                linkNodesWrapped(copy, thisRef);
                lastNode.after(copy);
            }

            lastNode = copy;
            activeNodes.set(key, lastNode);
        }

        // Clean up any remaining nodes.
        for (const old of oldNodes.values()) {
            hooksOff(old);
            old.remove();
        }
    };
    addBindings(controller, anchor, update, parsed[1], anchorScope);
    update(controller);
};
