import { Controller } from '../controller.js';
import { dashToCamel, setAttribute } from '../util.js';
import { GeneralDirective } from './types.js';

export const hashRefDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    controller[dashToCamel(attrValue)] = node;
    setAttribute(node, attrName);
};
