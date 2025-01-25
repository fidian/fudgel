import { CustomElement } from './custom-element';
import { metadataMutationObserver } from './metadata';

export interface MutationObserverInfo {
    o?: MutationObserver | null;
    s: Set<() => void>;
}

const DOMContentLoaded = 'DOMContentLoaded';

// When web components are added dynamically, they are automatically ready.
// However, when they are added during initial HTML load, the web component's
// child elements may not be added or may be added in phases. This function
// waits and determines when the child nodes are ready.
export const whenParsed = (element: CustomElement, callback: () => void) => {
    const ownerDocument = element.ownerDocument;
    const findParent = (cb: (node: Node) => any) => {
        let node: Node | null = element;

        do {
            cb(node) && node;
        } while ((node = node.parentNode));

        return null;
    };
    const isReady = () => findParent((node: Node) => node.nextSibling);

    // If the document is already loaded or any parent has a next sibling, we're done.
    if (ownerDocument.readyState === 'complete' || isReady()) {
        callback();
    } else {
        // Watch the document or document fragment for changes.
        const unobserve = observe(
            findParent((node: Node) => !node.parentNode)!,
            () => {
                if (isReady()) {
                    unobserve();
                    callback();
                }
            }
        );

        // When the document loads, the element is ready.
        ownerDocument.addEventListener(DOMContentLoaded, () => {
            unobserve();
            callback();
        });
    }
};

// Watch the root of a document for node changes anywhere in the tree.
const observe = (root: Node, callback: () => void) => {
    const info = metadataMutationObserver(root, {
        s: new Set<() => void>(),
    });

    if (!info.o) {
        info.o = new MutationObserver(() => {
            for (const cb of info.s) {
                cb();
            }
        });

        info.o.observe(root, {
            childList: true,
            subtree: true,
        });
    }

    info.s.add(callback);

    return () => {
        info.s.delete(callback);

        if (!info.s.size) {
            info.o?.disconnect();
            info.o = null;
        }
    };
};
