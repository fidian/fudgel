import { createTemplate, createStyle } from './elements';
import { findPrototypeHooks } from './prototype-hooks';
import { hooksOff, hooksRun } from './hooks';
import { linkNodes } from './link-nodes';
import {
    metadataComponentConfig,
    metadataComponentController,
    metadataControllerElement,
    metadataElementController,
    metadataScope,
} from './metadata';

export class CustomElement extends HTMLElement {
    constructor() {
        super();
        metadataScope(this, {});
    }

    attributeChangedCallback(
        attrName: string,
        oldValue: string,
        newValue: string
    ) {
        const controller = metadataElementController(this)!;
        hooksRun(`attr:${attrName}`, controller, oldValue, newValue);
    }

    connectedCallback() {
        const constructor = this.constructor;
        const controller = new (metadataComponentController(constructor)!)();

        // Need basic information so prototype hooks can set up hooks correctly
        metadataElementController(this, controller);
        metadataControllerElement.set(controller, this);
        findPrototypeHooks(controller);
        const config = metadataComponentConfig(constructor)!;
        const root = this.shadowRoot || this.attachShadow({ mode: 'open' });

        // Add styling within the element
        if (config.style) {
            root.appendChild(createStyle(config.style));
        }

        // Initialize before adding child nodes
        controller.onInit && controller.onInit();
        hooksRun('init', controller);

        // Create initial child elements from the template.
        const templateText = config.template;
        const template = createTemplate();
        template.innerHTML = templateText;
        linkNodes(template.content, controller);
        root.append(template.content);
        controller.onViewInit && controller.onViewInit();
    }

    disconnectedCallback() {
        const controller = metadataElementController(this)!;
        hooksOff(this);

        // Need to eliminate the hard reference to the element.
        // Everything else should be able to be garbage collected.
        metadataControllerElement.delete(controller);
        this.shadowRoot!.innerHTML = '';
        this.innerHTML = '';
        controller.onDestroy && controller.onDestroy();
    }
}
