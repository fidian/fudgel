import { Component, html } from '../../src/fudgel.js';

@Component('decorated-element', {
    template: html`<span id="value">{{value}}</span>`,
})
class DecoratedController {
    static origin = 'controller';
    value = 'from the controller';

    describe() {
        return this.value;
    }
}

describe('the Component decorator', () => {
    it('defines a working custom element', () => {
        cy.mount('<decorated-element></decorated-element>');
        cy.get('#value').should('have.text', 'from the controller');
    });

    it('leaves the decorated name bound to the controller', () => {
        // component() returns the custom element it defined, which is a
        // different class. A decorator returning that would rebind the name to
        // the wrong thing, and TypeScript rejects it outright -- see
        // type-tests/decorator.ts.
        expect(DecoratedController.origin).to.equal('controller');
        expect(new DecoratedController().describe()).to.equal(
            'from the controller'
        );
    });

    it('does not replace the controller with the custom element', () => {
        const element = customElements.get('decorated-element');

        expect(element).to.not.equal(DecoratedController);
        expect(new DecoratedController()).to.not.be.instanceOf(HTMLElement);
    });
});
