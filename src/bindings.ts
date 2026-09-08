import { Controller } from './controller-types.js';
import { Scope } from './scope.js';
import { Obj, hasOwn } from './util.js';
import { win } from './elements.js';
import { patchSetter } from './setter.js';
import { metadata } from './symbols.js';

// Run `cleanup` once, when a directive removes `node` or the controller is
// destroyed, and drop the listeners that were waiting for that moment.
export const whenRemoved = (
    controller: Controller,
    node: Node,
    cleanup: VoidFunction
) => {
    const events = controller[metadata]?.events;
    const done = () => {
        cleanup();

        for (const remover of removers) {
            remover?.();
        }
    };
    const removers = [
        events?.on('unlink', (removedNode: Node) => {
            if (removedNode.contains(node)) {
                done();
            }
        }),
        events?.on('destroy', done),
    ];
};

export const addBindings = (
    controller: Controller,
    node: Node,
    callback: (thisRef: Object) => void,
    bindingList: Iterable<string>,
    scope: Scope
) => {
    for (const binding of bindingList) {
        const target = findBindingTarget(controller, scope, binding);

        // A name that is neither in scope nor on the controller but is a
        // global, such as Math or Date, means the global. Watching it on the
        // controller would define it there and shadow the global with
        // undefined.
        if (!(binding in target) && binding in win) {
            continue;
        }

        const unpatch = patchSetter(target, binding, callback);
        const offUpdate = controller[metadata]?.events.on('update', callback);
        whenRemoved(controller, node, () => {
            unpatch();
            offUpdate?.();
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
        : hasOwn(scope, metadata)
          ? controller
          : findBindingTarget(controller, Obj.getPrototypeOf(scope), binding);
