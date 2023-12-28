export const entries = (iterable: any) =>
    iterable.entries ? iterable.entries() : Object.entries(iterable);
export const stringify = (x: any) => JSON.stringify(x);

export const memoize = <T extends (...args: any[]) => any>(fn: T) => {
    const cache: {
        [key: string]: ReturnType<T>;
    } = {};

    return (...args: Parameters<T>) => {
        const key = stringify(args);

        return cache[key] || (cache[key] = fn(...args));
    };
};

export const createFunction = memoize(
    (args: string, code: string) => new Function(args, code)
);

export const createValueFunction = (code: string) =>
    createFunction('$scope', `return ${code}`);

export const dashToCamel = (dashed: string) => {
    return dashed.replace(/-(\p{Ll})/gu, match => match[1].toUpperCase());
};

export const camelToDash = (dashed: string) => {
    return dashed.replace(/\p{Lu}/gu, match => `-${match[0]}`.toLowerCase());
};

export const toString = <T>(value: T) =>
    value === null || value === undefined ? '' : `${value}`;

export const isString = (x: any) => typeof x === 'string';

export const getAttribute = (
    node: HTMLElement,
    name: string
) => node.getAttribute(name);

export const setAttribute = (
    node: HTMLElement,
    name: string,
    value?: string | boolean | null
) => {
    if (value === true) {
        value = '';
    }

    if (typeof value === 'string') {
        node.setAttribute(name, value);
    } else {
        node.removeAttribute(name);
    }
};

export const getPrototypeOf = (x: Object) => Object.getPrototypeOf(x);
