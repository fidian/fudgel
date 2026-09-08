// Fudgel iterates Maps, Sets, arrays and plain objects through one helper.
// A user property, object key or route parameter named "entries" must not
// be mistaken for the Map method.
import { describe, expect, it } from 'vitest';
import { component, defineRouterComponent, metadata } from '../../src/fudgel.js';
import { $, click, collectErrors, expectAttr, expectExists, expectMissing, expectText, expectValue, mount } from '../support/dom.js';

defineRouterComponent('entries-router');

component(
    'has-entries-prop',
    { prop: ['entries'], template: 'entries: {{entries}}' },
    class {
        entries = 'initial';
    }
);

component(
    'entries-host',
    {
        template:
            '<button @click="toggle()">toggle</button><has-entries-prop *if="shown" .entries="entriesValue"></has-entries-prop>',
    },
    class {
        entriesValue = 'from parent';
        shown = true;

        toggle() {
            this.shown = !this.shown;
        }
    }
);

component(
    'entries-for',
    { template: '<span *for="key, value of record">{{key}}={{value}};</span>' },
    class {
        record = { entries: 1, other: 2 };
    }
);

component(
    'entries-class',
    { template: '<div id="target" #class="{entries: on, other: !on}"></div>' },
    class {
        on = true;
    }
);

component('show-entries', { attr: ['entries'], template: 'param: {{entries}}' });

component('entries-routes', {
    template: `
        <entries-router>
            <div path="/things/:entries" component="show-entries"></div>
            <div id="none">none</div>
        </entries-router>
    `,
});

describe('a property named entries', () => {
    it('can be a prop, and the element can be removed', async () => {
        const errors = await collectErrors(async () => {
            await mount('<entries-host></entries-host>');
            await expectText('has-entries-prop', 'entries: from parent');
            await click('button');
            await expectMissing('has-entries-prop');
        });
        expect(errors).toEqual([]);
    });

    it('can be a key of an object given to *for', async () => {
        await mount('<entries-for></entries-for>');
        await expectText('entries-for', 'entries=1;other=2;');
    });

    it('can be a class name given to #class', async () => {
        await mount('<entries-class></entries-class>');
        await expectExists('#target');
        await expectValue(() => $('#target')!.className, 'fudgel_entries-class entries');
        $('entries-class')![metadata].on = false;
        await expectValue(() => $('#target')!.className, 'fudgel_entries-class other');
    });

    it('can be a route parameter', async () => {
        await mount('<entries-routes></entries-routes>');
        await expectExists('#none');
        history.pushState(null, '', '/things/abc');
        await expectAttr('show-entries', 'entries', 'abc');
        await expectText('show-entries', 'param: abc');
        history.pushState(null, '', '/');
    });
});
