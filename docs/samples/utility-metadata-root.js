import { component, rootElement } from './fudgel.min.js';

component(
    'utility-metadata-root',
    {
        template: 'Wait for it ...',
    },
    class {
        onViewInit() {
            setTimeout(() => {
                const element = rootElement(this);

                if (element) {
                    element.innerHTML = 'Hello, World!';
                }
            }, 1000);
        }
    }
);
