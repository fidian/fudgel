import { component, events, metadata } from '/fudgel.min.js';

class LifecycleGlobalEvents {
    name = 'Developer';
}

events.on('init', controllerInstance => {
    if (controllerInstance instanceof LifecycleGlobalEvents) {
        setTimeout(() => {
            controllerInstance.name = 'Super Developer';
        }, 5000);
    }
});

component(
    'lifecycle-global-events',
    {
        template: `
        Hello {{name}}, welcome to Fudgel!
    `,
    },
    LifecycleGlobalEvents
);
