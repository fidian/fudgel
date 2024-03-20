import { Component, component, html, update } from '../../src/fudgel.js';

@Component('show-prop', {
    prop: ['prop'],
    template: '{{prop}}',
})
class ShowProp {
    prop = 'not yet replaced';
}

component('test-string', {
    template: '<show-prop .prop="\'some value\'"></show-prop>',
});

component(
    'test-async',
    {
        template: '<show-prop .prop="value"></show-prop>',
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
    prop: ['prop'],
    template: 'Item: {{propName}}',
})
class TestScopeItem {
    prop;
    propName = 'no prop set';
    onChange() {
        this.propName = this.prop ? this.prop.name : 'no prop set';
    }
}

component(
    'test-scope',
    {
        template: html`<test-scope-item
                *for="list"
                .prop="value"
            ></test-scope-item
            ><button id="updateList" @click.stop.prevent="updateList()">
                updateList</button
            ><button id="updateName" @click="updateName()">updateName</button
            ><button id="updateAll" @click="updateAll()">updateAll</button>`,
    },
    class {
        list = [];
        name = 'test-scope';

        onInit() {
            setTimeout(() => (this.list = [{ name: 'after-update' }]));
        }

        updateAll() {
            // This function is exposed by Fudgel to redraw all components.
            update();
        }

        updateList() {
            this.list[0].name = 'updatedName';
            this.list = [...this.list, { name: 'second-item' }];
        }

        updateName() {
            // This updates a deeply nested property, which does not trigger a
            // redraw.
            this.list[0].name = 'updatedName';
            // Only trigger an update of this one component, which also doesn't
            // redraw the label.
            update(this);
        }
    }
);

@Component('test-update-child', {
    prop: ['childValue'],
    template: '{{childValue}}',
})
class TestUpdateChildComponent {
    childValue = 'initialValue';
}

@Component('test-update-parent', {
    template:
        '<button @click="update()">Update</button><test-update-child .child-value="value"></test-update-child>',
})
class TestUpdateParentComponent {
    value = 'fromParent';

    update() {
        this.value = 'afterUpdate';
    }
}

describe('prop', () => {
    it('assigns a string property', () => {
        cy.mount('<test-string></test-string>');
        cy.get('show-prop').should('have.text', 'some value');
    });
    it('shows updates to a class property', () => {
        cy.mount('<test-async></test-async>');
        cy.get('show-prop').should('have.text', 'after-update');
    });
    it('shows items from a list', () => {
        cy.mount('<test-scope></test-scope>');
        cy.get('test-scope-item').should('have.text', 'Item: after-update');

        // Add a second item
        cy.get('#updateList').click();
        cy.get('test-scope-item').should(
            'have.text',
            'Item: after-updateItem: second-item'
        );

        // Update the first item and manually redraw, but this does not update
        // the label.
        cy.get('#updateName').click();
        cy.get('test-scope-item').should(
            'have.text',
            'Item: after-updateItem: second-item'
        );

        // Update everything in all components
        cy.get('#updateAll').click();
        cy.get('test-scope-item').should(
            'have.text',
            'Item: updatedNameItem: second-item'
        );
    });
    it('triggers onUpdate', () => {
        cy.mount('<test-update-parent></test-update-parent>');
        cy.get('test-update-child').should('have.text', 'fromParent');
        cy.get('button').click();
        cy.get('test-update-child').should('have.text', 'afterUpdate');
    });
});
