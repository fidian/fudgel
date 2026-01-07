import { ControllerConstructor } from './controller-types.js';
import { CustomElementConfigInternal } from './custom-element-config.js';

// [0] = Custom element contstructor
// [1] = Controller constructor
// [2] = Custom element config
export type ComponentInfo = [
    new () => HTMLElement,
    ControllerConstructor,
    CustomElementConfigInternal,
];

// FIXME: agadoo flags this as not tree-shakeable when using newSet()
export const allComponents = new Set<ComponentInfo>();
