import { component } from '../../src/fudgel';

component('custom-element', {
    template: '<span id="test">an {{this.internalValue}} {{this.where()}}</span><button @click="this.buttonClicked($event)">Change</button>'
}, class {
    internalValue = 'internal value';

    buttonClicked(event: Event) {
        this.internalValue = `event (${event.type})`;
    }

    where() {
        return 'here';
    }
});

component('multi-bind', {
    template: '<div id="one">{{this.obj.one}}</div><div id="two">{{this.obj.two}}</div>'
}, class {
    obj = {
        one: 'ONE',
        two: 'TWO'
    };
});

describe('text', () => {
    it('replaces text in mustache-like syntax for text nodes and attributes', () => {
        cy.mount('<custom-element></custom-element>');

        cy.get('#test').should('have.text', 'an internal value here');
        cy.get('button').click();
        cy.get('#test').should('have.text', 'an event (click) here');
    });
    it('works with multiple binds to the same object', () => {
        cy.mount('<multi-bind></multi-bind>');
        cy.get('#one').should('have.text', 'ONE');
        cy.get('#two').should('have.text', 'TWO');
    });
});
