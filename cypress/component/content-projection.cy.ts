import { component } from '../../src/fudgel';

component('parent-element', {
    template: '<child-element>{{this.name}}<span slot="moo">Moo</span></child-element>',
}, class {
    name = 'parent';
});

component('child-element', {
    template: '<div id="namedSlot" style="border: 1px solid red"><slot name="moo">Default</slot></div><div id="unnamedSlot" style="border: 2px solid blue"><slot></slot></div>'
}, class {
    name = 'child';
});

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<parent-element></parent-element>');
    });

    it('projects content into slots', () => {
        cy.get('#namedSlot').find('slot').then((element) => {
            expect(element[0].assignedElements()[0].textContent).to.equal('Moo');
        });

        // The interpretation of the parent's template should be done in the parent.
        cy.get('#unnamedSlot').find('slot').then((element) => {
            expect(element[0].assignedNodes()[0].textContent).to.equal('parent');
        });
    });
});
