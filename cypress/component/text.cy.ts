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

describe('text', () => {
    it('replaces text in mustache-like syntax for text nodes and attributes', () => {
        cy.mount('<custom-element></custom-element>');

        cy.get('#test').should('have.text', 'an internal value here');
        cy.get('button').click();
        cy.get('#test').should('have.text', 'an event (click) here');
    });
});
