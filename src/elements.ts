/**
 * Shorthands for creating elements. Using these is better for minification.
 *
 * `win` falls back to the global object so the library can be imported where
 * there is no window, such as a Node test of a service that uses `di()` or
 * of the expression parser. `doc` is then undefined, and every DOM path stays
 * unreachable until a component is defined in a real browser.
 */
export const win = (typeof window != 'undefined' ? window : globalThis) as Window &
    typeof globalThis;
export const doc = win.document;

export const cloneNode = (node: Node) => node.cloneNode(true) as HTMLElement;

export const createElement: Document['createElement'] = (name: string) =>
    doc.createElement(name);

export const createTextNode = (content: string) => doc.createTextNode(content);

export const createComment = (content: string) => doc.createComment(content);

export const createDocumentFragment = () => doc.createDocumentFragment();

export const createTemplate = () => createElement('template');

// NodeFilter.SHOW_ELEMENT = 0x01
// NodeFilter.SHOW_TEXT = 0x04
// NodeFilter.SHOW_COMMENT = 0x80 - necessary for structural directives
export const createTreeWalker = (root: Node, filter: number) =>
    doc.createTreeWalker(root, filter);

export const sandboxStyleRules = (css: string) => {
    const sandbox = doc.implementation.createHTMLDocument('');
    const style = sandbox.createElement('style');
    style.textContent = css;
    sandbox.body.append(style);

    return style.sheet!.cssRules || [];
};

export const testCssSelector = (selector: string) => {
    var result = false;

    try {
        doc.querySelector(selector);
        result = true;
    } catch (_ignore) {
    }

    return result;
};

export const toggleClass = (
    node: HTMLElement,
    className: string,
    force: boolean
) => node.classList.toggle(className, force);
