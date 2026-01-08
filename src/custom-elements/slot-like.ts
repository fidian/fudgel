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
import { allComponents } from '../all-components.js';
import { events } from '../events.js';
import {
    createElement,
    createFragment,
    createTemplate,
    createTreeWalker,
} from '../elements.js';
import { Controller, ControllerConstructor } from '../controller-types.js';
import { CustomElementConfigInternal } from '../custom-element-config.js';
import { Emitter } from '../emitter.js';
import { getAttribute, setAttribute } from '../util.js';
import { childScope, getScope, Scope } from '../scope.js';
import { metadata } from '../symbols.js';
import { shorthandWeakMap } from '../maps.js';

export interface SlotInfo {
    c: string; // Original content HTML
    e: Emitter; // Notifications of slot removals
    n: Record<string, DocumentFragment>; // Named content
    s: Scope; // Outer element's scope for Fudgel bindings
}

const metadataElementSlotContent = shorthandWeakMap<
    ShadowRoot | HTMLElement,
    SlotInfo
>();

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
                // Set the scope of this element to be a child of the outer
                // element's scope.
                childScope(slotInfo.s, this);
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
    const rewrite = (
        _baseClass: new () => HTMLElement,
        controllerConstructor: ControllerConstructor,
        config: CustomElementConfigInternal
    ) => {
        if (!config.useShadow) {
            let rewrittenSlotElement = false;
            let foundSlotLikeElement = false;
            const template = createTemplate();
            template.innerHTML = config.template;
            const treeWalker = createTreeWalker(template.content, 0x01);
            let currentNode: HTMLElement | null;

            while ((currentNode = treeWalker.nextNode() as HTMLElement)) {
                // Change DOM elements in the template from <slot> to the
                // <slot-like>
                if (currentNode.nodeName == 'SLOT') {
                    rewrittenSlotElement = true;
                    const slotLike = createElement(name);

                    for (const attr of currentNode.attributes) {
                        setAttribute(slotLike, attr.name, attr.value);
                    }

                    treeWalker.previousNode() as HTMLElement;
                    slotLike.append(...currentNode.childNodes);
                    currentNode.replaceWith(slotLike);
                } else if (currentNode.nodeName == 'SLOT-LIKE') {
                    foundSlotLikeElement = true;
                }
            }

            if (rewrittenSlotElement) {
                config.template = template.innerHTML;
            }

            if (rewrittenSlotElement || foundSlotLikeElement) {
                const proto = controllerConstructor.prototype;
                const onParse = proto.onParse;
                const onDestroy = proto.onDestroy;

                proto.onParse = function (this: Controller) {
                    const controllerMetadata = this[metadata]!;
                    const root = controllerMetadata.root;
                    const slotInfo = metadataElementSlotContent(root, {
                        // Original content for restoring the DOM on disconnect
                        c: root.innerHTML,

                        // Event emitter
                        e: new Emitter(),

                        // Slots - named ones are set as additional properties. Unnamed
                        // slot content is combined into the '' fragment.
                        n: {
                            '': createFragment(),
                        },

                        // Scope for the <slot-like> element.
                        s: getScope(getParent(controllerMetadata.host) as Node),
                    });

                    // Grab all content for named slots
                    for (const child of [...root.querySelectorAll('[slot]')]) {
                        getFragment(
                            slotInfo,
                            getAttribute(child, 'slot') || ''
                        ).append(child);
                    }

                    // Now collect everything else and add it to the default slot
                    for (const child of [...root.childNodes]) {
                        slotInfo.n[''].append(child);
                    }

                    onParse?.call(this);
                };
                proto.onDestroy = function (this: Controller) {
                    const root = this[metadata]!.root;
                    const slotInfo = metadataElementSlotContent(root)!;
                    root.innerHTML = slotInfo.c;
                    onDestroy?.call(this);
                };
            }
        }
    };
    for (const info of allComponents) {
        rewrite(...info);
    }
    events.on('component', rewrite);
};
