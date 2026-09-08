import { describe, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { click, expectText, expectValue, mount, text } from '../support/dom.js';

component(
    'test-element-map',
    {
        template:
            '<button @click="swap()">Toggle</button><span id="thing_{{theKey}}" *for="theKey, theValue of value">{{theKey}} = {{theValue}}</span>',
    },
    class {
        value = new Map([
            ['thing1', 'value1'],
            ['thing2', 'value2'],
        ]);
        value2 = new Map([
            ['x1', 'y1'],
            ['x2', 'y2'],
            ['x3', 'y3'],
        ]);

        swap() {
            const x = this.value;
            this.value = this.value2;
            this.value2 = x;
        }
    }
);

component(
    'test-element-object',
    {
        template:
            '<button @click="swap()">Toggle</button><span id="thing_{{theKey}}" *for="theKey, theValue of value">{{theKey}} = {{theValue}}</span>',
    },
    class {
        value: object = { thing1: 'value1', thing2: 'value2' };
        value2: object = { x1: 'y1', x2: 'y2', x3: 'y3' };

        swap() {
            const x = this.value;
            this.value = this.value2;
            this.value2 = x;
        }
    }
);

component(
    'test-change-to-undefined',
    {
        template:
            '<ul *if="list"><li *for="list">{{value}}</li></ul><button @click.stop.prevent="removeList()">Remove list</button>',
    },
    class {
        list = ['abc', 123, false, null, true];

        removeList() {
            this.list = undefined;
        }
    }
);

component(
    'test-iterating-over-empty-list',
    { template: '<div id="x"><div *for="item of list"><span>{{item}}</span></div></div>' },
    class {
        list = ['x'];

        onInit() {
            setTimeout(() => {
                this.list = [];
            });
        }
    }
);

describe('for', () => {
    it('shows a list of things from a map', async () => {
        await mount('<test-element-map></test-element-map>');
        await expectText('#thing_thing1', 'thing1 = value1');
        await expectText('#thing_thing2', 'thing2 = value2');
        await click('button');
        await expectText('#thing_x1', 'x1 = y1');
        await expectText('#thing_x2', 'x2 = y2');
        await expectText('#thing_x3', 'x3 = y3');
    });

    it('shows a list of things from an object', async () => {
        await mount('<test-element-object></test-element-object>');
        await expectText('#thing_thing1', 'thing1 = value1');
        await expectText('#thing_thing2', 'thing2 = value2');
        await click('button');
        await expectText('#thing_x1', 'x1 = y1');
        await expectText('#thing_x2', 'x2 = y2');
        await expectText('#thing_x3', 'x3 = y3');
    });

    it('removes update hooks when a list is emptied', async () => {
        await mount('<test-change-to-undefined></test-change-to-undefined>');
        await expectText('li', 'abc');
        await click('button');
        await expectValue(() => text('ul'), null);
    });

    it('does not error when the list is empty or embedded in another object', async () => {
        await mount('<test-iterating-over-empty-list></test-iterating-over-empty-list>');
        await expectValue(() => text('#x')?.trim(), '');
    });
});

component(
    'for-with-spaces',
    { template: '<span *for="x of list ?? fallback">{{x}},</span>' },
    class {
        list: string[] | undefined = undefined;
        fallback = ['a', 'b'];
    }
);

describe('the iterable expression', () => {
    it('may contain spaces', async () => {
        await mount('<for-with-spaces></for-with-spaces>');
        await expectText('for-with-spaces', 'a,b,');
    });
});
