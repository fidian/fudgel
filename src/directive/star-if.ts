import { addBindings } from '../bindings';
import { Controller } from '../controller';
import { createDocumentFragment } from '../elements';
import { createValueFunction } from '../util';
import { findBindings } from '../parse';
import { getScope } from '../scope';
import { hooksOff } from '../hooks';
import { linkNodes } from '../link-nodes';
import { StructuralDirective } from './index';

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
                const fragment = createDocumentFragment();
                fragment.append(activeNode);
                linkNodes(fragment, thisRef);
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
