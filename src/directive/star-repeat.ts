import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { Controller } from '../controller.js';
import { createValueFunction } from '../util.js';
import { findBindings } from '../parse.js';
import { hooksOff } from '../hooks.js';
import { linkNodesWrapped } from '../link-nodes.js';
import { StructuralDirective } from './types.js';

export const starRepeatDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    source: HTMLElement,
    attrValue: string
) => {
    let scopeName = 'index';
    const matches = attrValue.match(/^(\S+)\s+as\s+(\S+)$/);

    if (matches) {
        attrValue = matches[1];
        scopeName = matches[2];
    }

    const getValue = createValueFunction(attrValue);
    const anchorScope = getScope(anchor);
    let activeNodes: HTMLElement[] = [];
    const update = (thisRef: Controller) => {
        let desired = +getValue.call(thisRef, anchorScope);

        while (activeNodes.length > desired) {
            const target = activeNodes.pop()!;
            hooksOff(target);
            target.remove();
        }

        let lastIndex = activeNodes.length + 1;
        let lastNode = activeNodes[lastIndex - 1] || anchor;

        while (activeNodes.length < desired) {
            let copy = source.cloneNode(true) as HTMLElement;
            const scope = childScope(anchorScope, copy);
            scope[scopeName] = lastIndex++;
            linkNodesWrapped(copy, thisRef);
            activeNodes.push(copy);
            lastNode.after(copy);
            lastNode = copy;
        }
    };
    addBindings(controller, anchor, update, findBindings(attrValue));
    update(controller);
};
