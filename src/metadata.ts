import { Constructor } from './constructor.js';
import { Controller } from './controller.js';
import { CustomElement } from './custom-element.js';
import { CustomElementConfigInternal } from './custom-element-config.js';
import { HookCallback } from './hooks.js';
import { TrackedSetters } from './setter.js';

export interface MetadataMap<K extends WeakKey, V> {
    (key: K): V | undefined;
    (key: K, value: V): NonNullable<V>;
}

const makeMap = <K extends WeakKey, V>() => {
    const map = new WeakMap<K, V>();
    const fn = (key: K, value?: V) =>
        map.get(key) || (value && map.set(key, value).get(key)!);

    return fn as MetadataMap<K, V>;
};

export const metadataComponentConfig = makeMap<Object, CustomElementConfigInternal>();
export const metadataComponentController = makeMap<Object, Constructor>();
export const metadataControllerElement = new Map<Controller, CustomElement>();
export const metadataControllerHooks = makeMap<
    Controller,
    { [key: string]: HookCallback[] }
>();
export const metadataElementController = makeMap<HTMLElement, Controller>();
export const metadataHookRemove = makeMap<Node, (() => void)[]>();
export const metadataPatchedSetter = makeMap<Object, TrackedSetters<Object>>();
export const metadataPrototypeHooks = makeMap<Object, HookCallback[]>();
export const metadataScope = makeMap<Node, Object>();
