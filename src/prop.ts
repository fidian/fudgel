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
} from './metadata';
import { patchSetter } from './setter';
import { prototypeHook } from './prototype-hooks';

// Decorator to mark a property with one-way binding
export const Prop = () => addPropHook;

export const prop = (controller: Controller, propertyName: string) =>
    addPropHook(controller.constructor.prototype, propertyName);

const addPropHook = (proto: Object, propertyName: string) => {
    prototypeHook(proto, (controllerOuter: Controller) => {
        hookOn(
            controllerOuter,
            metadataControllerElement.get(controllerOuter)!,
            'init',
            (controllerInner: Controller) => {
                const element = metadataControllerElement.get(controllerInner);

                if (element) {
                    const update = (thisRef: CustomElement, newValue: any) => {
                        const controller = metadataElementController(thisRef)!;
                        const oldValue = controller[propertyName];
                        controller[propertyName] = newValue;
                        controller.onChange && controller.onChange(propertyName, oldValue, newValue);
                    };
                    patchSetter(element, propertyName, update);
                    update(element, (element as any)[propertyName]);
                }
            }
        );
    });
};
