import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parseTextAllowBoolean } from '../parse.js';
import { setAttribute } from '../util.js';

export const attributeDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const result = parseTextAllowBoolean(attrValue);

    if (result) {
        const scope = getScope(node);
        const update = (thisRef: Controller) => {
            setAttribute(
                node,
                attrName,
                result[0]([scope, thisRef])
            );
        };
        addBindings(controller, node, update, result[1], scope);
        update(controller);
    }
};
