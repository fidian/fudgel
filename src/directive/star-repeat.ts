import { addBindings } from '../bindings';
import { childScope, getScope } from '../scope';
import { Controller } from '../controller';
import { createValueFunction } from '../util';
import { findBindings } from '../parse';
import { hooksOff } from '../hooks';
import { linkElementNode } from '../link-element-node';
import { linkNodes } from '../link-nodes';
import { StructuralDirective } from './index';

export const starRepeatDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    node: HTMLElement,
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
        const processQueue: [Node, Node][] = [];

        while (activeNodes.length > desired) {
            const target = activeNodes.pop()!;
            hooksOff(target);
            target.remove();
        }

        let lastIndex = activeNodes.length + 1;
        let lastNode = activeNodes[lastIndex - 1] || anchor;

        while (activeNodes.length < desired) {
            let copy = node.cloneNode(true) as HTMLElement;
            const scope = childScope(anchorScope, copy);
            scope[scopeName] = lastIndex++;
            linkElementNode(thisRef, lastNode, false, copy, processQueue);
            activeNodes.push(copy);
            lastNode = copy;
        }

        linkNodes(processQueue, thisRef);
    };
    addBindings(controller, anchor, update, findBindings(attrValue));
    update(controller);
};
