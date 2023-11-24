/**
 * Hooks provide a way to add extra functionality to specific locations without
 * maintaining separate lists in each area. The hooks are associated with a
 * Node and a controller. The Nodes are used to remove unnecessary callbacks
 * when each Node is removed. The controller is used to track which collection
 * of hooks to run (regardless of Node).
 */
import { Controller } from './controller';
import { metadataControllerHooks, metadataHookRemove } from './metadata';

export type HookCallback = (...args: any[]) => void;

// Known hooks and their arguments
// attr:PROP_NAME
//   controller, oldValue, newValue - attribute on element changed
// init
//   controller - during controller initialization after DOM is ready
// set:
//   controller - flag all internal properties as stale
// set:PROP_NAME
//   controller, oldValue, newValue - internal property changed
export const hooksRun = (name: string, controller: Controller, ...args: any[]) => {
    const hooks = metadataControllerHooks(controller)

    if (hooks) {
        // Make a copy of the array in case some hooks remove themselves.
        for (const hook of [...(hooks[name] || [])]) {
            hook(controller, ...args);
        }
    }
};

export const hooksOff = (node: Node) => {
    const queue = [node];
    let target;

    while ((target = queue.shift())) {
        for (const remover of metadataHookRemove(target, [])) {
            remover();
        }

        for (const node of target.childNodes) {
            queue.push(node);
        }
    }
};

export const hookOn = (
    controller: Controller,
    node: Node,
    name: string,
    cb: HookCallback
) => {
    const hooks =
        metadataControllerHooks(controller, {})

    if (!hooks[name]) {
        hooks[name] = [cb];
    } else {
        hooks[name].push(cb);
    }

    const remove =
        metadataHookRemove(node, []);
    remove.push(() => {
        const hookCollection = metadataControllerHooks(controller);

        if (hookCollection && hookCollection[name]) {
            hookCollection[name] = hookCollection[name].filter(callback => callback !== cb);
        }
    });
};