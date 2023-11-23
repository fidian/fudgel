import { MetadataMap } from './metadata';

export type TrackingObject = {
    [key: string]: number;
};

export const patchSetter = <T extends Object>(
    map: MetadataMap<T, TrackingObject>,
    obj: T,
    property: string,
    callback: (thisRef: T, newValue: any, oldValue: any) => void
) => {
    const trackingObject = map(obj, {})!;

    if (!trackingObject[property]) {
        trackingObject[property] = 1;
        let value: any = (obj as any)[property];
        const desc = Object.getOwnPropertyDescriptor(obj, property) || {};
        Object.defineProperty(obj, property, {
            get: desc.get || (() => value),
            set: function (newValue: any) {
                const oldValue = value;

                if (newValue !== oldValue) {
                    desc.set ? desc.set(newValue) : (value = newValue);
                    callback(this, newValue, oldValue);
                }
            },
        });
    }
};

