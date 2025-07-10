import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { GeneralDirective } from './types.js';
import { getScope, scopeProxy } from '../scope.js';
import { parse } from '../jsep.js';
import { setAttribute } from '../util.js';
import { toggleClass } from '../elements.js';

export const hashClassDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const parsed = parse(attrValue);
    const scope = getScope(node);
    const update = (thisRef: Controller) => {
        for (const [key, value] of Object.entries(parsed[0](scopeProxy(thisRef, scope)))) {
            toggleClass(node, key, value);
        }
    };
    addBindings(controller, node, update, parsed[1], scope);
    update(controller);
    setAttribute(node, attrName);
};
