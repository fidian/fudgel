import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parseText } from '../parse.js';
import { setAttribute } from '../util.js';

export const attributeDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const result = parseText(attrValue);

    if (result) {
        const update = (thisRef: Controller) => {
            const value = result.fn.call(thisRef, getScope(node));
            setAttribute(node, attrName, value);
        };
        addBindings(controller, node, update, result.binds);
        update(controller);
    }
};
