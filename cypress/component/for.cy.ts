import { component } from '../../src/fudgel';

component('test-element-map', {
    template:
        '<button @click="this.swap()">Toggle</button><span id="thing_{{$scope.theKey}}" *for="theKey, theValue of this.value">{{$scope.theKey}} = {{$scope.theValue}}</span>',
}, class {
    value = new Map([['thing1', 'value1'], ['thing2', 'value2']]);
    value2 = new Map([['x1', 'y1'], ['x2', 'y2'], ['x3', 'y3']]);

    swap() {
        const x = this.value;
        this.value = this.value2;
        this.value2 = x;
    }
});

component('test-element-object', {
    template:
        '<button @click="this.swap()">Toggle</button><span id="thing_{{$scope.theKey}}" *for="theKey, theValue of this.value">{{$scope.theKey}} = {{$scope.theValue}}</span>',
}, class {
    value: object = {
        thing1: 'value1',
        thing2: 'value2'
    };
    value2: object = {
        x1: 'y1',
        x2: 'y2',
        x3: 'y3'
    }

    swap() {
        const x = this.value;
        this.value = this.value2;
        this.value2 = x;
    }
});

component('test-change-to-undefined', {
    template: '<ul *if="this.list"><li *for="this.list">{{$scope.value}}</li></ul><button @click="this.removeList(); return false"></button>'
}, class {
    list = ['abc', 123, false, null, true];

    removeList() {
        this.list = undefined;
    }
});

describe('for', () => {
    it('shows a list of things from a map', () => {
        cy.mount('<test-element-map></test-element-map>');
        cy.get('#thing_thing1').should('have.text', 'thing1 = value1');
        cy.get('#thing_thing2').should('have.text', 'thing2 = value2');
        cy.get('button').click();
        cy.get('#thing_x1').should('have.text', 'x1 = y1');
        cy.get('#thing_x2').should('have.text', 'x2 = y2');
        cy.get('#thing_x3').should('have.text', 'x3 = y3');
    });
    it('shows a list of things from an object', () => {
        cy.mount('<test-element-object></test-element-object>');
        cy.get('#thing_thing1').should('have.text', 'thing1 = value1');
        cy.get('#thing_thing2').should('have.text', 'thing2 = value2');
        cy.get('button').click();
        cy.get('#thing_x1').should('have.text', 'x1 = y1');
        cy.get('#thing_x2').should('have.text', 'x2 = y2');
        cy.get('#thing_x3').should('have.text', 'x3 = y3');
    });
    it('removes update hooks when a list is emptied', () => {
        cy.mount('<test-change-to-undefined></test-change-to-undefined>');
        cy.get('button').click();
    });
});
