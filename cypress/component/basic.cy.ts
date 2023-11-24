import { component } from '../../src/';

component('custom-element', {
    template: 'Success'
});

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<custom-element></custom-element>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element').should('have.text', 'Success');
    });
});