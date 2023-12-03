/**
 * Bind a controller class to a CustomElement's attribute. This is a 2-way binding.
 */
import { camelToDash, setAttribute } from './util';
import { Controller } from './controller';
import { hookOn } from './hooks';
import {
    metadataControllerElement,
} from './metadata';
import { patchSetter } from './setter';
import { prototypeHook } from './prototype-hooks';

// Decorator to mark a property with two-way binding
export const Attr = () => addAttrHook;

export const attr = (controller: Controller, propertyName: string) =>
    addAttrHook(controller.constructor.prototype, propertyName);

const addAttrHook = (proto: Object, propertyName: string) =>
    prototypeHook(proto, (controllerOuter: Controller) => {
        hookOn(
            controllerOuter,
            metadataControllerElement.get(controllerOuter)!,
            'init',
            (controllerRef: Object) => {
                const attrName = camelToDash(propertyName);
                const element = metadataControllerElement.get(controllerRef)!;

                // When attribute changes, update internal property.
                if (element) {
                    const attrToProp = (
                        thisRef: Controller,
                        oldValue: string | null,
                        newValue: string | null
                    ) => {
                        (thisRef as any)[propertyName] = newValue;
                        thisRef.onChange &&
                            thisRef.onChange(propertyName, oldValue, newValue);
                    };
                    hookOn(
                        controllerRef,
                        element,
                        `attr:${attrName}`,
                        attrToProp
                    );
                    attrToProp(
                        controllerRef,
                        null,
                        element.getAttribute(attrName)
                    );
                }

                // When internal property changes, update attribute.
                const update = (thisRef: Controller, newValue: any) => {
                    const element = metadataControllerElement.get(thisRef);

                    if (element) {
                        setAttribute(element, attrName, newValue);
                    }
                };
                patchSetter(
                    controllerRef,
                    propertyName,
                    update
                );
            }
        );
    });
