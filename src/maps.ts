export interface WeakMapWithDefault<K extends WeakKey, V extends NonNullable<any>> {
    (key: K): V;
    (key: K, value: V): unknown;
}

export const makeWeakMapWithDefault = <K extends WeakKey, V>(
    defaultValueFactory: () => V
) => {
    const map = new WeakMap<K, V>();
    const fn = (key: K, value?: V) =>
        (value ? map.set(key, value) : map).get(key) ||
        map.set(key, defaultValueFactory()).get(key)!;
    return fn as WeakMapWithDefault<K, V>;
};
