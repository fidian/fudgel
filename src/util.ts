export const Obj = Object;

export const stringify = (x: any) => JSON.stringify(x);

export const memoize = <FN extends (arg: any) => any>(fn: FN) => {
    const cache = new Map<Parameters<FN>[0], ReturnType<FN>>();

    return (arg: Parameters<FN>[0]) => {
        if (cache.has(arg)) {
            return cache.get(arg);
        }

        const out = fn(arg);
        cache.set(arg, out);

        return out;
    };
};

// Memoizing reduces repeats by a factor of ~200.
export const dashToCamel = (dashed: string) => {
    return dashed.replace(/-(\p{Ll})/gu, match => match[1].toUpperCase());
};

export const camelToDash = (camel: string) => {
    return camel.replace(/\p{Lu}/gu, match => `-${match[0]}`.toLowerCase());
};

export const pascalToDash = (pascal: string) => {
    return camelToDash(
        pascal.replace(/^\p{Lu}/gu, match => match.toLowerCase())
    );
};

export const toString = <T>(value: T) => `${value ?? ''}`;

export const isString = (x: any) => typeof x === 'string';

export const getAttribute = (node: Element | HTMLElement, name: string) =>
    node.getAttribute(name);

export const hasOwn = (obj: Object, prop: string | symbol) =>
    Obj.hasOwn(obj, prop);

export const setAttribute = (
    node: HTMLElement,
    name: string,
    value?: string | boolean | null
) => {
    if (value === true) {
        value = '';
    }

    if (isString(value)) {
        node.setAttribute(name, value as string);
    } else {
        node.removeAttribute(name);
    }
};

export const uniqueListJoin = (a: string[], b: string[]) => [
    ...new Set([...a, ...b]),
];

export const appendChild = (parent: Node, child: Node) =>
    parent.appendChild(child);

// Return the entries of an Iterable or fall back on Object.entries for
// normal objects and arrays.
export const entries = (iterable: any) =>
    iterable.entries?.() ?? Obj.entries(iterable);

export const nextTick: (cb: VoidFunction) => void = queueMicrotask;
