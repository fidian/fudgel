import { describe, it } from 'vitest';
import { Component, component, html, update } from '../../src/fudgel.js';
import { click, expectText, expectValue, mount, $$ } from '../support/dom.js';

@Component('show-prop', { prop: ['prop'], template: '{{prop}}' })
class ShowProp {
    prop = 'not yet replaced';
}

component('test-string', { template: '<show-prop .prop="\'some value\'"></show-prop>' });

component(
    'test-async',
    { template: '<show-prop .prop="value"></show-prop>' },
    class {
        value = 'before-update';

        onViewInit() {
            setTimeout(() => (this.value = 'after-update'));
        }
    }
);

@Component('test-scope-item', { prop: ['prop'], template: 'Item: {{propName}}' })
class TestScopeItem {
    prop: { name: string } | undefined;
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
    class TestScope {
        list: { name: string }[] = [];
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

@Component('test-update-child', { prop: ['childValue'], template: '{{childValue}}' })
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

// Every test-scope-item's text, joined, like Cypress's have.text on a set
const items = () => $$('test-scope-item').map(e => e.textContent).join('');

describe('prop', () => {
    it('assigns a string property', async () => {
        await mount('<test-string></test-string>');
        await expectText('show-prop', 'some value');
    });

    it('shows updates to a class property', async () => {
        await mount('<test-async></test-async>');
        await expectText('show-prop', 'after-update');
    });

    it('shows items from a list', async () => {
        await mount('<test-scope></test-scope>');
        await expectValue(items, 'Item: after-update');

        // Add a second item
        await click('#updateList');
        await expectValue(items, 'Item: after-updateItem: second-item');

        // Update the first item and manually redraw, but this does not update
        // the label.
        await click('#updateName');
        await expectValue(items, 'Item: after-updateItem: second-item');

        // Update everything in all components
        await click('#updateAll');
        await expectValue(items, 'Item: updatedNameItem: second-item');
    });

    it('triggers onUpdate', async () => {
        await mount('<test-update-parent></test-update-parent>');
        await expectText('test-update-child', 'fromParent');
        await click('button');
        await expectText('test-update-child', 'afterUpdate');
    });
});

@Component('delayed-child', {
    prop: ['theString'],
    style: `
        :host {
            display: block;
            border: 1px solid black;
            padding: 10px;
        }
    `,
    template: '{{theString}}',
})
class DelayedChildComponent {}

@Component('delayed-parent', {
    prop: ['theString'],
    style: `
        :host {
            display: block;
            border: 1px solid red;
            padding: 10px;
        }
    `,
    template: '<delayed-child .the-string="theString"></delayed-child>',
})
class DelayedParentComponent {}

@Component('delayed-grandparent', {
    template: `
        <button @click="update()">Update</button> - Value: {{theString}}<br />
        <delayed-parent .the-string="theString"></delayed-parent>
    `,
})
class DelayedGrandparentComponent {
    theString = 'initial';
    update() {
        this.theString = 'updated';
    }
}

describe('delayed prop updates', () => {
    it('updates a prop in a child component after the parent updates', async () => {
        await mount('<delayed-grandparent></delayed-grandparent>');
        await expectText('delayed-child', 'initial');
        await click('button');
        await expectText('delayed-child', 'updated');
    });
});
