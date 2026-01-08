import { allControllers } from './all-controllers.js';
import { Controller } from './controller-types.js';
import { metadata } from './symbols.js';
import { newSet } from './sets.js';
import { lifecycle } from './lifecycle.js';

// FIXME do not export
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
    const e = controller[metadata]?.host;

    if (e) {
        dispatchCustomEvent(e, eventName, detail, customEventInit);
    }
};

export const update = (controller?: Object) => {
    if (controller) {
        updateController(controller);
    } else {
        for (const registeredController of allControllers) {
            updateController(registeredController);
        }
    }
};

const updateController = (
    controller: Controller,
) => {
    // Mark all attributes and properties as being changed so internals get
    // updated. Necessary when deeply nested objects are passed as input
    // properties to directives and are updated in scopes.
    const { attr, prop } = controller[metadata]!;

    // Only trigger updates once per property, so deduplicate names here
    for (const name of newSet(
        prop,
        attr,
    )) {
        lifecycle(controller, 'change',
            name,
            (controller as any)[name],
            (controller as any)[name]
        );
    }

    // Update all bound functions
    controller[metadata]?.events.emit('update');
};
