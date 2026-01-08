import { Controller } from "./controller-types.js";
import { lifecycle } from "./lifecycle.js";
import { metadata } from "./symbols.js";

export const change = (controller: Controller | undefined, propertyName: string, newValue: any) => {
    // Only allow the change if the controller is still active
    if (controller?.[metadata]) {
        const oldValue = controller[propertyName];

        if (oldValue !== newValue) {
            controller[propertyName] = newValue;
            lifecycle(controller, 'change', propertyName, oldValue, newValue);
        }
    }
}
