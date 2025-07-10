/**
 * Shorthands for creating elements. Using these is better for minification.
 *
 * Both `doc` and `win` have a fallback to an object to support unit testing of
 * some things in a non-browser environment, such as `di()`.
 */
export const doc = document;
export const win = window;

export const cloneNode = (node: Node) => node.cloneNode(true) as HTMLElement;

export const createElement: Document['createElement'] = (name: string) =>
    doc.createElement(name);

export const createTextNode = (content: string) => doc.createTextNode(content);

export const createComment = (content: string) => doc.createComment(content);

export const createFragment = () => doc.createDocumentFragment();

export const createTemplate = () => createElement('template');

// NodeFilter.SHOW_ELEMENT = 0x01
// NodeFilter.SHOW_TEXT = 0x04
// NodeFilter.SHOW_COMMENT = 0x80 - necessary for structural directives
export const createTreeWalker = (root: Node, filter: number) => doc.createTreeWalker(root, filter);

export const sandboxStyleRules = (css: string) => {
    const sandbox = doc.implementation.createHTMLDocument('');
    const style = sandbox.createElement('style');
    style.textContent = css;
    sandbox.body.append(style);

    return style.sheet!.cssRules || [];
}

export const testCssSelector = (selector: string) => {
    try {
        doc.querySelector(selector);
        return true;
    } catch (ignore) {
        return false;
    }
}

export const toggleClass = (node: HTMLElement, className: string, force?: boolean) => {
    node.classList.toggle(className, force);
}
