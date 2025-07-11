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
        const hookName = `set:${binding}`;

        if (binding in scope) {
            hookWhenSet(controller, scope, binding);
            hookOn(scope, node, hookName, callback);
        } else {
            hookWhenSet(controller, controller, binding);
            hookOn(controller, node, hookName, callback);
        }
    }
}
