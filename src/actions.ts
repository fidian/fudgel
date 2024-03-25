import { Controller } from './controller.js';
import { hooksRun } from './hooks.js';
import { metadataControllerConfig, metadataControllerElement } from './metadata.js';

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
        for (const registeredController of metadataControllerElement.keys()) {
            updateController(registeredController);
        }
    }
};

export const updateController = (controller: Controller, propertyName?: string) => {
    // Mark all attributes and properties as being changed so internals get updated
    if (controller.onChange) {
        const config = metadataControllerConfig(controller)!;

        for (const name of [...(config.prop || []), ...(config.attr || [])]) {
            controller.onChange(name, (controller as any)[name], (controller as any)[name]);
        }
    }


    // Update all bound functions
    hooksRun(`set:${propertyName || ''}`, controller);
}
