import { CustomElementConfigInternal } from "./custom-element-config.js";
import { Emitter } from "./emitter.js";
import { metadata } from "./symbols.js";

/**
 * The lifecycle methods Fudgel calls on a controller, all optional. See the
 * Lifecycle page of the documentation for when each one runs.
 */
export interface ControllerHooks {
    onChange?(propName: string, oldValue: any, newValue: any): void;
    onDestroy?(): void;
    onInit?(): void;
    onParse?(): void;
    onUnlink?(removedNode: Node): void;
    onUpdate?(): void;
    onViewInit?(): void;
}

/**
 * A controller as Fudgel sees it: any class instance. The index signature is
 * what lets any class be used without declaring anything, at the cost of
 * TypeScript not catching a misspelled hook. Use `StrictController` when you
 * want that check.
 */
export interface Controller extends ControllerHooks {
    [key: string | symbol]: any;
    [metadata]?: ControllerMetadata;
}

/**
 * The same hooks without the index signature, for a class that wants a typo
 * in `onViewInit` to be a compile error: `class X implements StrictController`.
 */
export type StrictController = ControllerHooks & {
    [metadata]?: ControllerMetadata;
};

export type ControllerConstructor = new (controllerMetadata: ControllerMetadata) => Controller;

export interface ControllerMetadata extends CustomElementConfigInternal {
    events: Emitter<string>;
    host: HTMLElement;
    root: ShadowRoot | HTMLElement;
    tagName: string;
}
