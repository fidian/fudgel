/**
 * Set up config and define a custom element.
 */
import { camelToDash } from './util';
import { Constructor } from './constructor';
import { Controller } from './controller';
import { CustomElement } from './custom-element';
import {
    CustomElementConfig,
} from './custom-element-config';
import {
    metadataComponentConfig,
    metadataComponentController,
} from './metadata';

// Decorator to wire a class as a custom component
export const Component = (tag: string, config: CustomElementConfig) => {
    return (target: Constructor) => {
        component(tag, config, target);
    };
}

const ce = customElements;

export const component = (
    tag: string,
    config: CustomElementConfig,
    constructor?: Constructor
) => {
    const base = class extends CustomElement {
        static observedAttributes: string[] = (config.attr || []).map(camelToDash);
    };
    metadataComponentConfig(base, config);
    metadataComponentController(
        base,
        constructor || class implements Controller {}
    );
    ce.get(tag) || ce.define(tag, base);
};
