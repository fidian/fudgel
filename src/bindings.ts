import { Controller } from './controller.js';
import { hookOn, hookWhenSet } from './hooks.js';
import { Scope } from './scope.js';

export function addBindings(
    controller: Controller,
    node: Node,
    callback: (thisRef: Object) => void,
    bindingList: string[],
    scope: Scope
) {
    hookOn(controller, node, 'set:', callback);

    for (const binding of bindingList) {
        const target = binding in scope ? scope : controller;
        hookWhenSet(controller, target, binding);
        hookOn(target, node, `set:${binding}`, callback);
    }
}
