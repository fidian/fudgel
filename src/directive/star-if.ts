import { addBindings } from '../bindings.js';
import { childScope, getScope, scopeProxy } from '../scope.js';
import { cloneNode } from '../elements.js';
import { Controller } from '../controller.js';
import { hooksOff } from '../hooks.js';
import { linkNodesWrapped } from '../link-nodes.js';
import { parse } from '../jsep.js';
import { StructuralDirective } from './types.js';

export const starIfDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    source: HTMLElement,
    attrValue: string
) => {
    const parsed = parse(attrValue);
    const scope = getScope(anchor);
    let activeNode: HTMLElement | null = null;
    const update = (thisRef: Controller) => {
        if (parsed[0](scopeProxy(thisRef, scope))) {
            if (!activeNode) {
                // Add
                activeNode = cloneNode(source);
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
    addBindings(controller, anchor, update, parsed[1], scope);
    update(controller);
};
