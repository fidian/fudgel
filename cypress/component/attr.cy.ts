import { component } from '../../src/fudgel.js';

component('custom-element', {
    template: '<span id="test" class="a {{internalValue}} c"><button @click="buttonClicked($event)">Change</button>'
}, class {
    internalValue = 'b';

    buttonClicked(event: Event) {
        this.internalValue = `BBB`;
    }
});

component('test-true', {
    template: '<input id="test" type="text" disabled="{{disabled}}">'
}, class {
    disabled = true;
});

component('test-false', {
    template: '<input id="test" type="text" disabled="{{disabled}}">'
}, class {
    disabled = false;
});

component('the-child', {
    attr: ['test', 'childValue'],
    template: '<div id="test">{{test}}</div><div id="childValue">{{childValue}}</div><button @click="buttonClicked()">Update</button>'
}, class {
    test = 'value before init';
    childValue = 'value before attr';

    buttonClicked() {
        this.test = 'test-update';
        this.childValue = 'child-value-update';
    }
});

describe('attr', () => {
    it('replaces text in mustache-like syntax for attributes', () => {
        cy.mount('<custom-element></custom-element>');
        cy.get('#test').should('have.attr', 'class', 'a b c fudgel-0');
        cy.get('button').click();
        cy.get('#test').should('have.attr', 'class', 'a BBB c fudgel-0');
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

    it('sets true as empty string for attributes', () => {
        cy.mount('<test-true></test-true>');
        cy.get('#test').should('have.attr', 'disabled');
    });

    it('removes attributes set as false', () => {
        cy.mount('<test-false></test-false>');
        cy.get('#test').should('not.have.attr', 'disabled');
    });
});
