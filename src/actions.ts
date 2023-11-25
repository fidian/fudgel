import { Controller } from './controller';
import { hooksRun } from './hooks';
import { metadataControllerElement } from './metadata';

export const emit = (
    controller: Controller,
    eventName: string,
    detail?: any,
    customEventInit: CustomEventInit = {}
) => {
    const e = metadataControllerElement.get(controller);

    if (e) {
        e.dispatchEvent(
            new CustomEvent(eventName, {
                bubbles: true,
                cancelable: false,
                composed: true, // To go outside a shadow root
                detail,
                ...customEventInit,
            })
        );
    }
};

export const redraw = () => {
    for (const controller of metadataControllerElement.keys()) {
        hooksRun('set:', controller);
    }
};

export const update = (controller: Object, propertyName?: string) => {
    hooksRun(`set:${propertyName || ''}`, controller);
};
