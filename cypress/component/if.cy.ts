import { component } from '../../src/fudgel';

component('test-element', {
    template:
        '<button @click="this.value = !this.value">Toggle</button><span id="truthy" *if="this.value">YES</span><span id="falsy" *if="!this.value">NO</span>',
});

component('test-undefined', {
    template:
        '<span id="wrong" *if="this.x">WRONG</span><span id="right" *if="!this.x">RIGHT</span>'
});

component('test-for-if', {
    template: `
        <div *for="item of this.list">
            <div *if="$scope.item.show" id="{{$scope.item.name}}">
                {{$scope.item.name}}
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

    it.only('works with nesting', () => {
        cy.mount('<test-for-if></test-for-if>');
        cy.get('#first').should('exist');
        cy.get('#second').should('not.exist');
        cy.get('#third').should('exist');
    });
});
