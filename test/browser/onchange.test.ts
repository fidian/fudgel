import { describe, it } from 'vitest';
import { component, html } from '../../src/fudgel.js';
import { $$, expectCount, expectValue, mount } from '../support/dom.js';

component(
    'test-onchange',
    {
        attr: ['a', 'b'],
        prop: ['b', 'p'],
        template: html`
            <ul>
                <li *for="item of items">{{item}}</li>
            </ul>
        `,
    },
    class {
        items = [];
        onChange(propName: string, oldValue: any, newValue: any) {
            this.items.push(`${propName}: ${oldValue} -> ${newValue}`);
        }
    }
);

component(
    'test-prop',
    { template: html` <test-onchange .p="p"></test-onchange> ` },
    class {
        p = 'ok';
    }
);

component('test-both-attr', { template: html` <test-onchange b="ok"></test-onchange> ` });

component(
    'test-both-prop',
    { template: html` <test-onchange .b="b"></test-onchange> ` },
    class {
        b = 'ok';
    }
);

const li = (n: number) => $$('li')[n]?.textContent;

describe('onChange events', () => {
    it('triggers one onChange for attribute only', async () => {
        await mount('<test-onchange a="ok"></test-onchange>');
        await expectCount('li', 2);
        await expectValue(() => li(0), 'a: undefined -> ok');
        await expectValue(() => li(1), 'b: undefined -> null');
    });

    it('triggers one onChange for property', async () => {
        await mount('<test-prop></test-prop>');
        await expectCount('li', 3);
        await expectValue(() => li(0), 'a: undefined -> null');
        await expectValue(() => li(1), 'b: undefined -> null');
        await expectValue(() => li(2), 'p: undefined -> ok');
    });

    it('triggers one onChange for shared via attr', async () => {
        await mount('<test-both-attr></test-both-attr>');
        await expectCount('li', 2);
        await expectValue(() => li(0), 'a: undefined -> null');
        await expectValue(() => li(1), 'b: undefined -> ok');
    });

    it('triggers one onChange for shared via prop', async () => {
        await mount('<test-both-prop></test-both-prop>');
        await expectCount('li', 3);
        await expectValue(() => li(0), 'a: undefined -> null');
        await expectValue(() => li(1), 'b: undefined -> null');
        await expectValue(() => li(2), 'b: null -> ok');
    });
});
