// TypeScript with decorators
import { Component } from '/fudgel.min.js';

@Component(
    'my-custom-component',
    {
        template: `Hello {{audience}}`,
    }
)
export class MyCustomComponent {
    audience = 'world';
}
