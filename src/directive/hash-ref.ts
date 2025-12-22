import { Controller } from '../controller-types.js';
import { dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';
import { hookWhenSet } from '../hooks.js';

export const hashRefDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const prop = dashToCamel(attrValue);
    hookWhenSet(controller, controller, prop);
    controller[prop] = node;
    setAttribute(node, attrName);
};
