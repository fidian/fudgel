import { component } from '../../src/';

component('test-element', {
    template:
        '<button @click="this.value = !this.value">Toggle</button><span id="truthy" *if="this.value">YES</span><span id="falsy" *if="!this.value">NO</span>',
});

describe('if', () => {
    beforeEach(() => {
        cy.mount('<test-element></test-element>');
    });

    it('toggles based on an internal value', () => {
        cy.get('#truthy').should('not.exist');
        cy.get('#falsy').should('exist');
        cy.get('button').click();
        cy.get('#truthy').should('exist');
        cy.get('#falsy').should('not.exist');
        cy.get('button').click();
        cy.get('#truthy').should('not.exist');
        cy.get('#falsy').should('exist');
    });
});
