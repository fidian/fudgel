import { addBindings } from '../bindings';
import { Controller } from '../controller';
import { GeneralDirective } from './types';
import { getScope } from '../scope';
import { parseText } from '../parse';
import { setAttribute } from '../util';

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
