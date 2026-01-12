import { component, events } from '/fudgel.min.js';

events.on(
    'component',
    (customElement, controllerClass, customElementConfig) => {
        console.log(`Component defined:`, {
            customElement,
            controllerClass,
            customElementConfig,
        });
    }
);

component('events-component', {
    template: `This component is defined!`,
});

// Check your console for the log message
