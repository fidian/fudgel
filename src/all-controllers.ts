import { Controller } from './controller-types.js';

// FIXME: agadoo flags this as not tree-shakeable when using newSet()
export const allControllers = new Set<Controller>();
