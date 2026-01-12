import { component, metadata } from '/fudgel.min.js';

component('lifecycle-controller-events', {
    template: `
        Hello {{name}}, welcome to Fudgel!
    `
}, class {
    name = "Developer"

    constructor() {
        this[metadata].events.on('init', () => {
            setTimeout(() => this.name = 'Super Developer', 5000);
        });
    }
});
