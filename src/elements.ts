/**
 * Shorthands for creating elements. Using these is better for minification.
 */
export const doc = document;

const createElement: Document['createElement'] = (name: string) =>
    doc.createElement(name);

export const createTextNode = (content: string) => doc.createTextNode(content);

export const createComment = (content: string) => doc.createComment(content);

export const createStyle = (content: string) => {
    const s = createElement('style');
    s.appendChild(createTextNode(content));

    return s;
}

export const createTemplate = () => createElement('template');
