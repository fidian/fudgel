import { Obj } from './util.js';
import { newSet } from './sets.js';
import { shorthandWeakMap } from './maps.js';

export type SetterCallback = (newValue: any, oldValue: any) => void;
export interface TrackedSetters {
    [key: string]: Set<SetterCallback>;
}

const patchedSetters = shorthandWeakMap<Object, TrackedSetters>();

export const removeSetters = <T extends Object>(obj: T) => {
    for (const callbacks of Obj.values(patchedSetters(obj) || {})) {
        callbacks.clear();
    }
};

// Watch assignments to obj[property]. Returns a function that stops watching.
export const patchSetter = <T extends Object>(
    obj: T,
    property: string,
    callback: SetterCallback
): VoidFunction => {
    const trackingObject = patchedSetters(obj) || patchedSetters(obj, {});
    let callbacks = trackingObject[property];

    if (!callbacks) {
        callbacks = trackingObject[property] = newSet();

        // Find the property wherever it is defined so an accessor, on the
        // instance or on the prototype, keeps being an accessor rather than
        // a value copied once at bind time.
        let proto: any = obj;
        let desc: PropertyDescriptor | undefined;

        while (
            proto &&
            !(desc = Obj.getOwnPropertyDescriptor(proto, property))
        ) {
            proto = Obj.getPrototypeOf(proto);
        }

        const get = desc?.get;
        const set = desc?.set;
        let value: any = get ? undefined : (obj as any)[property];
        const read = function (this: any) {
            return get ? get.call(this) : value;
        };

        Obj.defineProperty(obj, property, {
            configurable: true,
            get: read,
            set(newValue: any) {
                const oldValue = read.call(this);

                // Distinguish between different NaN values or +0 and -0.
                if (!Obj.is(newValue, oldValue)) {
                    set ? set.call(this, newValue) : get || (value = newValue);

                    // Walk a copy: a callback may tear down content whose
                    // callbacks are still ahead in the set (skip those) or
                    // build content that adds callbacks (leave those for the
                    // next change; they were just evaluated).
                    for (const cb of [...callbacks]) {
                        callbacks.has(cb) && cb(newValue, oldValue);
                    }
                }
            },
        });
    }

    callbacks.add(callback);

    return () => callbacks.delete(callback);
};
