import { component, html } from '../../src/fudgel';

component('custom-element', {
    template: html`Success`,
});

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<custom-element></custom-element>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element').shadow().should('have.text', 'Success');
    });
});
