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
