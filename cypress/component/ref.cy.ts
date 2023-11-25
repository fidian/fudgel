import { Component, component, Prop } from '../../src/';

component('test-element', {
    template:
        '<div #ref="child"></div><span id="name">{{this.child.nodeName}}</span>',
});

describe('ref', () => {
    beforeEach(() => {
        cy.mount('<test-element></test-element>');
    });

    it('creates a reference', () => {
        cy.get('#name').should('have.text', 'DIV');
    });
});
