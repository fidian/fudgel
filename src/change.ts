import { Controller } from "./controller-types.js";
import { metadata } from "./symbols.js";

export function change(controller: Controller | undefined, propertyName: string, newValue: any) {
    // Only allow the change if the controller is still active
    if (controller?.[metadata]) {
        const oldValue = controller[propertyName];

        if (oldValue !== newValue) {
            controller[propertyName] = newValue;
            controller.onChange?.(propertyName, newValue, oldValue);
            controller[metadata]?.change.emit(propertyName, newValue, oldValue);
        }
    }
}
