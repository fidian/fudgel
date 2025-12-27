import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { cloneNode } from '../elements.js';
import { Controller } from '../controller-types.js';
import { link, unlink } from '../link-unlink.js';
import { parse } from '../parse.js';
import { StructuralDirective } from './types.js';

export const starIfDirective: StructuralDirective = (
    controller: Controller,
    anchor: Comment,
    source: HTMLElement,
    attrValue: string
) => {
    const parsed = parse.js(attrValue);
    const scope = getScope(anchor);
    let activeNode: HTMLElement | null = null;
    const update = () => {
        if (parsed[0](scope, controller)) {
            if (!activeNode) {
                // Add
                activeNode = cloneNode(source);
                childScope(scope, activeNode);
                link(controller, activeNode);
                anchor.after(activeNode);
            }
        } else {
            if (activeNode) {
                // Remove
                unlink(controller, activeNode);
                activeNode.remove();
                activeNode = null;
            }
        }
    };
    addBindings(controller, anchor, update, parsed[1], scope);
    update();
};
