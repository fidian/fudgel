import { addBindings } from '../bindings';
import { Controller } from '../controller';
import { GeneralDirective } from './index';
import { getScope } from '../scope';
import { parseText } from '../parse';

export const attributeDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const result = parseText(attrValue, true);

    if (result) {
        const update = (thisRef: Controller) => {
            const value = result.fn.call(thisRef, getScope(node));

            if (
                typeof value === 'boolean' ||
                value === undefined ||
                value === null
            ) {
                value
                    ? node.setAttribute(attrName, '')
                    : node.removeAttribute(attrName);
            } else {
                node.setAttribute(attrName, `${value}`);
            }
        };
        addBindings(controller, node, update, result.binds);
        update(controller);
    }
};
