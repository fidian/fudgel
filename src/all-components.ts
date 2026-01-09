import { ControllerConstructor } from './controller-types.js';
import { CustomElementConfigInternal } from './custom-element-config.js';
import { newSet } from './sets.js';

// [0] = Custom element contstructor
// [1] = Controller constructor
// [2] = Custom element config
export type ComponentInfo = [
    new () => HTMLElement,
    ControllerConstructor,
    CustomElementConfigInternal,
];

export const allComponents = /*@__PURE__*/ newSet<ComponentInfo>();
