import {
    camelToDash,
    dashToCamel,
    getAttribute,
    setAttribute,
} from './util.js';
import { createTemplate, createStyle } from './elements.js';
import { Controller } from './controller.js';
import { CustomElementConfig } from './custom-element-config.js';
import { hooksOff, hooksRun } from './hooks.js';
import { linkNodes } from './link-nodes.js';
import {
    metadataComponentConfig,
    metadataComponentController,
    metadataControllerElement,
    metadataElementController,
} from './metadata.js';
import { patchSetter } from './setter.js';

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
            this.#change(controller, propertyName, newValue);
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
        this.classList.add(config.className);

        // Initialize before adding child nodes
        this.#bindings(config, controller);
        controller.onInit && controller.onInit();
        hooksRun('init', controller);

        // Create initial child elements from the template.
        const template = createTemplate();
        template.innerHTML = config.template;
        linkNodes(template.content, controller);

        // Remove all existing content when not using a shadow DOM to simulate
        // the same behavior as our shadow DOM contents.
        useShadow || this.#clearContent();

        // Add styling within the element when using a shadow DOM.
        // When not using this, the CSS is applied in component().
        config.style && root.append(createStyle(config.style));

        // Finally, add the processed nodes
        root.append(template.content);
        controller.onViewInit && controller.onViewInit();
    }

    disconnectedCallback() {
        const controller = metadataElementController(this)!;
        controller && controller.onDestroy && controller.onDestroy();
        hooksOff(this);

        // Need to eliminate the hard reference to the element.
        // Everything else should be able to be garbage collected.
        metadataControllerElement.delete(controller);
        this.#clearContent();
    }

    #bindings(config: CustomElementConfig, controllerInternal: Controller) {
        for (const propertyName of config.prop || []) {
            // When element changes, update controller
            const updateController = (
                thisRef: CustomElement,
                newValue: any
            ) => {
                const controller = metadataElementController(thisRef)!;
                this.#change(controller, propertyName, newValue);
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
            this.#change(
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

    #change(controller: Controller, propertyName: string, newValue: any) {
        const oldValue = (controller as any)[propertyName];
        (controller as any)[propertyName] = newValue;
        controller.onChange &&
            controller.onChange(propertyName, oldValue, newValue);
    }

    #clearContent() {
        this.innerHTML = '';

        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = '';
        }
    }
}
