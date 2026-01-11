// Module
import { component } from '/fudgel.min.js';

component(
    'my-custom-component',
    {
        template: `Hello {{audience}}!`,
    },
    class {
        audience = 'world';
    }
);
