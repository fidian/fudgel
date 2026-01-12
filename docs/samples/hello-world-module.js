// Module
import { component } from '/fudgel.min.js';

component(
    'hello-world-module',
    {
        template: `Hello {{audience}}!`,
    },
    class {
        audience = 'world';
    }
);
