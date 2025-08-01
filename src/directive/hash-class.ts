import { addBindings } from '../bindings.js';
import { Controller } from '../controller.js';
import { GeneralDirective } from './types.js';
import { getScope } from '../scope.js';
import { parse } from '../jsep.js';
import { setAttribute } from '../util.js';
import { toggleClass } from '../elements.js';

export const hashClassDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const parsed = parse(attrValue);
    const scope = getScope(node);
    const update = (thisRef: Controller) => {
        for (const [key, value] of Object.entries(parsed[0]([scope, thisRef]))) {
            // value can be undefined, but in this context it should be forced
            // to be a boolean. An undefined value here means to remove the
            // class.
            toggleClass(node, key, !!value);
        }
    };
    addBindings(controller, node, update, parsed[1], scope);
    update(controller);
    setAttribute(node, attrName);
};
