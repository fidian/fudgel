import { Component, component, Prop, update } from '../../src/fudgel';

@Component('show-prop', {
    template: '{{this.prop}}',
})
class ShowProp {
    @Prop() prop = 'not yet replaced';
}

component('test-string', {
    template: '<show-prop .prop="\'some value\'"></show-prop>',
});

component(
    'test-async',
    {
        template: '<show-prop .prop="this.value"></show-prop>',
    },
    class {
        value = 'before-update';

        onViewInit() {
            setTimeout(() => (this.value = 'after-update'));
        }
    }
);

let trackInstance = 0;

@Component('test-scope-item', {
    template: 'Item: {{this.prop ? this.prop.name : "no prop set"}}',
})
class TestScopeItem {
    @Prop()
    prop;

    name = `test-scope-item[${trackInstance++}]`;
}

component(
    'test-scope',
    {
        template:
            '<test-scope-item *for="this.list" .prop="$scope.value"></test-scope-item><button id="updateList" @click.stop.prevent="this.updateList()">updateList</button><button id="updateName" @click="this.updateName()">updateName</button><button id="updateAll" @click="this.updateAll()">updateAll</button>',
    },
    class {
        list = [];
        name = 'test-scope';

        onInit() {
            setTimeout(() => (this.list = [{ name: 'after-update' }]));
        }

        updateAll() {
            update();
        }

        updateList() {
            this.list[0].name = 'updatedName';
            this.list = [...this.list, { name: 'second-item' }];
        }

        updateName() {
            this.list[0].name = 'updatedName';
            update(this);
        }
    }
);

describe('prop', () => {
    it('assigns a string property', () => {
        cy.mount('<test-string></test-string>');
        cy.get('show-prop').shadow().should('have.text', 'some value');
    });
    it('shows updates to a class property', () => {
        cy.mount('<test-async></test-async>');
        cy.get('show-prop').shadow().should('have.text', 'after-update');
    });
    it.only('shows items from a list', () => {
        cy.mount('<test-scope></test-scope>');
        cy.get('test-scope-item')
            .shadow()
            .should('have.text', 'Item: after-update');

        // Add a second item
        cy.get('#updateList').click();
        cy.get('test-scope-item')
            .shadow()
            .should('have.text', 'Item: after-updateItem: second-item');

        // Update the first item and manually redraw, but this does not update
        // the label.
        cy.get('#updateName').click();
        cy.get('test-scope-item')
            .shadow()
            .should('have.text', 'Item: after-updateItem: second-item');

        // Update everything in all components
        cy.get('#updateAll').click();
        cy.get('test-scope-item')
            .shadow()
            .should('have.text', 'Item: updatedNameItem: second-item');
    });
});
