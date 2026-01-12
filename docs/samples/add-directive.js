import { addDirective } from './fudgel.min.js';

// Named - matches "#name" and should start with "#"
addDirective('#name', (controller, node, attrValue, attrName) => {
    // Directive logic here
});

// Prefixed - matches attributes starting with "?"
addDirective('?', (controller, node, attrValue, attrName) => {
    // Directive logic here
});

// Structural - matches "*extra" and must start with "*"
addDirective('*extra', (controller, anchor, node, attrValue) => {
    // Directive logic here
});
