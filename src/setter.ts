import { entries, Obj } from './util.js';
import { shorthandWeakMap } from './maps.js'

export type SetterCallback = (newValue: any, oldValue: any) => void;
export interface TrackedSetters<> {
    [key: string]: SetterCallback[];
}

const patchedSetters = shorthandWeakMap<Object, TrackedSetters>();

export const removeSetters = <T extends Object>(
    obj: T
) => {
    for (const [_, callbacks] of entries(patchedSetters(obj) || {})) {
        callbacks.length = 0;
    }
}

export const patchSetter = <T extends Object>(
    obj: T,
    property: string,
    callback: SetterCallback
) => {
    const trackingObject = patchedSetters(obj) || patchedSetters(obj, {});
    let callbacks = trackingObject[property];

    if (!callbacks) {
        let value: any = (obj as any)[property];
        const desc = Obj.getOwnPropertyDescriptor(obj, property) || {};
        callbacks = [];
        (trackingObject as any)[property] = callbacks;
        Obj.defineProperty(obj, property, {
            get: desc.get || (() => value),
            set: function (newValue: any) {
                const oldValue = value;

                // Distinguish between different NaN values or +0 and -0.
                if (!Obj.is(newValue, oldValue)) {
                    desc.set?.(newValue);
                    value = newValue;

                    for (const cb of callbacks) {
                        cb(newValue, oldValue);
                    }
                }
            },
        });
    };

    callbacks.push(callback);
};

