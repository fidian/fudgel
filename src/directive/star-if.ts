import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { Controller } from '../controller.js';
import { createValueFunction } from '../util.js';
import { findBindings } from '../parse.js';
import { hooksOff } from '../hooks.js';
import { linkNodesWrapped } from '../link-nodes.js';
import { StructuralDirective } from './types.js';

export const starIfDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    source: HTMLElement,
    attrValue: string
) => {
    const getValue = createValueFunction(attrValue);
    const scope = getScope(anchor);
    let activeNode: HTMLElement | null = null;
    const update = (thisRef: Controller) => {
        if (getValue.call(thisRef, scope)) {
            if (!activeNode) {
                // Add
                activeNode = source.cloneNode(true) as HTMLElement;
                childScope(scope, activeNode);
                linkNodesWrapped(activeNode, thisRef);
                anchor.after(activeNode);
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
