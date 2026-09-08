import { describe, it } from 'vitest';
import { component, css, defineSlotComponent, html } from '../../src/fudgel.js';
import { $, click, expectContains, expectMissing, expectText, expectValue, mount } from '../support/dom.js';

defineSlotComponent();

component('show-slot-shadow', {
    template: '<div>[shadow(<slot></slot>)]</div>',
    useShadow: true,
});

// Uses the slot-like element automatically
component('show-slot-light', { template: '<div>[light(<slot-like></slot-like>)]</div>' });

component(
    'removal-and-addition',
    {
        style: css`
            .hide {
                display: none;
            }
        `,
        template: html`
            <button @click="toggle()">Toggle</button>
            <p>Using "display:none"</p>
            <div id="display-none">
                <show-slot-shadow #class="{hide: hidden}">display:none</show-slot-shadow>
                <show-slot-light #class="{hide: hidden}">display:none</show-slot-light>
            </div>
            <p>Using "if"</p>
            <div id="if">
                <show-slot-shadow *if="!hidden">if</show-slot-shadow>
                <show-slot-light *if="!hidden">if</show-slot-light>
            </div>
            <p>Using removal and reinsertion</p>
            <div #ref="parent" id="removal-and-reinsertion">
                <div #ref="child">
                    <show-slot-shadow>remove-and-reinsert</show-slot-shadow>
                    <show-slot-light>remove-and-reinsert</show-slot-light>
                </div>
            </div>
        `,
    },
    class {
        child?: HTMLElement; // #ref
        childElement?: HTMLElement; // Saved copy
        hidden = false;
        parent?: HTMLElement; // #ref

        toggle() {
            this.hidden = !this.hidden;

            if (this.hidden) {
                this.childElement = this.child;
                this.child?.remove();
            } else {
                this.parent.appendChild(this.childElement!);
            }
        }
    }
);

const shadowText = (selector: string) => $(selector)?.shadowRoot?.textContent;

describe('removal and addition', () => {
    it('removes and adds elements correctly', async () => {
        const verifyText = async () => {
            await expectContains('#display-none show-slot-shadow', 'display:none');
            await expectValue(() => shadowText('#display-none show-slot-shadow')?.includes('[shadow()]'), true);
            await expectContains('#display-none show-slot-light', '[light(display:none)]');

            await expectContains('#if show-slot-shadow', 'if');
            await expectValue(() => shadowText('#if show-slot-shadow')?.includes('[shadow()]'), true);
            await expectContains('#if show-slot-light', '[light(if)]');

            await expectContains('#removal-and-reinsertion show-slot-shadow', 'remove-and-reinsert');
            await expectValue(
                () => shadowText('#removal-and-reinsertion show-slot-shadow')?.includes('[shadow()]'),
                true
            );
            await expectContains('#removal-and-reinsertion show-slot-light', '[light(remove-and-reinsert)]');
        };

        await mount('<removal-and-addition></removal-and-addition>');
        await verifyText();
        await click('button');
        await expectMissing('#if show-slot-shadow');
        await expectMissing('#removal-and-reinsertion show-slot-shadow');
        await click('button');
        await verifyText();
    });
});

component(
    'click-increment',
    { template: `<div @click="increment()" id="click-count">{{count}}</div>` },
    class {
        count = 0;

        increment() {
            this.count += 1;
        }
    }
);

component('show-attr', { attr: ['value'], template: `<div>attr:{{value}}</div>` });

component('show-prop', { prop: ['value'], template: `<div>prop:{{value}}</div>` });

component(
    'add-remove-attributes',
    {
        template: `
    <button @click="hideShow()">Hide and Show Counter</button>
    <div #ref="parent">
        <div #ref="child">
            <click-increment></click-increment>
            <show-attr value="ok"></show-attr>
            <show-prop .value="'ok'"></show-prop>
        </div>
    </div>
    <div *if="childElement">HIDDEN</div>
    `,
    },
    class {
        child?: HTMLElement;
        childElement?: HTMLElement;
        parent!: HTMLElement;

        hideShow() {
            if (this.childElement) {
                this.parent.appendChild(this.childElement);
                this.childElement = null;
            } else {
                this.childElement = this.child;
                this.child.remove();
            }
        }
    }
);

describe('adding and removing attributes', () => {
    it('preserves attribute bindings', async () => {
        await mount('<add-remove-attributes></add-remove-attributes>');
        await expectText('click-increment', '0');
        await click('#click-count');
        await expectText('click-increment', '1');
        await expectText('show-attr', 'attr:ok');
        await expectText('show-prop', 'prop:ok');
        await click('button');
        await expectMissing('click-increment');
        await click('button');
        await expectText('click-increment', '0');
        await click('#click-count');
        await expectText('click-increment', '1');
        await expectText('show-attr', 'attr:ok');
        await expectText('show-prop', 'prop:ok');
    });
});
