// Binding to an accessor must keep it an accessor.
import { describe, expect, it } from 'vitest';
import { component, html, metadata, update } from '../../src/fudgel.js';
import { $, click, expectText, mount } from '../support/dom.js';

component(
    'getter-host',
    {
        template: html`<span id="full">{{fullName}}</span><button @click="rename()">rename</button>`,
    },
    class {
        first = 'Ada';
        last = 'Lovelace';

        // A getter on the prototype, the ordinary way to write one.
        get fullName() {
            return `${this.first} ${this.last}`;
        }

        rename() {
            this.first = 'Grace';
            update(this);
        }
    }
);

component(
    'own-accessor-host',
    { template: html`<span id="own">{{own}}</span><button @click="change()">change</button>` },
    class {
        sets = 0;
        stored = 'before';

        constructor() {
            // An accessor pair installed on the instance itself.
            Object.defineProperty(this, 'own', {
                configurable: true,
                enumerable: true,
                get() {
                    return this.stored;
                },
                set(value: string) {
                    this.stored = value;
                    this.sets += 1;
                },
            });
        }

        change() {
            (this as any).own = 'after';
        }
    }
);

component('undeclared-host', { template: html`<span>{{ undeclared }}</span>` });

describe('getters', () => {
    it('are re-read on update() instead of being frozen at bind time', async () => {
        await mount('<getter-host></getter-host>');
        await expectText('#full', 'Ada Lovelace');
        await click('button');
        await expectText('#full', 'Grace Lovelace');
    });

    it('keep the instance as this when an own accessor is assigned', async () => {
        await mount('<own-accessor-host></own-accessor-host>');
        await expectText('#own', 'before');
        await click('button');
        await expectText('#own', 'after');
        expect($('own-accessor-host')![metadata].sets).toBe(1);
    });

    it('leave a bound property configurable', async () => {
        await mount('<undeclared-host></undeclared-host>');
        const controller = $('undeclared-host')![metadata];
        expect(Object.getOwnPropertyDescriptor(controller, 'undeclared')?.configurable).toBe(true);
    });
});
