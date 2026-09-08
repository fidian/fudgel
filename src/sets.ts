// concat rather than flatMap: the library stays within ES2018 so Safari
// 11.1 can parse it, and flatMap arrived in ES2019.
export const newSet = <T>(...iterables: Iterable<T>[]): Set<T> =>
    new Set<T>(([] as T[]).concat(...iterables.map(list => [...list])));
