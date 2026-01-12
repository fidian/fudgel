import { component, events } from '/fudgel.min.js';

events.on(
    'component',
    (customElement, controllerConstructor, customElementConfig) => {
        // Patch the custom element's connectedCallback
        const oldConnectedCallback = customElement.prototype.connectedCallback;
        customElement.prototype.connectedCallback = function () {
            console.log(`Added to DOM`);
            oldConnectedCallback.call(this);
            console.log(
                'Done with connectedCallback processing'
            );
        };
    }
);

component(
    'events-component-add-logging',
    {
        template: `This component is defined!`,
    },
    class {
        onInit() {
            console.log('init is called');
        }
        onParse() {
            console.log('parse is called');
        }
        onViewInit() {
            console.log('view init is called');
        }
    }
);
