import {
    camelToDash,
    dashToCamel,
    getAttribute,
    setAttribute,
} from './util.js';
import { createTemplate, createStyle } from './elements.js';
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
} from './metadata.js';
import { patchSetter } from './setter.js';
import { whenParsed } from './when-parsed.js';

export class CustomElement extends HTMLElement {
    constructor() {
        super();
    }

    attributeChangedCallback(
        attributeName: string,
        _oldValue: string,
        newValue: string
    ) {
        const propertyName = dashToCamel(attributeName);
        const controller = metadataElementController(this);

        if (controller) {
            this._change(controller, propertyName, newValue);
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
        metadataElementController(this, controller);
        metadataControllerElement.set(controller, this);
        metadataControllerConfig(controller, config);
        this.classList.add(config.className);

        // Initialize before adding child nodes
        this._bindings(config, controller);
        controller.onInit?.();

        // Need to wait until child nodes are ready.
        whenParsed(this, () => {
            controller.onParse?.();

            // Create initial child elements from the template.
            const template = createTemplate();
            template.innerHTML = config.template;
            linkNodes(template.content, controller);

            // Remove all existing content when not using a shadow DOM to simulate
            // the same behavior shown when using a shadow DOM.
            useShadow || this._clearContent();

            // Add styling within the element. Works with or without a shadow DOM.
            config.style && root.append(createStyle(config.style));

            // Finally, add the processed nodes
            root.append(template.content);
            controller.onViewInit?.();
        });
    }

    disconnectedCallback() {
        const controller = metadataElementController(this)!;
        controller?.onDestroy?.();
        hooksOff(this);

        // Need to eliminate the hard reference to the element.
        // Everything else should be able to be garbage collected.
        metadataControllerElement.delete(controller);
        this._clearContent();
    }

    private _bindings(config: CustomElementConfig, controllerInternal: Controller) {
        for (const propertyName of config.prop || []) {
            // When element changes, update controller
            const updateController = (
                thisRef: CustomElement,
                newValue: any
            ) => {
                const controller = metadataElementController(thisRef)!;
                this._change(controller, propertyName, newValue);
            };
            patchSetter(this, propertyName, updateController);
            updateController(this, (this as any)[propertyName]);

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

        for (const propertyName of config.attr || []) {
            const attributeName = camelToDash(propertyName);

            // Set initial value - updates are tracked with attributeChangedCallback
            this._change(
                controllerInternal,
                propertyName,
                getAttribute(this, attributeName)
            );

            // When the internal property changes, update the attribute but only
            // if it is not defined as a "prop" binding.
            if (!(config.prop || []).includes(propertyName)) {
                const updateAttribute = (
                    thisRef: Controller,
                    newValue: any
                ) => {
                    const element = metadataControllerElement.get(thisRef);

                    if (element) {
                        setAttribute(element, attributeName, newValue);
                    }
                };
                patchSetter(controllerInternal, propertyName, updateAttribute);
            }
        }
    }

    private _change(controller: Controller, propertyName: string, newValue: any) {
        const oldValue = (controller as any)[propertyName];
        (controller as any)[propertyName] = newValue;
        controller.onChange?.(propertyName, oldValue, newValue);
    }

    private _clearContent() {
        this.innerHTML = '';

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = '';
        }
    }
}
