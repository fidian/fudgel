import { Controller } from './controller-types.js';
import { Scope } from './scope.js';
import { Obj, hasOwn } from './util.js';
import { patchSetter } from './setter.js';
import { metadata } from './symbols.js';

export const addBindings = (
    controller: Controller,
    node: Node,
    callback: (thisRef: Object) => void,
    bindingList: Iterable<string>,
    scope: Scope
) => {
    for (const binding of bindingList) {
        const target = findBindingTarget(controller, scope, binding);
        patchSetter(target, binding, callback);
        const onDestroy = () => {
            for (const remover of removers) {
                remover?.();
            }
        };
        const events = controller[metadata]?.events;
        const removers = [
            events?.on('update', callback),
            events?.on('unlink', (removedNode: Node) => {
                if (removedNode.contains(node)) {
                    onDestroy();
                }
            }),
            events?.on('destroy', onDestroy)
        ];
    }
};

const findBindingTarget = (
    controller: Controller,
    scope: object,
    binding: string
): object =>
    hasOwn(scope, binding)
        ? scope
        : hasOwn(scope, metadata)
          ? controller
          : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);
