/**
 * Set up statics and define a custom element.
 */
import { attachToBody, createStyle } from './elements';
import { Constructor } from './constructor';
import { Controller } from './controller';
import { CustomElement } from './custom-element';
import {
    CustomElementStatics,
    CustomElementStaticsMetadata,
} from './custom-element-statics';
import {
    metadataComponentController,
    metadataComponentStatics,
} from './metadata';

// Decorator to wire a class as a custom component
export function Component(tag: string, statics: CustomElementStatics) {
    return (target: Constructor) => {
        component(tag, statics, target);
    };
}

const ce = customElements;

export const component = (
    tag: string,
    statics: CustomElementStatics = {},
    constructor?: Constructor
) => {
    const base = class extends CustomElement {};

    // Convert (tag: string) => `${tag} div { display: none }`
    // into the string form of the styles.
    if (typeof statics.style === 'function') {
        statics.style = statics.style(tag);
    }

    // If we are not using a shadow root, append the styles once to the document.
    if (!statics.shadow && statics.style) {
        attachToBody(createStyle(statics.style));
        statics.style = '';
    }

    metadataComponentStatics(base, statics as CustomElementStaticsMetadata);
    metadataComponentController(
        base,
        constructor || class implements Controller {}
    );
    ce.get(tag) || ce.define(tag, base);
};
