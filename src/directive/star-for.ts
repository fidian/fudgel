import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { cloneNode } from '../elements.js';
import { Controller } from '../controller.js';
import { createValueFunction, entries } from '../util.js';
import { findBindings } from '../parse.js';
import { hooksOff } from '../hooks.js';
import { linkNodesWrapped } from '../link-nodes.js';
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

    const getValue = createValueFunction(attrValue);
    const anchorScope = getScope(anchor);
    let activeNodes = new Map<any, HTMLElement>();
    const update = (thisRef: Controller) => {
        const iterable = getValue.call(thisRef, anchorScope) || [];
        let oldNodes = activeNodes;
        activeNodes = new Map();
        let lastNode: HTMLElement | Comment = anchor;
        const removedNodes = new Map(oldNodes);

        for (const [key] of entries(iterable)) {
            removedNodes.delete(key);
        }

        for (const removeNode of removedNodes.values()) {
            hooksOff(removeNode);
            removeNode.remove();
            oldNodes.delete(removeNode);
        }

        for (const [key, value] of entries(iterable)) {
            let copy = oldNodes.get(key);
            oldNodes.delete(key);

            if (copy !== lastNode.nextSibling) {
                if (copy) {
                    hooksOff(copy);
                    copy.remove();
                }

                copy = cloneNode(source);
                const scope = childScope(anchorScope, copy);
                (scope as any)[keyName] = key;
                (scope as any)[valueName] = value;
                linkNodesWrapped(copy, thisRef);
                lastNode.after(copy);
            } else {
                const scope = childScope(anchorScope, copy);
                (scope as any)[valueName] = value;
            }

            lastNode = copy;
            activeNodes.set(key, lastNode);
        }

        for (const old of oldNodes.values()) {
            hooksOff(old);
            old.remove();
        }
    };
    addBindings(controller, anchor, update, findBindings(attrValue));
    update(controller);
};
