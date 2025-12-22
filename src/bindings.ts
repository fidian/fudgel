import { Controller } from './controller-types.js';
import { hookOn, hookWhenSet } from './hooks.js';
import { GlobalScope, Scope } from './scope.js';
import { Obj, hasOwn } from './util.js';

export const addBindings = (
    controller: Controller,
    node: Node,
    callback: (thisRef: Object) => void,
    bindingList: string[],
    scope: Scope
) => {
    hookOn(controller, node, 'set:', callback);

    for (const binding of bindingList) {
        const target = findBindingTarget(controller, scope, binding);
        hookWhenSet(controller, target, binding);
        hookOn(target, node, `set:${binding}`, x => {
            return callback(x);
        });
    }
};

const findBindingTarget = (
    controller: Controller,
    scope: object,
    binding: string
): object =>
    hasOwn(scope, binding)
        ? scope
        : hasOwn(scope, GlobalScope)
          ? controller
          : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);
