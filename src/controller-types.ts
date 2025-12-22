import { CustomElementConfigInternal } from "./custom-element-config.js";
import { metadata } from "./symbols.js";

export interface Controller {
    [key: string | symbol]: any;
    [metadata]?: ControllerMetadata;
    onChange?: (propName: string, oldValue: any, newValue: any) => void;
    onInit?: VoidFunction;
    onViewInit?: VoidFunction;
    onDestroy?: VoidFunction;
};

export type ControllerConstructor = new (controllerMetadata: ControllerMetadata) => Controller;

export interface ControllerMetadata extends CustomElementConfigInternal {
    host: HTMLElement;
    root: ShadowRoot | HTMLElement;
}
