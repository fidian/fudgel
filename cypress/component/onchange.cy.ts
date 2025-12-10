import {
    component,
    Controller,
    elementToController,
    html,
} from '../../src/fudgel.js';

component(
    'test-onchange',
    {
        attr: ['a', 'b'],
        prop: ['b', 'p'],
        template: html`
            <ul>
                <li *for="item of items">{{item}}</li>
            </ul>
        `,
    },
    class {
        items = [];
        onChange(propName, oldValue, newValue) {
            this.items.push(`${propName}: ${oldValue} -> ${newValue}`);
        }
    }
);

component(
    'test-prop',
    {
        template: html` <test-onchange .p="p"></test-onchange> `,
    },
    class {
        p = 'ok';
    }
);

component('test-both-attr', {
    template: html` <test-onchange b="ok"></test-onchange> `,
});

component(
    'test-both-prop',
    {
        template: html` <test-onchange .b="b"></test-onchange> `,
    },
    class {
        b = 'ok';
    }
);

describe('onChange events', () => {
    it('triggers one onChange for attribute only', () => {
        cy.mount('<test-onchange a="ok"></test-onchange>');
        cy.get('li').should('have.length', 1);
        cy.get('li').first().should('have.text', 'a: undefined -> ok');
    });

    it('triggers one onChange for property', () => {
        cy.mount('<test-prop></test-prop>');
        cy.get('li').should('have.length', 1);
        cy.get('li').first().should('have.text', 'p: undefined -> ok');
    });

    it('triggers one onChange for shared via attr', () => {
        cy.mount('<test-both-attr></test-both-attr>');
        cy.get('li').should('have.length', 1);
        cy.get('li').first().should('have.text', 'b: undefined -> ok');
    });

    it('triggers one onChange for shared via prop', () => {
        cy.mount('<test-both-attr></test-both-attr>');
        cy.get('li').should('have.length', 1);
        cy.get('li').first().should('have.text', 'b: undefined -> ok');
    });
});
