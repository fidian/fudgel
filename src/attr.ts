/**
 * Bind a controller class to a CustomElement's attribute. This is a 2-way binding.
 */
import { camelToDash, isEmptyValue } from './util';
import { Controller } from './controller';
import { hookOn } from './hooks';
import { metadataAttrPatched, metadataControllerElement } from './metadata';
import { patchSetter } from './setter';
import { prototypeHook } from './prototype-hooks';

// Decorator to mark a property with two-way binding
export const Attr = () => {
    return function (proto: Object, propertyName: string) {
        prototypeHook(proto, (controller: Controller) => {
            hookOn(
                controller,
                metadataControllerElement.get(controller)!,
                'init',
                (thisRef: Object) => attr(thisRef, propertyName)
            );
        });
    };
};

export const attr = (controller: Controller, propName: string) => {
    const attrName = camelToDash(propName);
    const element = metadataControllerElement.get(controller)!;

    // When attribute changes, update internal property.
    if (element) {
        hookOn(
            controller,
            element,
            `attr:${attrName}`,
            (thisRef: Controller, oldValue, newValue) => {
                (thisRef as any)[propName] = newValue;
                thisRef.onChange &&
                    thisRef.onChange(propName, oldValue, newValue);
            }
        );
    }

    // When internal property changes, update attribute.
    const update = (thisRef: Controller, newValue: any) => {
        const element = metadataControllerElement.get(thisRef);

        if (element) {
            if (isEmptyValue(newValue)) {
                element.removeAttribute(attrName);
            } else {
                element.setAttribute(attrName, `${newValue}`);
            }
        }
    };
    patchSetter(metadataAttrPatched, controller, propName, update);
    update(controller, (controller as any)[propName]);
};
