import { Controller } from '../controller';
import { createFunction, dashToCamel, setAttribute } from '../util';
import { doc, win } from '../elements';
import { GeneralDirective } from './types';
import { getScope } from '../scope';

export const eventDirective: GeneralDirective = (
    controller: Controller,
    node: HTMLElement,
    attrValue: string,
    attrName: string
) => {
    const [eventName, ...modifiers] = dashToCamel(attrName.slice(1)).split('.');
    const scope = getScope(node);
    const fn = createFunction('s,e', `(($scope,$event)=>{${attrValue}})(s,e)`);
    const options: AddEventListenerOptions = {};
    const modifierSet = new Set(modifiers);
    let eventTarget: Node | Window | Document = node;

    for (const item of [
        'passive',
        'capture',
        'once',
    ] as (keyof AddEventListenerOptions)[]) {
        if (modifierSet.has(item)) {
            (options[item] as any) = true;
        }
    }

    if (modifierSet.has('window')) {
        eventTarget = win;
    }

    if (modifierSet.has('document') || modifierSet.has('outside')) {
        eventTarget = doc;
    }

    eventTarget.addEventListener(
        eventName,
        event => {
            if (modifierSet.has('prevent')) {
                event.preventDefault();
            }

            if (modifierSet.has('stop')) {
                event.stopPropagation();
            }

            const target = event.target as Node;

            if (modifierSet.has('self') && target !== node) {
                return;
            }

            if (modifierSet.has('outside') && node.contains(target)) {
                return;
            }

            fn.call(controller, scope, event);
        },
        options
    );
    setAttribute(node, attrName);
};
