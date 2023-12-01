import { addBindings } from '../bindings';
import { childScope, getScope } from '../scope';
import { Controller } from '../controller';
import { createValueFunction } from '../util';
import { findBindings } from '../parse';
import { hooksOff } from '../hooks';
import { linkNodesWrapped } from '../link-nodes';
import { StructuralDirective } from './index';

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
        const entries = () =>
            iterable.entries ? iterable.entries() : Object.entries(iterable);
        const removedNodes = new Map(oldNodes);

        for (const [key] of entries()) {
            removedNodes.delete(key);
        }

        for (const removeNode of removedNodes.values()) {
            hooksOff(removeNode);
            removeNode.remove();
            oldNodes.delete(removeNode);
        }

        for (const [key, value] of entries()) {
            let copy = oldNodes.get(key);
            oldNodes.delete(key);

            if (copy !== lastNode.nextSibling) {
                if (copy) {
                    hooksOff(copy);
                    copy.remove();
                }

                copy = source.cloneNode(true) as HTMLElement;
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
