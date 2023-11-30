import { addBindings } from '../bindings';
import { Controller } from '../controller';
import { createValueFunction, dashToCamel, setAttribute } from '../util';
import { GeneralDirective } from './index';
import { findBindings } from '../parse';
import { getScope } from '../scope';

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
