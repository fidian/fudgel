import { addBindings } from '../bindings.js';
import { childScope, getScope } from '../scope.js';
import { cloneNode } from '../elements.js';
import { Controller } from '../controller-types.js';
import { link, unlink } from '../link-unlink.js';
import { parse } from '../parse.js';
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

    const parsed = parse.js(attrValue);
    const anchorScope = getScope(anchor);
    let activeNodes: HTMLElement[] = [];
    const update = () => {
        let desired = +parsed[0](anchorScope, controller);

        while (activeNodes.length > desired) {
            const target = activeNodes.pop()!;
            unlink(controller, target);
            target.remove();
        }

        let lastIndex = activeNodes.length + 1;
        let lastNode = activeNodes[lastIndex - 1] || anchor;

        while (activeNodes.length < desired) {
            let copy = cloneNode(source);
            const scope = childScope(anchorScope, copy);
            scope[scopeName] = lastIndex++;
            link(controller, copy);
            activeNodes.push(copy);
            lastNode.after(copy);
            lastNode = copy;
        }
    };
    addBindings(controller, anchor, update, parsed[1], anchorScope);
    update();
};
