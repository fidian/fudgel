import { Controller } from '../controller';
import { dashToCamel, setAttribute } from '../util';
import { GeneralDirective } from './types';

export const hashRefDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    controller[dashToCamel(attrValue)] = node;
    setAttribute(node, attrName);
};
