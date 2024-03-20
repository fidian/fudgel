import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';
import { getScope, scopeProxy } from '../scope.js';
import { parse } from '../jsep.js';

export const propertyDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const parsed = parse(attrValue);
    const prop = dashToCamel(attrName.slice(1));
    const scope = getScope(node);
    const update = (thisRef: Controller) => {
        const value = parsed[0](scopeProxy(thisRef, scope));
        (node as any)[prop] = value;
    };
    addBindings(controller, node, update, parsed[1], scope);
    update(controller);
    setAttribute(node, attrName);
};
