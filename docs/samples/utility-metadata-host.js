import { component, metadata } from './fudgel.min.js';

component(
    'utility-metadata-host',
    {
        template: 'Inspect the DOM and notice the attribute value changing.',
        useShadow: true,
    },
    class {
        onViewInit() {
            let count = 0;
            this.interval = setInterval(() => {
                this[metadata].host.setAttribute('data-attribute', count++);
            }, 1000);
        }
        onDestroy() {
            clearInterval(this.interval);
        }
    }
);
