import {
    Component,
    html,
    metadataControllerElement,
} from '../../src/fudgel.js';

const date = new Date();

@Component('custom-element', {
    template: html`
        <p>
            Boolean: <span id="booleanPass" *if="true">ok</span>
            <span id="booleanFail" *if="false">WRONG</span>
        </p>
        <p>
            ===:
            <span id="tripleEqualsPass" *if="key === properties.testProperty"
                >ok</span
            >
            <span id="tripleEqualsFail" *if="key !== properties.testProperty"
                >WRONG</span
            >
        </p>
        <p>
            Function call:
            <span id="functionCallPass" *if="returnValue(true)">ok</span>
            <span id="functionCallFail" *if="returnValue(false)">WRONG</span>
        </p>
    `,
})
class CustomElement {
    key = 'test';
    properties = {
        testProperty: 'test',
    };

    returnValue(value) {
        return value;
    }
}

describe('jsep', () => {
    it('works', () => {
        cy.mount(
            `<custom-element></custom-element>`
        );
        cy.get('#booleanPass').should('have.text', 'ok');
        cy.get('#booleanFail').should('not.exist');
        cy.get('#tripleEqualsPass').should('have.text', 'ok');
        cy.get('#tripleEqualsFail').should('not.exist');
        cy.get('#functionCallPass').should('have.text', 'ok');
        cy.get('#functionCallFail').should('not.exist');
    });
});
