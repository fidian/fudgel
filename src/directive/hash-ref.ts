import { Controller } from '../controller';
import { dashToCamel, removeAttribute } from '../util';
import { GeneralDirective } from './index';

export const hashRefDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    controller[dashToCamel(attrValue)] = node;
    removeAttribute(node, attrName);
};
