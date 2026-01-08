import { Controller } from './controller-types.js';
import { events } from './events.js';
import { metadata } from './symbols.js';

export type ControllerLifecycleEvents =
    // A bound property has changed its value.
    //
    // * actions.js - externally triggered via update() before 'update' is
    //   fired.
    // * change.js - used to set a property, hash-ref.js and component.js.
    //
    // propertyName: string, newValue: any, oldValue: any
    | 'change'

    // A host element is being destroyed.
    //
    // * component.js
    //
    // no args
    | 'destroy'

    // A controller is being initialized.
    //
    // * component.js
    //
    // no args
    | 'init'

    // The HTML content has been parsed and is ready for DOM manipulation.
    //
    // * component.js
    //
    // wasAsync: boolean
    | 'parse'

    // A node has been removed from the DOM.
    //
    // * link-unlink.ts
    //
    // removedNode: Node
    | 'unlink'

    // An update cycle was forced from outside. All bindings should
    // re-evaluate.
    //
    // * actions.js - externally triggered via update() after 'change' was
    //   fired.
    //
    // no args
    | 'update'

    // The view has been fully instantiated, template parsed, DOM created, and
    // events are hooked up.
    //
    // * component.js
    //
    // wasAsync: boolean
    | 'viewInit';

export const lifecycle = (
    controller: Controller,
    phase: ControllerLifecycleEvents,
    ...args: any[]
) => {
    events.emit(`controller:${phase}`, controller, ...args);
    controller[metadata]?.events.emit(phase, ...args);
    controller[`on${phase[0].toUpperCase()}${phase.slice(1)}`]?.(...args);
};
