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
        <p>
            <button id="triggerUpdate" @click="update()">Update</button>
            <span id="updateCount">{{ updateCount }}</span> updates
        </p>
        <p>
            Looping through items
            <button id="randomize" @click="randomize()">Randomize</button>
        </p>
        <ul>
            <li *for="item of items">{{item.name}} - {{ timesTen(item) }}</li>
        </ul>
    `,
})
class CustomElement {
    items = [
        { name: 'one', random: Math.random() },
        { name: 'two', random: Math.random() },
        { name: 'three', random: Math.random() },
    ];
    key = 'test';
    properties = {
        testProperty: 'test',
    };
    updateCount = 0;

    returnValue(value) {
        return value;
    }

    update() {
        this.updateCount += 1;
    }

    getUpdateCount(multiplier: number) {
        return this.updateCount * multiplier;
    }

    randomize() {
        this.items = this.items.map(item => ({
            ...item,
            random: Math.random(),
        }));
    }

    timesTen(item) {
        return item.random * 10;
    }
}

describe('jsep', () => {
    it('works', () => {
        cy.mount(`<custom-element></custom-element>`);
        cy.get('#booleanPass').should('have.text', 'ok');
        cy.get('#booleanFail').should('not.exist');
        cy.get('#tripleEqualsPass').should('have.text', 'ok');
        cy.get('#tripleEqualsFail').should('not.exist');
        cy.get('#functionCallPass').should('have.text', 'ok');
        cy.get('#functionCallFail').should('not.exist');
        cy.get('#updateCount').should('have.text', '0');
        cy.get('#triggerUpdate').click();
        cy.get('#updateCount').should('have.text', '1');
    });
});
