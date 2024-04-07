/**
 * Hooks provide a way to add extra functionality to specific locations without
 * maintaining separate lists in each area. The hooks are associated with a
 * Node and a controller. The Nodes are used to remove unnecessary callbacks
 * when each Node is removed. The controller is used to track which collection
 * of hooks to run (regardless of Node).
 */
import { makeMap } from './metadata.js';

export type HookCallback = (...args: any[]) => void;

// Hooks that are applied to every object
const globalHooks: Record<string, HookCallback[]> = {};

const hooksForTarget = makeMap<Object, { [key: string]: HookCallback[] }>();
const hooksRemove = makeMap<Object, (() => void)[]>();

// Known hooks and their arguments
// attr:PROP_NAME
//   controller, oldValue, newValue - attribute on element changed
// component
//   customElement, customElementConfig - component is being defined
// init
//   controller - during controller initialization after DOM is ready
// set:
//   controller - flag all internal properties as stale
// set:PROP_NAME
//   controller, oldValue, newValue - internal property changed
export const hooksRun = (name: string, target: Object, ...args: any[]) => {
    hooksRunInternal(globalHooks, name, target, ...args);
    hooksRunInternal(hooksForTarget(target) || {}, name, ...args);
}

const hooksRunInternal = (hooks: Record<string, HookCallback[]>, name: string, ...args: any[]) => {
    for (const hook of (hooks[name] || [])) {
        // A hook can be removed during execution of hooks, and the
        // `hooks[name]` array will be recreated. In this situation, we
        // want to make sure the removed hooks are not called even if they
        // were in the original list.
        if (hooks[name].includes(hook)) {
            hook(...args);
        }
    }
};

export const hooksOff = (node: Node) => {
    const queue = [node];
    let target;

    while ((target = queue.shift())) {
        for (const remover of hooksRemove(target, [])) {
            remover();
        }

        for (const node of target.childNodes) {
            queue.push(node);
        }
    }
};

export const hookOn = (
    target: Object,
    node: Node,
    name: string,
    cb: HookCallback
) => {
    const hooks = hooksForTarget(target, {})

    if (!hooks[name]) {
        hooks[name] = [cb];
    } else {
        hooks[name].push(cb);
    }

    const remove = hooksRemove(node, []);
    remove.push(() => {
        const hookCollection = hooksForTarget(target);

        if (hookCollection && hookCollection[name]) {
            hookCollection[name] = hookCollection[name].filter(callback => callback !== cb);
        }
    });
};

export const hookOnGlobal = (name: string, cb: HookCallback) => {
    const hooks = globalHooks[name] || (globalHooks[name] = []);
    hooks.push(cb);

    return () => {
        globalHooks[name] = globalHooks[name].filter(callback => callback !== cb);
    };
}
