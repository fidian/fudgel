import { describe, beforeEach, expect, it } from 'vitest';
import { component, html } from '../../src/fudgel.js';
import { $, click, collectErrors, expectContains, expectMissing, expectText, expectValue, mount } from '../support/dom.js';

component('custom-element', { template: html`Success` });

component('custom-element-shadow', { template: html`Success`, useShadow: true });

describe('basic initialization', () => {
    beforeEach(() => mount('<custom-element></custom-element>'));

    it('loads the page and works with a simple template', async () => {
        await expectText('custom-element', 'Success');
    });
});

describe('with shadow', () => {
    beforeEach(() => mount('<custom-element-shadow></custom-element-shadow>'));

    it('loads the page and works with a simple template', async () => {
        await expectValue(() => $('custom-element-shadow')?.shadowRoot?.textContent, 'Success');
    });
});

component(
    'show-list',
    {
        template: html`
            <button *if="allowChange" @click="change()" id="change">
                Change list
            </button>
            <ul *for="item of list">
                <li id="item_{{item.id}}">{{item.id}}: {{item.name}}</li>
            </ul>
        `,
    },
    class {
        list = [
            { id: 1, name: 'One' },
            { id: 2, name: 'Two' },
        ];
        allowChange = true;

        change() {
            this.list = [
                { id: 3, name: 'Three' },
                { id: 4, name: 'Four' },
                { id: 5, name: 'Five' },
            ];
            this.allowChange = false;
        }
    }
);

describe('with a list', () => {
    beforeEach(() => mount('<show-list></show-list>'));

    it('displays the right items in the list', async () => {
        await expectText('#item_1', '1: One');
        await expectText('#item_2', '2: Two');
    });

    it('changes the list when the button is clicked', async () => {
        await click('#change');
        await expectText('#item_3', '3: Three');
        await expectText('#item_4', '4: Four');
        await expectText('#item_5', '5: Five');
        await expectMissing('#item_1');
        await expectMissing('#item_2');
        await expectMissing('#change');
    });
});

component(
    'interpolation-test',
    {
        // This is intentionally split on multiple lines
        template: html`
            {{
                message
            }}
        `,
    },
    class {
        message = 'correct';
    }
);

describe('interpolation', () => {
    it('displays the right message', async () => {
        await mount('<interpolation-test></interpolation-test>');
        await expectContains('interpolation-test', 'correct');
    });
});

component(
    'throws-in-constructor',
    { template: 'never rendered' },
    class {
        constructor() {
            throw new Error('constructor failed');
        }
    }
);

describe('a controller whose constructor throws', () => {
    it('reports that error once and nothing more on removal', async () => {
        const errors = await collectErrors(() => {
            document.body.innerHTML = '<throws-in-constructor></throws-in-constructor>';
            document.body.innerHTML = '';
        });
        expect(errors).toEqual(['Uncaught Error: constructor failed']);
    });
});

describe('component() names', () => {
    it('throws for a name without a hyphen instead of failing silently', () => {
        expect(() => component('nohyphen', { template: '' })).toThrow(DOMException);
    });

    it('tolerates defining the same name twice', () => {
        expect(component('defined-twice', { template: 'first' })).toBeTypeOf('function');
        expect(() => component('defined-twice', { template: 'second' })).not.toThrow();
    });
});
