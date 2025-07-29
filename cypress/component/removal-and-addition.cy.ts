import { component, css, defineSlotComponent, html } from '../../src/fudgel.js';

defineSlotComponent();

component('show-slot-shadow', {
    template: '<div>[shadow(<slot></slot>)]</div>',
    useShadow: true,
});

// Uses the slot-like element automatically
component('show-slot-light', {
    template: '<div>[light(<slot-like></slot-like>)]</div>',
});

component(
    'removal-and-addition',
    {
        style: css`
            .hide {
                display: none;
            }
        `,
        template: html`
            <button @click="toggle()">Toggle</button>
            <p>Using "display:none"</p>
            <div id="display-none">
                <show-slot-shadow #class="{hide: hidden}"
                    >display:none</show-slot-shadow
                >
                <show-slot-light #class="{hide: hidden}"
                    >display:none</show-slot-light
                >
            </div>
            <p>Using "if"</p>
            <div id="if">
                <show-slot-shadow *if="!hidden">if</show-slot-shadow>
                <show-slot-light *if="!hidden">if</show-slot-light>
            </div>
            <p>Using removal and reinsertion</p>
            <div #ref="parent" id="removal-and-reinsertion">
                <div #ref="child">
                    <show-slot-shadow>remove-and-reinsert</show-slot-shadow>
                    <show-slot-light>remove-and-reinsert</show-slot-light>
                </div>
            </div>
        `,
    },
    class {
        child?: HTMLElement; // #ref
        childElement?: HTMLElement; // Saved copy
        hidden = false;
        parent?: HTMLElement; // #ref

        toggle() {
            this.hidden = !this.hidden;

            if (this.hidden) {
                this.childElement = this.child;
                this.child?.remove();
            } else {
                this.parent.appendChild(this.childElement!);
            }
        }
    }
);

describe('removal and addition', () => {
    it('removes and adds elements correctly', () => {
        const verifyText = () => {
            cy.log('verifying display:none');
            cy.get('#display-none show-slot-shadow').should(
                'contain.text',
                'display:none'
            );
            cy.get('#display-none show-slot-shadow')
                .shadow()
                .should('contain.text', '[shadow()]');
            cy.get('#display-none show-slot-light').should(
                'contain.text',
                '[light(display:none)]'
            );

            cy.log('verifying *if');
            cy.get('#if show-slot-shadow').should('contain.text', 'if');
            cy.get('#if show-slot-shadow')
                .shadow()
                .should('contain.text', '[shadow()]');
            cy.get('#if show-slot-light').should('contain.text', '[light(if)]');

            cy.log('verifying removal and reinsertion');
            cy.get('#removal-and-reinsertion show-slot-shadow').should(
                'contain.text',
                'remove-and-reinsert'
            );
            cy.get('#removal-and-reinsertion show-slot-shadow')
                .shadow()
                .should('contain.text', '[shadow()]');
            cy.get('#removal-and-reinsertion show-slot-light').should(
                'contain.text',
                '[light(remove-and-reinsert)]'
            );
        };

        cy.mount('<removal-and-addition></removal-and-addition>');
        verifyText();
        cy.get('button').click();
        cy.get('#if show-slot').should('not.exist');
        cy.get('#removal-and-reinsertion show-slot').should('not.exist');
        cy.get('button').click();
        verifyText();
    });
});

component('click-increment', {
    template: `<div @click="increment()" id="click-count">{{count}}</div>`
}, class {
    count = 0;

    increment() {
        this.count += 1;
    }
});

component('show-attr', {
    attr: ['value'],
    template: `<div>attr:{{value}}</div>`
});

component('show-prop', {
    prop: ['value'],
    template: `<div>prop:{{value}}</div>`
});

component('add-remove-attributes', {
    template: `
    <button @click="hideShow()">Hide and Show Counter</button>
    <div #ref="parent">
        <div #ref="child">
            <click-increment></click-increment>
            <show-attr value="ok"></show-attr>
            <show-prop .value="'ok'"></show-prop>
        </div>
    </div>
    <div *if="childElement">HIDDEN</div>
    `
}, class {
    child?: HTMLElement;
    childElement?: HTMLElement;
    parent!: HTMLElement;

    hideShow() {
        if (this.childElement) {
            this.parent.appendChild(this.childElement);
            this.childElement = null;
        } else {
            this.childElement = this.child;
            this.child.remove();
        }
    }
});

describe('adding and removing attributes', () => {
    it('preserves attribute bindings', () => {
        cy.mount('<add-remove-attributes></add-remove-attributes>');
        cy.get('click-increment').should('have.text', '0');
        cy.get('click-increment').click();
        cy.get('click-increment').should('have.text', '1');
        cy.get('show-attr').should('have.text', 'attr:ok');
        cy.get('show-prop').should('have.text', 'prop:ok');
        cy.get('button').click();
        cy.get('click-increment').should('not.exist');
        cy.get('button').click();
        cy.get('click-increment').should('have.text', '0');
        cy.get('click-increment').click();
        cy.get('click-increment').should('have.text', '1');
        cy.get('show-attr').should('have.text', 'attr:ok');
        cy.get('show-prop').should('have.text', 'prop:ok');
    });
});
