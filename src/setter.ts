import { metadataPatchedSetter } from './metadata.js';

export type SetterCallback<T extends Object> = (thisRef: T, newValue: any, oldValue: any) => void;
export interface TrackedSetters<T extends Object> {
    [key: string]: SetterCallback<T>[];
}

export const patchSetter = <T extends Object>(
    obj: T,
    property: string,
    callback: SetterCallback<T>
) => {
    const trackingObject = metadataPatchedSetter(obj, {});
    let callbacks = trackingObject[property] as SetterCallback<T>[];

    if (!callbacks) {
        let value: any = (obj as any)[property];
        const desc = Object.getOwnPropertyDescriptor(obj, property) || {};
        callbacks = [];
        (trackingObject as any)[property] = callbacks;
        Object.defineProperty(obj, property, {
            get: desc.get || (() => value),
            set: function (newValue: any) {
                const oldValue = value;

                if (!Object.is(newValue, oldValue)) {
                    desc.set?.(newValue);
                    value = newValue;

                    for (const cb of callbacks) {
                        cb(this, newValue, oldValue);
                    }
                }
            },
        });
    };

    callbacks.push(callback);
};

