import { component } from '../../src/fudgel';

component('test-element', {
    template:
        '<button @click="this.value = !this.value">Toggle</button><span id="truthy" *if="this.value">YES</span><span id="falsy" *if="!this.value">NO</span>',
});

component('test-undefined', {
    template:
        '<span id="wrong" *if="this.x">WRONG</span><span id="right" *if="!this.x">RIGHT</span>'
});

describe('if', () => {
    it('toggles based on an internal value', () => {
        cy.mount('<test-element></test-element>');
        cy.get('#falsy').should('exist');
        cy.get('#truthy').should('not.exist');
        cy.get('button').click();
        cy.get('#truthy').should('exist');
        cy.get('#falsy').should('not.exist');
        cy.get('button').click();
        cy.get('#truthy').should('not.exist');
        cy.get('#falsy').should('exist');
    });

    it('handles undefined', () => {
        cy.mount('<test-undefined></test-undefined>');
        cy.get('#right').should('exist');
        cy.get('#wrong').should('not.exist');
    });
});
