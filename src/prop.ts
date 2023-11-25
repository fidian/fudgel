/**
 * Bind a Fudgel class to a FudgelElement's property. This is a 1-way binding
 * from the HTML/FudgelElement to Fudgel.
 */
import { Controller } from './controller';
import { CustomElement } from './custom-element';
import { hookOn } from './hooks';
import {
    metadataControllerElement,
    metadataElementController,
    metadataPropPatched,
} from './metadata';
import { patchSetter } from './setter';
import { prototypeHook } from './prototype-hooks';

// Decorator to mark a property with one-way binding
export const Prop = () => {
    return function (proto: Object, propertyName: string) {
        prototypeHook(proto, (controller: Controller) => {
            hookOn(
                controller,
                metadataControllerElement.get(controller)!,
                'init',
                (thisRef: Controller) => prop(thisRef, propertyName)
            );
        });
    };
};

export const prop = (controller: Controller, propName: string) => {
    const element = metadataControllerElement.get(controller);

    if (element) {
        const update = (thisRef: CustomElement, newValue: any) => {
            metadataElementController(thisRef)![propName] = newValue;
        };
        patchSetter(metadataPropPatched, element, propName, update);
        update(element, (element as any)[propName]);
    }
};
