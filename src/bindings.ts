import { Controller } from './controller.js';
import { hookOn, hooksRun } from './hooks.js';
import { patchSetter } from './setter.js';
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
            patchSetter(
                scope,
                binding,
                (scopeRef: Scope, newValue, oldValue) => {
                    hooksRun(hookName, scopeRef, controller, newValue, oldValue);
                }
            );
            hookOn(scope, node, hookName, callback);
        } else {
            patchSetter(
                controller,
                binding,
                (thisRef: Controller, newValue, oldValue) => {
                    hooksRun(hookName, thisRef, thisRef, newValue, oldValue);
                    (thisRef as any).onChange && (thisRef as any).onChange(binding, newValue, oldValue);
                }
            );
            hookOn(controller, node, hookName, callback);
        }
    }
}
