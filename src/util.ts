export const isCustomElement = (node: Node) => node.nodeName.indexOf('-') >= 0;

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

export const createFunction = memoize((args: string, code: string) => new Function(args, code));

export const createValueFunction = (code: string) => createFunction('$scope', `return ${code}`);

export const dashToCamel = (dashed: string) => {
    return dashed.replace(/-\p{Ll}/gu, match => match[1].toUpperCase());
};

export const camelToDash = (dashed: string) => {
    return dashed.replace(/\p{Lu}/gu, match => `-${match[1]}`.toLowerCase());
};

export const toString = <T>(value: T) =>
    isEmptyValue(value) ? '' : `${value}`;

export const isEmptyValue = <T>(value: T) =>
    value === null || value === undefined;

export const removeAttribute = (node: HTMLElement, name: string) =>
    node.attributes.removeNamedItem(name);

export const getPrototypeOf = (x: Object) => Object.getPrototypeOf(x);