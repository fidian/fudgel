import { Controller } from './controller.js';
import { hookOn, hookWhenSet } from './hooks.js';
import { GlobalScope, Scope } from './scope.js';
import { Obj, hasOwnProperty } from './util.js';

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
    hasOwnProperty(scope, binding)
        ? scope
        : hasOwnProperty(scope, GlobalScope)
          ? controller
          : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);
