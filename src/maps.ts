export interface ShorthandWeakMap<K extends WeakKey, V extends NonNullable<any>> {
    (key: K): V | undefined;
    (key: K, value: V): V;
}

export const shorthandWeakMap = <K extends WeakKey, V>() => {
    const map = new WeakMap<K, V>();
    const fn = (key: K, value?: V) =>
        (value ? map.set(key, value) : map).get(key);

    return fn as ShorthandWeakMap<K, V>;
};
