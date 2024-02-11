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
    const result = parseText(attrValue, true);

    if (result) {
        const update = (thisRef: Controller) => {
            setAttribute(
                node,
                attrName,
                result.fn.call(thisRef, getScope(node))
            );
        };
        addBindings(controller, node, update, result.binds);
        update(controller);
    }
};
