import { component } from '../../src/fudgel.js';
import { getScope } from '../../src/scope.js';

// Verifies that the scope created for *if doesn't interfere with binding to
// the scope from *for and used for the text replacement.
component('test-update', {
    template: `
    <p>Click on an list item to move it to the bottom of the other list.</p>
    <p>First list</p>
    <ul id="first">
        <li *for="item of listOne" @click="moveItem(item,'listTwo')">
            <span *if="item">{{item.name}}</span>
        </li>
    </ul>
    <p>Second list</p>
    <ul id="second">
        <li *for="item of listTwo" @click="moveItem(item,'listOne')">
            <span *if="item">{{item.name}}</span>
        </li>
    </ul>
    `
}, class {
    listOne = [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }];
    listTwo = [{ name: 'Item 4' }, { name: 'Item 5' }];

    moveItem(item: any, targetListName: string) {
        const listOne = this.listOne.filter(i => i !== item);
        const listTwo = this.listTwo.filter(i => i !== item);
        const targetList = targetListName === 'listOne' ? listOne : listTwo;
        targetList.push(item);
        this.listOne = listOne;
        this.listTwo = listTwo;
    }
});

component('bleed-parent', {
    template: `
        This should say pass on each line<br>
        <div *for="item of list" class="test{{item}}">{{item}} - <bleed-child></bleed-child></div>
    `
}, class {
    list = ['A'];
    onViewInit() {
        setTimeout(() => {
            this.list = ['A', 'B'];
        });
    }
});

component('bleed-child', {
    template: '<span>{{item}}</span>'
}, class {
    item = 'pass'
});

describe('scope', () => {
    it('updates correctly when an item in the list is changed with nested scopes', () => {
        cy.mount('<test-update></test-update>');
        cy.get('ul#first li:nth-child(1)').should('contain.text', 'Item 1');
        cy.get('ul#first li:nth-child(2)').should('contain.text', 'Item 2');
        cy.get('ul#first li:nth-child(3)').should('contain.text', 'Item 3');
        cy.get('ul#second li:nth-child(1)').should('contain.text', 'Item 4');
        cy.get('ul#second li:nth-child(2)').should('contain.text', 'Item 5');
        cy.get('ul#first li:nth-child(2)').click();
        cy.get('ul#first li:nth-child(1)').should('contain.text', 'Item 1');
        cy.get('ul#first li:nth-child(2)').should('contain.text', 'Item 3');
        cy.get('ul#second li:nth-child(1)').should('contain.text', 'Item 4');
        cy.get('ul#second li:nth-child(2)').should('contain.text', 'Item 5');
        cy.get('ul#second li:nth-child(3)').should('contain.text', 'Item 2');
    });
    it('does not allow bleeding of scope values', () => {
        cy.mount('<bleed-parent></bleed-parent>');
        cy.get('div.testA').should('have.text', 'A - pass');
        cy.get('div.testB').should('have.text', 'B - pass');
    });
});
