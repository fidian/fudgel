import { Controller } from './controller.js';
import { hooksRun } from './hooks.js';
import { metadataControllerConfig, metadataControllerElement } from './metadata.js';
import { iterate } from './util.js';

export const dispatchCustomEvent = (
    e: Element,
    eventName: string,
    detail?: any,
    customEventInit: CustomEventInit = {}
) => {
    e.dispatchEvent(
        new CustomEvent(eventName, {
            bubbles: true,
            cancelable: false,
            composed: true, // To go outside a shadow root
            detail,
            ...customEventInit,
        })
    );
};

export const emit = (
    controller: Controller,
    eventName: string,
    detail?: any,
    customEventInit: CustomEventInit = {}
) => {
    const e = metadataControllerElement.get(controller);

    if (e) {
        dispatchCustomEvent(e, eventName, detail, customEventInit);
    }
};

export const update = (controller?: Object, propertyName?: string) => {
    if (controller) {
        updateController(controller, propertyName)
    } else {
        iterate(metadataControllerElement, (_v, k) => updateController(k));
    }
};

export const updateController = (controller: Controller, propertyName?: string) => {
    // Mark all attributes and properties as being changed so internals get updated
    if (controller.onChange) {
        const config = metadataControllerConfig(controller)!;

        // Only trigger updates once per property, so deduplicate names here
        iterate(new Set([...(config.prop || []), ...(config.attr || [])]), (name) =>
            controller.onChange!(name, (controller as any)[name], (controller as any)[name]));
    }

    // Update all bound functions
    hooksRun(`set:${propertyName || ''}`, controller, controller);
}
