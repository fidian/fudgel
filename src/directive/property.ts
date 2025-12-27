import { addBindings } from '../bindings.js';
import { Controller } from '../controller-types.js';
import { dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parse } from '../parse.js';

export const propertyDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const parsed = parse.js(attrValue);
    const prop = dashToCamel(attrName.slice(1));
    const scope = getScope(node);
    const update = () => {
        const value = parsed[0](scope, controller);
        (node as any)[prop] = value;
    };
    addBindings(controller, node, update, parsed[1], scope);
    update();
    setAttribute(node, attrName);
};
