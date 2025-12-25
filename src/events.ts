import { Emitter } from './emitter.js';

export type EventType =
    | 'component'; // See ComponentInfo

export const events = new Emitter<EventType>();
