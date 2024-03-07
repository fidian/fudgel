import { component, css, html } from '../../src/fudgel.js';

component('parent-element', {
    style: css`
    :scope {
        background-color: blue;
        padding: 10px;
        display: block;
    }

    div {
        background-color: green;
    }
    `,
    template: html`
    <div>This should be green</div>
    <child-element></child-element>
    `
});
component('child-element', {
    style: css`
    :scope, a
    , b{
        background-color: white;
        padding: 10px;
        display: block;
    }

    div.red {
        background-color: red;
    }
    `,
    template: html`
    <div class="white">This should be white</div>
    <div class="red">This should be red</div>
    `
});

describe('css', () => {
    beforeEach(() => {
        cy.mount('<parent-element></parent-element>');
    });
    it('verifies the background colors', () => {
        cy.get('parent-element').should('have.css', 'background-color', 'rgb(0, 0, 255)');
        cy.get('parent-element div').should('have.css', 'background-color', 'rgb(0, 128, 0)');
        cy.get('child-element').should('have.css', 'background-color', 'rgb(255, 255, 255)');
        cy.get('child-element div.white').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');
        cy.get('child-element div.red').should('have.css', 'background-color', 'rgb(255, 0, 0)');
    });
});
