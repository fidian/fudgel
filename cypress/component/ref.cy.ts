import { Component, component } from '../../src/fudgel.js';

component('test-element', {
    template:
        '<div #ref="child"></div><span id="name">{{child.nodeName}}</span>',
});

describe('ref', () => {
    beforeEach(() => {
        cy.mount('<test-element></test-element>');
    });

    it('creates a reference', () => {
        cy.get('#name').should('have.text', 'DIV');
    });
});
