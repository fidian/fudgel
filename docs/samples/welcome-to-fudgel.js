import { component } from '/fudgel.min.js';

component('welcome-to-fudgel', {
    template: `
        Hello {{name}}, welcome to Fudgel!
    `
}, class MyCustomElement {
    name = "Developer"

    onInit() {
        setTimeout(() => this.name = 'Super Developer', 5000);
    }
});
