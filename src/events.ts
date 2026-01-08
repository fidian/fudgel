import { ControllerLifecycleEvents } from './lifecycle.js';
import { Emitter } from './emitter.js';

export type EventType =
    | 'component' // See ComponentInfo
    | `controller:${ControllerLifecycleEvents}`;

export const events = new Emitter<EventType>();
