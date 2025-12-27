export const Obj = Object;

export const stringify = (x: any) => JSON.stringify(x);

// Memoizing reduces repeats by a factor of ~200.
export const dashToCamel = (dashed: string) =>
    dashed.replace(/-(\p{Ll})/gu, match => match[1].toUpperCase());

export const camelToDash = (camel: string) =>
    camel.replace(/\p{Lu}/gu, match => `-${match[0]}`.toLowerCase());

export const pascalToDash = (pascal: string) =>
    camelToDash(pascal.replace(/^\p{Lu}/gu, match => match.toLowerCase()));

export const toString = <T>(value: T) => `${value ?? ''}`;

export const isString = (x: any) => typeof x == 'string';

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

export const appendChild = (parent: Node, child: Node) =>
    parent.appendChild(child);

// Return the entries of an Iterable or fall back on Object.entries for
// normal objects and arrays.
export const entries = (iterable: any) =>
    iterable.entries?.() ?? Obj.entries(iterable);

export const isTemplate = (node: Node): node is HTMLTemplateElement =>
    node.nodeName == 'TEMPLATE';
