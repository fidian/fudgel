import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { iterate, setAttribute } from '../util.js';
import { parse } from '../jsep.js';
import { toggleClass } from '../elements.js';

export const hashClassDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const parsed = parse(attrValue);
    const scope = getScope(node);
    // value can be undefined, but in this context it should be forced to be a
    // boolean. An undefined value here means to remove the class.
    const update = (thisRef: Controller) =>
        iterate(parsed[0]([scope, thisRef]), (value, key) =>
            toggleClass(node, key, !!value)
        );
    addBindings(controller, node, update, parsed[1], scope);
    update(controller);
    setAttribute(node, attrName);
};
