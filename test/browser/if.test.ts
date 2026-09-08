import { describe, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { click, expectExists, expectMissing, mount } from '../support/dom.js';

component(
    'test-element',
    {
        template:
            '<button @click="toggle()">Toggle</button><span id="truthy" *if="value">YES</span><span id="falsy" *if="!value">NO</span>',
    },
    class {
        value = false;

        toggle() {
            this.value = !this.value;
        }
    }
);

component('test-undefined', {
    template: '<span id="wrong" *if="x">WRONG</span><span id="right" *if="!x">RIGHT</span>',
});

component(
    'test-for-if',
    {
        template: `
        <div *for="item of list">
            <div *if="item.show" id="{{item.name}}">
                {{item.name}}
            </div>
        </div>
    `,
    },
    class {
        list = [
            { show: true, name: 'first' },
            { show: false, name: 'second' },
            { show: true, name: 'third' },
        ];
    }
);

describe('if', () => {
    it('toggles based on an internal value', async () => {
        await mount('<test-element></test-element>');
        await expectExists('#falsy');
        await expectMissing('#truthy');
        await click('button');
        await expectExists('#truthy');
        await expectMissing('#falsy');
        await click('button');
        await expectMissing('#truthy');
        await expectExists('#falsy');
    });

    it('handles undefined', async () => {
        await mount('<test-undefined></test-undefined>');
        await expectExists('#right');
        await expectMissing('#wrong');
    });

    it('works with nesting and direct mounting', async () => {
        await mount('<test-for-if></test-for-if>');
        await expectExists('#first');
        await expectMissing('#second');
        await expectExists('#third');
    });
});
