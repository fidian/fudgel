export const Obj = Object;

export const stringify = (x: any) => JSON.stringify(x);

// Convert dashed-string to camelCaseString
export const dashToCamel = (dashed: string) =>
    dashed.replace(/-(\p{Ll})/gu, match => match[1].toUpperCase());

// Convert camelCaseString to dashed-string
export const camelToDash = (camel: string) =>
    camel.replace(/\p{Lu}/gu, match => `-${match[0]}`.toLowerCase());

// Convert PascalCaseString to dashed-string, used when removing a leading
// portion of a camel case string, such as "on" from "onClick"
export const pascalToDash = (pascal: string) =>
    camelToDash(pascal.replace(/^\p{Lu}/gu, match => match.toLowerCase()));

export const toString = <T>(value: T) => `${value ?? ''}`;

export const isString = (x: any) => typeof x == 'string';

export const isFunction = (x: any) => typeof x == 'function';

export const getAttribute = (node: Element | HTMLElement, name: string) =>
    node.getAttribute(name);

export const hasOwn = (obj: Object, prop: string | symbol) =>
    Obj.prototype.hasOwnProperty.call(obj, prop);
    // In the future, we could use the newer method. As of right now, it's only
    // been around a couple years.
    // Obj.hasOwn(obj, prop);

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

export const appendChild = (parent: Node, child: Node) =>
    parent.appendChild(child);

// Return [key, value] pairs for a Map, Set, array, other iterable, or plain
// object. Only a real iterable is trusted to have an entries() method; a
// plain object may carry any key, including one called "entries".
export const entries = (x: any) =>
    isFunction(x?.[Symbol.iterator])
        ? // Map, Set, Array and NodeList have entries(); spread the rest.
          (isFunction(x.entries) ? x : [...x]).entries()
        : Obj.entries(x || {});

export const isTemplate = (node: Node): node is HTMLTemplateElement =>
    node.nodeName == 'TEMPLATE';
