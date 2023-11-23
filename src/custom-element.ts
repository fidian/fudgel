import { createTemplate, createStyle } from './elements';
import { findPrototypeHooks } from './prototype-hooks';
import { hooksOff, hooksRun } from './hooks';
import { linkNodes } from './link-nodes';
import {
    metadataComponentController,
    metadataComponentStatics,
    metadataControllerContent,
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
        const statics = metadataComponentStatics(constructor)!;
        let root: Node = this;

        // Capture content projection
        const contentProjection = new DocumentFragment();
        contentProjection.append(...this.childNodes);
        metadataControllerContent(controller, contentProjection);

        // Engage a shadow root
        if (statics.shadow) {
            root = this.attachShadow({ mode: 'open' });
        }

        // Add styling within the element
        if (statics.style) {
            root.appendChild(createStyle(statics.style));
        }

        // Initialize before adding child nodes
        metadataControllerRoot(controller, root);
        controller.onInit && controller.onInit();
        hooksRun('init', controller);

        // Create initial child elements from the template.
        const templateText = statics.template;
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
        controller.onDestroy && controller.onDestroy();
    }
}
