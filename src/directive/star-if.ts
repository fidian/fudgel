import { addBindings } from '../bindings';
import { childScope, getScope } from '../scope';
import { Controller } from '../controller';
import { createValueFunction } from '../util';
import { findBindings } from '../parse';
import { hooksOff } from '../hooks';
import { linkNodesWrapped } from '../link-nodes';
import { StructuralDirective } from './types';

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
