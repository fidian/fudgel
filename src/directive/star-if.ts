import { addBindings } from '../bindings';
import { Controller } from '../controller';
import { createValueFunction } from '../util';
import { findBindings } from '../parse';
import { getScope } from '../scope';
import { hooksOff } from '../hooks';
import { linkElementNode } from '../link-element-node';
import { linkNodes } from '../link-nodes';
import { StructuralDirective } from './index';

export const starIfDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    node: HTMLElement,
    attrValue: string
) => {
    const getValue = createValueFunction(attrValue);
    const scope = getScope(anchor);
    let activeNode: HTMLElement | null = null;
    const update = (thisRef: Controller) => {
        if (getValue.call(thisRef, scope)) {
            if (!activeNode) {
                // Add
                const processQueue: [Node, Node][] = [];
                activeNode = node.cloneNode(true) as HTMLElement;
                linkElementNode(thisRef, anchor, false, activeNode, processQueue);
                linkNodes(processQueue, thisRef);
            }
        } else {
            if (activeNode) {
                // Remove
                hooksOff(activeNode);
                activeNode.remove();
                activeNode = null;
            }
        }
    };
    addBindings(controller, anchor, update, findBindings(attrValue));
    update(controller);
};
