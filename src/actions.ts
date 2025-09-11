import { Controller } from './controller.js';
import { hooksRun } from './hooks.js';
import {
    metadataControllerConfig,
    metadataControllerElement,
} from './metadata.js';

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
        updateController(controller, propertyName);
    } else {
        for (const registeredController of metadataControllerElement) {
            updateController(registeredController[0]);
        }
    }
};

export const updateController = (
    controller: Controller,
    propertyName?: string
) => {
    // Mark all attributes and properties as being changed so internals get
    // updated. Necessary when deeply nested objects are passed as input
    // properties to directives and are updated in scopes.
    if (controller.onChange) {
        const config = metadataControllerConfig(controller)!;

        // Only trigger updates once per property, so deduplicate names here
        for (const name of new Set([
            ...(config.prop || []),
            ...(config.attr || []),
        ])) {
            controller.onChange!(
                name,
                (controller as any)[name],
                (controller as any)[name]
            );
        }
    }

    // Update all bound functions
    hooksRun(`set:${propertyName || ''}`, controller, controller);
};
