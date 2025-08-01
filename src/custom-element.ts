import {
    camelToDash,
    dashToCamel,
    getAttribute,
    setAttribute,
} from './util.js';
import {
    createElement,
    createTemplate,
    createTextNode,
    toggleClass,
} from './elements.js';
import { Controller } from './controller.js';
import { CustomElementConfig } from './custom-element-config.js';
import { hooksOff } from './hooks.js';
import { linkNodes } from './link-nodes.js';
import {
    metadataComponentConfig,
    metadataComponentController,
    metadataControllerConfig,
    metadataControllerElement,
    metadataElementController,
    metadataPatchedSetter,
} from './metadata.js';
import { patchSetter } from './setter.js';
import { whenParsed } from './when-parsed.js';

export class CustomElement extends HTMLElement {
    constructor() {
        super();
    }

    attributeChangedCallback(
        attributeName: string,
        oldValue: string,
        newValue: string
    ) {
        const propertyName = dashToCamel(attributeName);
        const controller = metadataElementController(this);

        if (controller && oldValue !== newValue) {
            this._changeControllerProperty(controller, propertyName, newValue);
        }
    }

    connectedCallback() {
        const constructor = this.constructor;
        const controller = new (metadataComponentController(constructor)!)();
        const config = metadataComponentConfig(constructor)!;
        const useShadow = config.useShadow;
        const root = useShadow
            ? this.shadowRoot || this.attachShadow({ mode: 'open' })
            : this;
        const styleParent = root.getRootNode() as Document | ShadowRoot;
        metadataElementController(this, controller);
        metadataControllerElement.set(controller, this);
        metadataControllerConfig(controller, config);
        toggleClass(this, config.className, true);

        // Initialize before adding child nodes
        this._bindings(config, controller);
        controller.onInit?.();

        // Need to wait until child nodes are ready for light DOM elements that
        // use slots.
        whenParsed(this, root, () => {
            controller.onParse?.();

            // Create initial child elements from the template.
            const template = createTemplate();
            template.innerHTML = config.template;
            linkNodes(template.content, controller);

            // Remove all existing content when not using a shadow DOM to simulate
            // the same behavior shown when using a shadow DOM.
            root.innerHTML = '';

            // With a shadow DOM, append styling within the element.
            // Add styling to either the parent document or the parent shadow root.
            if (
                config.style &&
                !styleParent.querySelector('style.' + config.className)
            ) {
                const s = createElement('style');
                toggleClass(s, config.className, true);
                s.prepend(createTextNode(config.style));
                ((styleParent as any).body || styleParent).prepend(s);
            }

            // Finally, add the processed nodes
            root.append(template.content);
            controller.onViewInit?.();
        });
    }

    disconnectedCallback() {
        // Everything not listed here should be able to be garbage collected.
        const controller = metadataElementController(this)!;
        controller?.onDestroy?.();
        hooksOff(this);

        // Eliminate the hard reference to the element.
        metadataControllerElement.delete(controller);

        // Remove callbacks added to the element.
        // The controller is garbage collected, so those callbacks can remain.
        const trackingObject = metadataPatchedSetter(this);

        if (trackingObject) {
            for (const key of Object.keys(trackingObject)) {
                trackingObject[key] = [];
            }
        }
    }

    private _bindings(
        config: CustomElementConfig,
        controllerInternal: Controller
    ) {
        for (const propertyName of config.attr || []) {
            const attributeName = camelToDash(propertyName);

            // Set initial value - updates are tracked with
            // attributeChangedCallback.  Only set the initial value when the
            // attribute has been defined.
            if (this.hasAttribute(attributeName)) {
                // Set the initial value on the controller.
                this._changeControllerProperty(
                    controllerInternal,
                    propertyName,
                    getAttribute(this, attributeName)
                );
            }

            // When the internal property changes, update the attribute but only
            // if it is not defined as a "prop" binding.
            if (!(config.prop || []).includes(propertyName)) {
                patchSetter(
                    controllerInternal,
                    propertyName,
                    (thisRef: Controller, newValue: any) => {
                        const element = metadataControllerElement.get(thisRef);

                        if (
                            element &&
                            getAttribute(element, attributeName) !==
                                `${newValue}`
                        ) {
                            setAttribute(element, attributeName, newValue);
                        }
                    }
                );
            }
        }

        for (const propertyName of config.prop || []) {
            const updateController = (
                thisRef: CustomElement,
                newValue: any
            ) => {
                const controller = metadataElementController(thisRef)!;
                this._changeControllerProperty(
                    controller,
                    propertyName,
                    newValue
                );
            };

            // Only set the initial value when the property has been set
            // on the element.
            if (propertyName in this) {
                updateController(this, (this as any)[propertyName]);
            }

            // When element changes, update controller
            patchSetter(this, propertyName, updateController);

            // When controller changes, update element
            const updateElement = (thisRef: Controller, newValue: any) => {
                const element = metadataControllerElement.get(thisRef);

                if (element) {
                    (element as any)[propertyName] = newValue;
                }
            };
            patchSetter(controllerInternal, propertyName, updateElement);
            updateElement(controllerInternal, controllerInternal[propertyName]);
        }
    }

    private _changeControllerProperty(
        controller: Controller,
        propertyName: string,
        newValue: any
    ) {
        const oldValue = (controller as any)[propertyName];
        (controller as any)[propertyName] = newValue;
        controller.onChange?.(propertyName, oldValue, newValue);
    }
}
