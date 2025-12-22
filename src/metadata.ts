import { Controller } from './controller-types.js';
import { MutationObserverInfo } from './when-parsed.js';
import { SlotInfo } from './slot.js';
import { TrackedSetters } from './setter.js';

export interface MetadataMap<K extends WeakKey, V> {
    (key: K): V | undefined;
    (key: K, value: V): NonNullable<V>;
}

export const makeMap = <K extends WeakKey, V>() => {
    const map = new WeakMap<K, V>();
    const fn = (key: K, value?: V) =>
        (value ? map.set(key, value) : map).get(key);

    return fn as MetadataMap<K, V>;
};

export const metadataElementController = makeMap<HTMLElement, Controller>();
export const elementToController = (element: HTMLElement) =>
    metadataElementController(element);
export const metadataElementSlotContent = makeMap<
    ShadowRoot | HTMLElement,
    SlotInfo
>();
export const metadataMutationObserver = makeMap<Node, MutationObserverInfo>();
export const metadataPatchedSetter = makeMap<Object, TrackedSetters<Object>>();
export const metadataScope = makeMap<Node, Object>();
