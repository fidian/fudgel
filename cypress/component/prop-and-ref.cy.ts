import { Component, component, Prop } from '../../src/';

component('test-parent', {
    template:
        '<test-child #ref="child" .some-prop="\'some value\'"></test-child><span id="childName">{{this.child.nodeName}}</span>',
});

@Component('test-child', {
    template: '{{this.someProp}}',
})
class PropTest {
    @Prop() someProp = 'not yet replaced';
    thisIsPropTest() {}
}

describe('prop and ref', () => {
    beforeEach(() => {
        cy.mount('<test-parent></test-parent>');
    });

    it('assigns a property and handles a reference', () => {
        cy.get('test-child').shadow().should('have.text', 'some value');
        cy.get('#childName').should('have.text', 'TEST-CHILD');
    });
});
