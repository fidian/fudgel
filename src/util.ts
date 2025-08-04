import { Controller } from './controller.js';
import { metadataControllerElement } from './metadata.js';

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

export const getPrototypeOf = (x: Object) => Object.getPrototypeOf(x);

export const rootElement = (controller: Controller) => {
    const element = metadataControllerElement.get(controller);

    return element?.shadowRoot ?? element ?? null;
};

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

export const entries = (iterable: any) =>
    iterable.entries ? iterable.entries() : Object.entries(iterable);

// Iterate over anything. Objects, arrays, query selector results, iterables, etc.
// Because the array can change during iteration, a copy is made.
export const iterate = (over: any, cb: (value: any, key: any) => void) => {
    for (const [k, v] of [...entries(over ?? [])]) cb(v, k);
};
