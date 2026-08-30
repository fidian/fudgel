// TypeScript with decorators
import { Component } from '/fudgel.min.js';

@Component(
    'hello-world-typescript',
    {
        template: `Hello {{audience}}!`,
    }
)
class MyCustomComponent {
    audience = 'world';
}
