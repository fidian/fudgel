import { addBindings } from '../bindings.js';
import { Controller } from '../controller-types.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parse } from '../parse.js';
import { setAttribute } from '../util.js';

export const attributeDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const result = parse.attr(attrValue);

    if (result) {
        const scope = getScope(node);
        const update = () => {
            setAttribute(
                node,
                attrName,
                result[0](scope, controller)
            );
        };
        addBindings(controller, node, update, result[1], scope);
        update();
    }
};
