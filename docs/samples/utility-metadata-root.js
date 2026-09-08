import { component, metadata } from '/fudgel.min.js';

component(
    'utility-metadata-root',
    {
        template: 'Wait for it ...',
    },
    class {
        onViewInit() {
            setTimeout(() => {
                // The root is where the template was placed: the shadow root
                // when using one, otherwise the custom element itself.
                this[metadata].root.innerHTML = 'Hello, World!';
            }, 1000);
        }
    }
);
