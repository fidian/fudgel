import { createTemplate, createStyle } from './elements';
import { findPrototypeHooks } from './prototype-hooks';
import { hooksOff, hooksRun } from './hooks';
import { linkNodes } from './link-nodes';
import {
    metadataComponentConfig,
    metadataComponentController,
    metadataControllerElement,
    metadataControllerRoot,
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
        metadataControllerElement(controller, this);
        findPrototypeHooks(controller);
        const config = metadataComponentConfig(constructor)!;

        // Process content that will be used for content projection
        const contentProjection = new DocumentFragment();
        const processQueueContentProjection: [Node, Node][] = [];

        for (const childNode of this.childNodes) {
            processQueueContentProjection.push([contentProjection, childNode]);
        }

        linkNodes(processQueueContentProjection, controller);
        this.append(contentProjection);
        const root = this.shadowRoot || this.attachShadow({ mode: 'open' });

        // Add styling within the element
        if (config.style) {
            root.appendChild(createStyle(config.style));
        }

        // Initialize before adding child nodes
        metadataControllerRoot(controller, root);
        controller.onInit && controller.onInit();
        hooksRun('init', controller);

        // Create initial child elements from the template.
        const templateText = config.template;
        const processQueue: [Node, Node][] = [];

        if (templateText) {
            const template = createTemplate();
            template.innerHTML = templateText;

            for (const childNode of template.content.childNodes) {
                processQueue.push([root, childNode]);
            }
        }

        // Add child nodes
        linkNodes(processQueue, controller);
        controller.onViewInit && controller.onViewInit();
    }

    disconnectedCallback() {
        const controller = metadataElementController(this)!;
        hooksOff(this);

        // Probably need to eliminate the hard reference to the element.
        // Everything else should be able to be garbage collected.
        metadataControllerElement.d(controller);
        this.innerHTML = '';
        this.shadowRoot!.innerHTML = '';
        controller.onDestroy && controller.onDestroy();
    }
}
