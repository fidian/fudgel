/**
 * Shorthands for creating elements. Using these is better for minification.
 */
export const doc = document;
export const win = window;

export const cloneNode = (node: Node) => node.cloneNode(true) as HTMLElement;

export const createElement: Document['createElement'] = (name: string) =>
    doc.createElement(name);

export const createTextNode = (content: string) => doc.createTextNode(content);

export const createComment = (content: string) => doc.createComment(content);

export const createFragment = () => doc.createDocumentFragment();

export const createStyle = (content: string) => {
    const s = createElement('style');
    s.append(createTextNode(content));

    return s;
}

export const createTemplate = () => createElement('template');

// NodeFilter.SHOW_ELEMENT = 0x1
// NodeFilter.SHOW_TEXT = 0x4
// NodeFilter.SHOW_COMMENT = 0x80 - necessary for structural directives
export const createTreeWalker = (root: Node, filter: number) => doc.createTreeWalker(root, filter);

export const sandboxStyleRules = (css: string) => {
    const sandbox = doc.implementation.createHTMLDocument('');
    const style = sandbox.createElement('style');
    style.textContent = css;
    sandbox.body.append(style);

    return style.sheet!.cssRules;
}

export const testCssSelector = (selector: string) => {
    try {
        doc.querySelector(selector);
        return true;
    } catch (ignore) {
        return false;
    }
}
