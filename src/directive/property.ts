import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { createValueFunction, dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';
import { findBindings } from '../parse.js';
import { getScope } from '../scope.js';

export const propertyDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const getValue = createValueFunction(attrValue);
    const prop = dashToCamel(attrName.slice(1));
    const scope = getScope(node);
    const update = (thisRef: Controller) => {
        const value = getValue.call(thisRef, scope);
        (node as any)[prop] = value;
    };
    addBindings(controller, node, update, findBindings(attrValue));
    update(controller);
    setAttribute(node, attrName);
};
