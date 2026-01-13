import { component, metadata } from '/fudgel.min.js';

component('utility-metadata-element', {
    template: '<child-element></child-element>',
    useShadow: true
}, class {
    // Called from child element
    logMessage(message) {
        console.log('Parent:', message);
    }
});

component('child-element', {
    template: `
        <button @click="clicked()">Click me to log in parent</button>
    `,
    useShadow: true
}, class {
    clicked() {
        // Get the actual DOM element (not rootElement)
        const childElement = this[metadata].host;

        if (!childElement) {
            console.error('Child element not in DOM');
            return;
        }

        const parentElement = this.closest('parent-element', childElement);

        if (!parentElement) {
            console.error('Could not find parent element in DOM');
            return;
        }

        const parentController = parentElement[metadata];

        if (!parentController) {
            console.error('Could not find parent controller');
            return;
        }

        parentController.logMessage('Hello from child');
    }

    // Pierce the shadow DOM layers to get the parent element.
    closest(selector, el) {
        return (
            (el !== document && el !== window && el.closest(selector)) ||
            this.closest(selector, el.getRootNode().host)
        );
    }
});
