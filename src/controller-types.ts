import { CustomElementConfigInternal } from "./custom-element-config.js";
import { Emitter } from "./emitter.js";
import { metadata } from "./symbols.js";

export interface Controller {
    [key: string | symbol]: any;
    [metadata]?: ControllerMetadata;
    onChange?: (propName: string, oldValue: any, newValue: any) => void;
    onInit?: VoidFunction;
    onParse?: VoidFunction;
    onViewInit?: VoidFunction;
    onDestroy?: VoidFunction;
};

export type ControllerConstructor = new (controllerMetadata: ControllerMetadata) => Controller;

export interface ControllerMetadata extends CustomElementConfigInternal {
    events: Emitter<string>;
    host: HTMLElement;
    root: ShadowRoot | HTMLElement;
}
