import { component, html } from '../../src/fudgel.js';

component('custom-element', {
    template: html`Success`,
});

component('custom-element-shadow', {
    template: html`Success`,
    useShadow: true
});

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<custom-element></custom-element>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element').should('have.text', 'Success');
    });
});

describe('with shadow', () => {
    beforeEach(() => {
        cy.mount('<custom-element-shadow></custom-element-shadow>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element-shadow').shadow().should('have.text', 'Success');
    });
});
