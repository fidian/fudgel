import { component, css, html } from '../../src/fudgel.js';
import { scopeStyle } from '../../src/component.js';
import { sandboxStyleRules } from '../../src/elements.js';

// fudgel-0
component('shadow-root', {
    style: css`
        :host {
            padding: 10px;
            border: 10px solid red;
            display: block;
        }
    `,
    template: html`
        <div>Shadow root element</div>
        <parent-element></parent-element>
    `,
    useShadow: true
});

// fudgel-1
component(
    'parent-element',
    {
        style: css`
            :host {
                padding: 10px;
                border: 10px solid blue;
                display: block;
            }
        `,
        template: html`
            <div>Parent has a blue border</div>
            <child-element *for="item of items" item="{{item}}"></child-element>
        `,
    },
    class {
        items = ['item 1', 'item 2', 'item 3'];
    }
);

// fudgel-2
component('child-element', {
    attr: ['item'],
    style: css`
        :host {
            padding: 10px;
            border: 10px solid green;
            display: block;
        }
    `,
    template: html` <div>Child element -- {{item}}</div> `,
});

describe('style-elements', () => {
    beforeEach(() => {
        cy.mount(
            '<parent-element></parent-element><shadow-root></shadow-root>'
        );
    });

    it('only adds style rules once for each element', () => {
        cy.get('body > style.fudgel-0').should('have.length', 0);
        cy.get('body > style.fudgel-1').should('have.length', 1);
        cy.get('body > style.fudgel-2').should('have.length', 1);
        cy.get('shadow-root').shadow().find('style').should('have.length', 3);

        // 2 in main document
        // 3 in shadow root
        cy.get('style').should('have.length', 5);
    });
});
