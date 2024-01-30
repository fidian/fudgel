/**
 * Prototype hooks are hooks that will be added in the future after an instance
 * of the class is created. They can't be added yet because the controller
 * class has not yet been instantiated.
 *
 * These are important for decorators because they only have access to the
 * class prototype and are not applied during instantiation.
 */
import { Controller } from './controller.js';
import { getPrototypeOf } from './util.js';
import { HookCallback } from './hooks.js';
import { metadataPrototypeHooks } from './metadata.js';

export const findPrototypeHooks = (controller: Controller) => {
    let proto = controller.constructor.prototype

    while (proto) {
        for (const protoHook of metadataPrototypeHooks(proto) || []) {
            protoHook(controller);
        }

        proto = getPrototypeOf(proto);
    }
};

/**
 * For ease, allow people to pass the constructor or the constructor's prototype.
 */
export const prototypeHook = (proto: Object, cb: HookCallback) => {
    if (typeof proto === 'function') {
        proto = proto.prototype;
    }

    metadataPrototypeHooks(proto, []).push(cb);
};
