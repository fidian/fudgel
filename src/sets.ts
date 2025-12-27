export const newSet = <T>(...iterables: Iterable<T>[]): Set<T> =>
    new Set<T>(iterables.flatMap(list => [...list]));
