import { component, metadata } from '/fudgel.min.js';

component('lifecycle-controller-events', {
    template: `
        Hello {{name}}, welcome to Fudgel!
    `
}, class {
    name = "Developer"

    onInit() {
        // this[metadata] is not available in the constructor
        this[metadata].events.on('viewInit', () => {
            setTimeout(() => this.name = 'Super Developer', 5000);
        });
    }
});
