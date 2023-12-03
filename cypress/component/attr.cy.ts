import { attr, component } from '../../src/fudgel';

component('custom-element', {
    template: '<span id="test" class="a {{this.internalValue}} c"><button @click="this.buttonClicked($event)">Change</button>'
}, class {
    internalValue = 'b';

    buttonClicked(event: Event) {
        this.internalValue = `BBB`;
    }
});

component('the-child', {
    template: '<div id="test">{{this.test}}</div><div id="childValue">{{this.childValue}}</div><button @click="this.buttonClicked()">Update</button>'
}, class {
    test = 'value before init';
    childValue = 'value before attr';

    constructor() {
        attr(this, 'test');
        attr(this, 'childValue');
    }

    buttonClicked() {
        this.test = 'test-update';
        this.childValue = 'child-value-update';
    }
});

describe('attr', () => {
    it('replaces text in mustache-like syntax for attributes', () => {
        cy.mount('<custom-element></custom-element>');
        cy.get('#test').should('have.attr', 'class', 'a b c');
        cy.get('button').click();
        cy.get('#test').should('have.attr', 'class', 'a BBB c');
    });

    it('uses camelCase attributes', () => {
        cy.mount('<the-child test="TEST" child-value="Ok"></the-child>');
        cy.get('#test').should('have.text', 'TEST');
        cy.get('#childValue').should('have.text', 'Ok');
        cy.get('button').click();
        cy.get('#test').should('have.text', 'test-update');
        cy.get('#childValue').should('have.text', 'child-value-update');
        cy.get('the-child').should('have.attr', 'test', 'test-update');
        cy.get('the-child').should('have.attr', 'child-value', 'child-value-update');
    });
});
