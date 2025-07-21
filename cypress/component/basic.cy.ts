import { component, html } from '../../src/fudgel.js';

component('custom-element', {
    template: html`Success`,
});

component('custom-element-shadow', {
    template: html`Success`,
    useShadow: true,
});

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<custom-element></custom-element>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element').should('have.text', 'Success');
    });
});

describe('with shadow', () => {
    beforeEach(() => {
        cy.mount('<custom-element-shadow></custom-element-shadow>');
    });

    it('loads the page and works with a simple template', () => {
        cy.get('custom-element-shadow').shadow().should('have.text', 'Success');
    });
});

component(
    'show-list',
    {
        template: html`
            <button *if="allowChange" @click="change()" id="change">
                Change list
            </button>
            <ul *for="item of list">
                <li id="item_{{item.id}}">{{item.id}}: {{item.name}}</li>
            </ul>
        `,
    },
    class {
        list = [
            { id: 1, name: 'One' },
            { id: 2, name: 'Two' },
        ];
        allowChange = true;

        change() {
            this.list = [
                { id: 3, name: 'Three' },
                { id: 4, name: 'Four' },
                { id: 5, name: 'Five' },
            ];
            this.allowChange = false;
        }
    }
);

describe('with a list', () => {
    beforeEach(() => {
        cy.mount('<show-list></show-list>');
    });

    it('displays the right items in the list', () => {
        cy.get('#item_1').should('have.text', '1: One');
        cy.get('#item_2').should('have.text', '2: Two');
    });

    it('changes the list when the button is clicked', () => {
        cy.get('#change').click();
        cy.get('#item_3').should('have.text', '3: Three');
        cy.get('#item_4').should('have.text', '4: Four');
        cy.get('#item_5').should('have.text', '5: Five');
        cy.get('#item_1').should('not.exist');
        cy.get('#item_2').should('not.exist');
        cy.get('#change').should('not.exist');
    });
});

component(
    'interpolation-test',
    {
        // This is intentionally split on multiple lines
        template: html`
            {{
                message
            }}
        `,
    },
    class {
        message = 'correct'
    }
);

describe('interpolation', () => {
    it('displays the right message', () => {
        cy.mount('<interpolation-test></interpolation-test>');
        cy.get('interpolation-test').should('contain.text', 'correct');
    });
});
