import { win } from './elements.js';

// This can be shared with different versions of Fudgel, so make sure keys are
// always consistently used for the same purpose.

type GLOBAL_KEYS = 'n';
let global: Map<GLOBAL_KEYS, any> = new Map();

export let bootstrap = () => {
    ((key) => global = (win as any)[key] || ((win as any)[key] = global))('__fudgel');
    bootstrap = () => {};
};

// A unique number within Fudgel
export const nextN = () => {
    const n = global.get('n') || 0;
    global.set('n', n + 1);

    return n;
};
