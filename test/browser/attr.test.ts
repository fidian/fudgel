import { describe, it } from 'vitest';
import { component, html } from '../../src/fudgel.js';
import { click, expectAttr, expectText, mount } from '../support/dom.js';

component(
    'custom-element',
    {
        template: html`
            <span id="test" class="a {{internalValue}} c"
                ><button @click="buttonClicked($event)">Change</button></span
            >
        `,
    },
    class {
        internalValue = 'b';

        buttonClicked(_event: Event) {
            this.internalValue = `BBB`;
        }
    }
);

component(
    'test-true',
    { template: '<input id="test" type="text" disabled="{{disabled}}">' },
    class {
        disabled = true;
    }
);

component(
    'test-false',
    { template: '<input id="test" type="text" disabled="{{disabled}}">' },
    class {
        disabled = false;
    }
);

component(
    'the-child',
    {
        attr: ['test', 'childValue'],
        template: html`
            <div id="test">{{test}}</div>
            <div id="childValue">{{childValue}}</div>
            <button @click="buttonClicked()">Update</button>
        `,
    },
    class {
        test = 'value before init';
        childValue = 'value before attr';

        buttonClicked() {
            this.test = 'test-update';
            this.childValue = 'child-value-update';
        }
    }
);

describe('attr', () => {
    it('replaces text in mustache-like syntax for attributes', async () => {
        await mount('<custom-element></custom-element>');
        await expectAttr('#test', 'class', 'a b c fudgel_custom-element');
        await click('button');
        await expectAttr('#test', 'class', 'a BBB c fudgel_custom-element');
    });

    it('uses camelCase attributes', async () => {
        await mount('<the-child test="TEST" child-value="Ok"></the-child>');
        await expectText('#test', 'TEST');
        await expectText('#childValue', 'Ok');
        await click('button');
        await expectText('#test', 'test-update');
        await expectText('#childValue', 'child-value-update');
        await expectAttr('the-child', 'test', 'test-update');
        await expectAttr('the-child', 'child-value', 'child-value-update');
    });

    it('sets true as empty string for attributes', async () => {
        await mount('<test-true></test-true>');
        await expectAttr('#test', 'disabled', '');
    });

    it('removes attributes set as false', async () => {
        await mount('<test-false></test-false>');
        await expectAttr('#test', 'disabled', null);
    });
});
