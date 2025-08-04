/**
 * Hooks provide a way to add extra functionality to specific locations without
 * maintaining separate lists in each area. The hooks are associated with a
 * Node and a controller. The Nodes are used to remove unnecessary callbacks
 * when each Node is removed. The controller is used to track which collection
 * of hooks to run (regardless of Node) and is used to signal when hooks should
 * run.
 */
import { Controller } from './controller.js';
import { iterate } from './util.js';
import { makeMap } from './metadata.js';
import { patchSetter } from './setter.js';
import { Scope } from './scope.js';

export type HookCallback = (...args: any[]) => void;

// Hooks that are applied to every object
const globalHooks: Record<string, HookCallback[]> = {};

// This is only exported for tests
export const hooksForWatchedObj = makeMap<
    Object,
    { [key: string]: HookCallback[] }
>();
const hooksRemoversForNode = makeMap<Object, (() => void)[]>();
const metadataHookOnSet = makeMap<Controller | Scope, Record<string, number>>();

// Known hooks and their arguments
//
// component - component is being defined
//   target: CustomElement class
//   args: CustomElement class, customElementConfig
// set: - flag all internal properties as stale
//   target: controller instance
//   args: controller
// set:PROP_NAME - internal property changed
//   target: controller instance or scope object
//   args: controller
export const hooksRun = (name: string, target: Object, ...args: any[]) => {
    hooksRunInternal(globalHooks, name, ...args);
    hooksRunInternal(hooksForWatchedObj(target) || {}, name, ...args);
};

const hooksRunInternal = (
    hooks: Record<string, HookCallback[]>,
    name: string,
    ...args: any[]
) => {
    iterate(
        hooks[name],
        hook =>
            // A hook that is slated to be executed (a future callback that will be
            // ran soon) could be removed during execution of hooks. In this
            // situation, we want to make sure the removed hooks are not called
            // even if they were in the original list.
            hooks[name].includes(hook) && hook(...args)
    );
};

/**
 * Remove all hooks from a node. First, get the controller because hooks are
 * only added to controllers and scopes. Removing hooks from the controller
 * should allow scopes to be garbage collected and their hooks won't need
 * manual cleanup.
 */
export const hooksOff = (node: Node) => {
    const queue = [node];
    let target;

    while ((target = queue.shift())) {
        iterate(hooksRemoversForNode(target), remover => remover());

        iterate(target.childNodes, node => queue.push(node));
    }
};

/**
 * When a hook fires on the target that matches the name, also call this callback.
 *
 * Hooks are placed on controllers and scopes. They will update the affected node somehow.
 */
export const hookOn = (
    watchedObj: Object,
    affectedNode: Node,
    name: string,
    cb: HookCallback
) => {
    const hooks =
        hooksForWatchedObj(watchedObj) || hooksForWatchedObj(watchedObj, {});

    if (!hooks[name]) {
        hooks[name] = [cb];
    } else {
        hooks[name].push(cb);
    }

    const remove =
        hooksRemoversForNode(affectedNode) ||
        hooksRemoversForNode(affectedNode, []);
    remove.push(() => {
        const hookCollection = hooksForWatchedObj(watchedObj);

        if (hookCollection?.[name]) {
            hookCollection[name] = hookCollection[name].filter(
                callback => callback !== cb
            );
        }
    });
};

export const hookOnGlobal = (name: string, cb: HookCallback) => {
    const hooks = globalHooks[name] || (globalHooks[name] = []);
    hooks.push(cb);

    return () => {
        globalHooks[name] = globalHooks[name].filter(
            callback => callback !== cb
        );
    };
};

/**
 * Set up a hook to be called automatically when a property changes.
 *     controller - the base controller
 *     obj - the object containing the property to monitor
 *     property - the property name
 *
 * Patches obj[property] to have a setter that calls hooks when it changes.
 * Only applies the patch once.
 */
export const hookWhenSet = (
    controller: Controller,
    obj: Scope | Controller,
    property: string
) => {
    const trackingObject = metadataHookOnSet(obj, {});

    if (!trackingObject[property]) {
        trackingObject[property] = 1;
        patchSetter(
            obj,
            property,
            (thisRef: Controller | Scope, newValue, oldValue) => {
                hooksRun(
                    `set:${property}`,
                    thisRef,
                    controller,
                    thisRef,
                    newValue,
                    oldValue
                );
            }
        );
    }
};
