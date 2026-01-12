import { shorthandWeakMap } from './maps.js';
import { newSet } from './sets.js';

export interface MutationObserverInfo {
    o?: MutationObserver;
    s: Set<VoidFunction>;
}

const metadataMutationObserver = shorthandWeakMap<Node, MutationObserverInfo>();
const DOMContentLoaded = 'DOMContentLoaded';

// When web components are added dynamically, they are automatically ready.
// However, when they are added during initial HTML load, the web component's
// child elements may not be added or may be added in phases. This function
// waits and determines when the child nodes are ready.
//
// Elements using a shadow DOM are always considered ready because they don't
// need or can't really access projected content from slots.
export const whenParsed = (
    element: HTMLElement,
    root: HTMLElement | ShadowRoot,
    callback: (wasAsync?: boolean) => void
) => {
    const ownerDocument = element.ownerDocument;
    const isReady = () => {
        let node: Node | null = element;

        do {
            if (node.nextSibling) {
                return true;
            }
        } while ((node = node.parentNode));

        // Returns undefined, which is falsy
    };

    // Check if enough of the document is already loaded/parsed.
    // 1. If using a shadow root, we are always ready.
    // 2. If the document is not "loading", then it is ready enough. "loading"
    // means content is still being added. "interactive" and "complete" are
    // both good enough for DOM manipulation.
    // 3. If any parent of the element has a next sibling, then the element
    // must have been parsed already.
    if (
        root != element ||
        ownerDocument.readyState != 'loading' ||
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
                    callback(true);
                }
            }
        );
    }
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
    const mutationRoot = element.getRootNode();
    const info =
        metadataMutationObserver(mutationRoot) ||
        metadataMutationObserver(mutationRoot, {
            s: newSet<VoidFunction>(),
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
