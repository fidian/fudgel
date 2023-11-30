import { component } from '../../src/fudgel';

component('test-element', {
    template:
        '<button @click="this.changeSize()">Change Size</button><div id="item{{$scope.index}}" *repeat="this.size">Item {{$scope.index}}</div>',
}, class {
    size = 3;
    nextSizes = [5, 3];

    changeSize() {
        const item = this.nextSizes.shift();
        this.nextSizes.push(item);
        this.size = item;
    }
});

describe('repeat', () => {
    beforeEach(() => {
        cy.mount('<test-element></test-element>');
    });

    it('toggles based on an internal value', () => {
        cy.get('test-element').find('div').should('have.length', 3);
        cy.get('#item1').should('have.text', 'Item 1');
        cy.get('#item2').should('have.text', 'Item 2');
        cy.get('#item3').should('have.text', 'Item 3');
        cy.get('button').click();
        cy.get('test-element').find('div').should('have.length', 5);
        cy.get('#item1').should('have.text', 'Item 1');
        cy.get('#item2').should('have.text', 'Item 2');
        cy.get('#item3').should('have.text', 'Item 3');
        cy.get('#item4').should('have.text', 'Item 4');
        cy.get('#item5').should('have.text', 'Item 5');
        cy.get('button').click();
        cy.get('test-element').find('div').should('have.length', 3);
        cy.get('#item1').should('have.text', 'Item 1');
        cy.get('#item2').should('have.text', 'Item 2');
        cy.get('#item3').should('have.text', 'Item 3');
    });
});
