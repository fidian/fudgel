import { component } from '../../src/';

component('custom-element', {
    template: '<span id="test" class="another {{this.internalValue}} over here">an {{this.internalValue}} {{this.where()}}</span><button @click="this.buttonClicked($event)">Click to change</button>'
}, class {
    internalValue = 'internal value';

    buttonClicked(event: Event) {
        this.internalValue = `event (${event.type})`;
    }

    where() {
        return 'here';
    }
});

describe('text and attr', () => {
    beforeEach(() => {
        cy.mount('<custom-element></custom-element>');
    });

    it('replaces text in mustache-like syntax for text nodes and attributes', () => {
        // Initial binding for text
        cy.get('#test').should('have.text', 'an internal value here');

        // Initial binding for attribute
        cy.get('#test').should('have.attr', 'class', 'another internal value over here');

        cy.get('button').click();

        // The setter was called
        cy.get('#test').should('have.text', 'an event (click) here');
    });
});
