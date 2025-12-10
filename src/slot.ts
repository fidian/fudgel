/* Slot-like component to enable slots in light DOM.
 *
 * Usage:
 *
 * <outer-element> <!-- a custom element; either shadow or light DOM -->
 *     <inner-element> <!-- another custom element; this one uses light DOM -->
 *         <div slot="title">
 *             <!-- named slot content -->
 *             Title
 *         </div>
 *         <!-- default slot content -->
 *         Other content
 *     </inner-element>
 * </outer-element>
 *
 * The inner element has a template similar to this and correctly uses these
 * slot-like components:
 *
 * <h1><slot-like name="title"></slot-like></h1>
 * <slot-like></slot-lik>
 *
 * The resulting DOM will be:
 *
 * <outer-element>
 *     <inner-element>
 *         <h1><slot-like name="title"><div slot="title">
 *             <!-- named slot content -->
 *             Title
 *         </div></slot-like></h1> <!-- named slot content -->
 *         <slot-like><div>
 *             <!-- default slot content -->
 *             Other content
 *         </div></slot-like>
 *     </inner-element>
 * </outer-element>
 */
import {
    createElement,
    createFragment,
    createTemplate,
    createTreeWalker,
} from './elements.js';
import { Controller } from './controller.js';
import { CustomElement } from './custom-element.js';
import { CustomElementConfig } from './custom-element-config.js';
import { Emitter } from './emitter.js';
import { getAttribute, setAttribute } from './util.js';
import { getScope, Scope } from './scope.js';
import { hookOnGlobal } from './hooks.js';
import {
    metadataComponentController,
    metadataControllerElement,
    metadataElementSlotContent,
    metadataScope,
} from './metadata.js';
import { getPrototypeOf, rootElement } from './util.js';

export interface SlotInfo {
    e: Emitter; // Notifications of slot removals
    n: Record<string, DocumentFragment>; // Named content
    s: Scope; // Outer element's scope for Fudgel bindings
}

const getFragment = (slotInfo: SlotInfo, name: string) =>
    slotInfo.n[name] || (slotInfo.n[name] = createFragment());

// Given an element, find its parent element. The parent element may be outside
// of a shadow root.
const getParent = (element: HTMLElement): HTMLElement | undefined =>
    element.parentElement ||
    (((element.getRootNode() as ShadowRoot) || {}).host as
        | HTMLElement
        | undefined);

export const defineSlotComponent = (name = 'slot-like') => {
    class SlotComponent extends HTMLElement {
        private _eventRemover?: VoidFunction;
        private _slotInfo?: SlotInfo;

        constructor() {
            super();

            // Find the parent custom element that is using this component.
            // The parent must not change even if this element is later relocated
            // elsewhere (eg. deeper via content projection into content
            // projection) in the DOM.
            let parent = getParent(this);

            while (
                parent &&
                !(this._slotInfo = metadataElementSlotContent(parent))
            ) {
                parent = getParent(parent);
            }
        }

        attributeChangedCallback(
            _name: string,
            oldValue: string,
            newValue: string
        ) {
            const slotInfo = this._slotInfo;

            if (slotInfo && oldValue !== newValue) {
                this._removeContent(slotInfo, oldValue);
                this._addContent(slotInfo);
            }
        }

        connectedCallback() {
            const slotInfo = this._slotInfo;

            if (slotInfo) {
                // Set the scope of this element to match the outer element's scope.
                metadataScope(this, slotInfo.s);
                this._addContent(slotInfo);
            }
        }

        disconnectedCallback() {
            if (this._slotInfo) {
                this._removeContent(
                    this._slotInfo,
                    getAttribute(this, 'name') || ''
                );
            }
        }

        private _addContent(slotInfo: SlotInfo) {
            const name = getAttribute(this, 'name') || '';
            this.append(slotInfo.n[name] || []);
            this._eventRemover = slotInfo.e.on(name, () => {
                this._removeContent(slotInfo, name);
                this._addContent(slotInfo);
            });
        }

        private _removeContent(slotInfo: SlotInfo, oldName: string) {
            this._eventRemover!();
            getFragment(slotInfo, oldName).append(...this.childNodes);
            slotInfo.e.emit(oldName);
        }
    }

    (SlotComponent as any).observedAttributes = ['name'];
    customElements.define(name, SlotComponent);

    // Rewrite templates for custom elements that use slots in light DOM.
    hookOnGlobal(
        'component',
        (baseClass: CustomElement, config: CustomElementConfig) => {
            if (!config.useShadow) {
                let usesSlotLike = false;
                const template = createTemplate();
                template.innerHTML = config.template;
                const treeWalker = createTreeWalker(template.content, 0x01);
                let currentNode: HTMLElement | null;

                while ((currentNode = treeWalker.nextNode() as HTMLElement)) {
                    // Change DOM elements in the template from <slot> to the
                    // <slot-like>
                    if (currentNode.nodeName === 'SLOT') {
                        usesSlotLike = true;
                        const slotLike = createElement(name);

                        for (const attr of currentNode.attributes) {
                            setAttribute(slotLike, attr.name, attr.value)
                        }

                        treeWalker.previousNode() as HTMLElement;
                        slotLike.append(...currentNode.childNodes);
                        currentNode.replaceWith(slotLike);
                    }
                }

                if (usesSlotLike) {
                    config.template = template.innerHTML;
                }

                patch(getPrototypeOf(metadataComponentController(baseClass)!));
            }
        }
    );
};

function patch(proto: Controller) {
    const onParse = proto.onParse;
    let root: ShadowRoot | HTMLElement;
    let content = '';

    // When children are done being added, move them to slotInfo so
    // <slot-like> can find the content.
    proto.onParse = function (this: Controller) {
        root = rootElement(this)!;
        content = root.innerHTML;

        // Set up the basic info. The outer element's scope is used in
        // order to support Fudgel bindings.
        const slotInfo = metadataElementSlotContent(root, {
            e: new Emitter(),
            n: {
                '': createFragment(),
            },
            s: getScope(
                getParent(metadataControllerElement.get(this)!) as Node
            ),
        });

        // Grab all content for named slots
        for (const child of [...root.querySelectorAll('[slot]')]) {
            getFragment(slotInfo, getAttribute(child, 'slot') || '').append(
                child
            )
        }

        // Now collect everything else and add it to the default slot
        for (const child of [...root.childNodes]) {
            slotInfo.n[''].append(child);
        }

        onParse?.call(this);
    };

    const onDestroy = proto.onDestroy;

    proto.onDestroy = function (this: Controller) {
        root = rootElement(this)!;
        root.innerHTML = content;
        onDestroy?.call(this);
    };
}
