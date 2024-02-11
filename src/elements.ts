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
    s.appendChild(createTextNode(content));

    return s;
}

export const createTemplate = () => createElement('template');
