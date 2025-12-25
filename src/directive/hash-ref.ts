import { Controller } from '../controller-types.js';
import { dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';
import { change } from '../change.js';

export const hashRefDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const prop = dashToCamel(attrValue);
    change(controller, prop, node);
    setAttribute(node, attrName);
};
