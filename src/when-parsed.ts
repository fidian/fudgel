import { CustomElement } from './custom-element';
import { metadataMutationObserver } from './metadata';

export interface MutationObserverInfo {
    o?: MutationObserver;
    s: Set<() => void>;
}

const DOMContentLoaded = 'DOMContentLoaded';

// When web components are added dynamically, they are automatically ready.
// However, when they are added during initial HTML load, the web component's
// child elements may not be added or may be added in phases. This function
// waits and determines when the child nodes are ready.
//
// Elements using a shadow DOM are always considered ready because they don't
// need or can't really access projected content from slots.
export const whenParsed = (
    element: CustomElement,
    root: CustomElement | ShadowRoot,
    callback: () => void
) => {
    const ownerDocument = element.ownerDocument;
    const isReady = () => {
        let node: Node | null = element;

        do {
            if (node.nextSibling) {
                return true;
            }
        } while ((node = node.parentNode));

        return false;
    };

    // If the document is already loaded or any parent has a next sibling,
    // we're done. "loading" means the document is still loading. "interactive"
    // and "complete" are both good enough for DOM manipulation.
    if (
        root === element ||
        ownerDocument.readyState !== 'loading' ||
        isReady()
    ) {
        callback();
    } else {
        // Watch the document or document fragment for changes.
        const unobserve = observe(
            ownerDocument,
            element,
            (isLoaded: boolean) => {
                if (isLoaded || isReady()) {
                    unobserve();
                    callback();
                }
            }
        );
    }
};

// Get the root element to watch for mutations. Stops just short of a document
// or document fragment.
const getMutationRoot = (element: Node) => {
    let p: Node | null = element;

    do {
        element = p;
        p = element.parentNode;
    } while (p && p.nodeType === 1);

    return element;
};

// Watch the root of a document for node changes anywhere in the tree. Also,
// fire the callback when the document loads.
const observe = (
    doc: Document,
    element: Node,
    callback: (isLoaded: boolean) => void
) => {
    // When the document loads, the element is ready
    const onLoad = () => {
        callback(true);
    };
    doc.addEventListener(DOMContentLoaded, onLoad);

    // Watch the DOM for any changes
    const mutationRoot = getMutationRoot(element);
    const info =
        metadataMutationObserver(mutationRoot) ||
        metadataMutationObserver(mutationRoot, {
            s: new Set<() => void>(),
        });
    const onMutation = () => {
        callback(false);
    };
    info.s.add(onMutation);

    if (!info.o) {
        info.o = new MutationObserver(() => {
            for (const cb of [...info.s]) {
                cb();
            }
        });

        info.o.observe(mutationRoot, {
            childList: true,
            subtree: true,
        });
    }

    return () => {
        info.s.delete(onMutation);
        doc.removeEventListener(DOMContentLoaded, onLoad);

        if (!info.s.size) {
            info.o!.disconnect();
            delete info.o;
        }
    };
};
