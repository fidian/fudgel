import { Controller } from './controller.js';
import { hooksRun } from './hooks.js';
import { metadataControllerElement } from './metadata.js';

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
        hooksRun(`set:${propertyName || ''}`, controller);
    } else {
        for (const registeredController of metadataControllerElement.keys()) {
            hooksRun('set:', registeredController);
        }
    }
};
