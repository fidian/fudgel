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

component('nested-component', {
    attr: ['id'],
    template: `nested ID {{id}}`
});

component('test-for-if-routed', {
    template: `
        <div>Router enabled</div>
        <app-router>
            <div path="**">
                <div *for="item of list">
                    <nested-component *if="item.show" id="{{item.name}}">
                    </nested-component>
                </div>
            </div>
        </app-router>
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

component('test-for-if-routed-delayed', {
    template: 'Delaying'
}, class {
    onViewInit() {
        setTimeout(() => {
            const root = rootElement(this);

            if (root) {
                // Note, this would wipe out styles. Avoid setting innerHTML.
                root.innerHTML = '<test-for-if-routed></test-for-if-routed>';
            }
        }, 1);
    }
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

    it('works with nesting through routing', () => {
        cy.mount('<test-for-if-routed-delayed></test-for-if-routed-delayed>');
        cy.get('#first').should('exist');
        cy.get('#second').should('not.exist');
        cy.get('#third').should('exist');
    });
});
