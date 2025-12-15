import { component, defineRouterComponent, rootElement } from '../../src/fudgel.js';

defineRouterComponent('app-router');

component('test-element', {
    template:
        '<button @click="toggle()">Toggle</button><span id="truthy" *if="value">YES</span><span id="falsy" *if="!value">NO</span>',
}, class {
    value = false;

    toggle() {
        this.value = !this.value;
    }
});

component('test-undefined', {
    template:
        '<span id="wrong" *if="x">WRONG</span><span id="right" *if="!x">RIGHT</span>'
});

component('test-for-if', {
    template: `
        <div *for="item of list">
            <div *if="item.show" id="{{item.name}}">
                {{item.name}}
            </div>
        </div>
    `
}, class {
    list = [ {
        show: true,
        name: "first"
    }, {
        show: false,
        name: "second"
    }, {
        show: true,
        name: "third"
    }];
});

describe('if', () => {
    it('toggles based on an internal value', () => {
        cy.mount('<test-element></test-element>');
        cy.get('#falsy').should('exist');
        cy.get('#truthy').should('not.exist');
        cy.get('button').click();
        cy.get('#truthy').should('exist');
        cy.get('#falsy').should('not.exist');
        cy.get('button').click();
        cy.get('#truthy').should('not.exist');
        cy.get('#falsy').should('exist');
    });

    it('handles undefined', () => {
        cy.mount('<test-undefined></test-undefined>');
        cy.get('#right').should('exist');
        cy.get('#wrong').should('not.exist');
    });

    it('works with nesting and direct mounting', () => {
        cy.mount('<test-for-if></test-for-if>');
        cy.get('#first').should('exist');
        cy.get('#second').should('not.exist');
        cy.get('#third').should('exist');
    });
});
