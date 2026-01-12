import { component } from './fudgel.min.js';

component('directive-ref', {
    template: `
        <input type="text" #ref="inputField">
        <button @click="focus()">Focus the input</button>
    `
}, class {
    inputField = null; // This will be the HTMLInputElement

    focus() {
        this.inputField?.focus();
    }
});
