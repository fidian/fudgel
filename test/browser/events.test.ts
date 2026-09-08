import { describe, it } from 'vitest';
import { component, Controller, emit, html } from '../../src/fudgel.js';
import { click, expectText, mount } from '../support/dom.js';

component(
    'child-el',
    { prop: ['x'], template: 'Child' },
    class ChildElController {
        changeCount = 0;

        onInit() {
            emit(this, 'onInit', this);
        }

        onChange() {
            this.changeCount += 1;
        }
    }
);

component(
    'parent-el',
    {
        template: html`
            <div>
                <button *if="x === 'one'" id="make-change" @click="makeChange()">
                    Make Change
                </button>
                <button *if="x === 'two'" id="test1" @click="hide()">Test 1 - Hide</button>
                <button *if="x === 'two'" id="test2" @click="hide()">Test 2 - Remove</button>
                <button id="get-count" @click="getCount()">Get Current Change Count</button>
                <button @click="reset()">Reset</button>
            </div>
            <div *if="changes != null">Change Count: <span id="changes">{{changes}}</span></div>
            <child-el #ref="child" *if="!hidden" .x="x" @on-init="childInit($event)" @on-change="onChange()"></child-el>
        `,
    },
    class ParentElController {
        changes?: number;
        child: HTMLElement;
        controller: Controller;
        hidden = false;
        x = 'one';

        getCount() {
            this.changes = this.controller.changeCount;
        }

        childInit(event: CustomEvent<Controller>) {
            this.controller = event.detail;
        }

        reset() {
            this.changes = null;
            this.hidden = false;
            this.x = 'one';
        }

        makeChange() {
            this.changes = null;
            this.x = 'two';
        }

        hide() {
            this.changes = null;
            // Remove the element, which removes event listeners and removes
            // the controller
            this.hidden = true;
            this.x = 'test1';
        }

        remove() {
            this.changes = null;
            // Remove the element, which removes event listeners and removes
            // the controller
            const e = this.child;
            e.remove();
            (e as any).x = 'test2';
        }
    }
);

describe('Element removal', () => {
    it('removes bindings when hidden', async () => {
        await mount('<parent-el></parent-el>');
        await click('#get-count');
        await expectText('#changes', '1');
        await click('#make-change');
        await click('#get-count');
        await expectText('#changes', '2');
        await click('#test1');
        await click('#get-count');
        await expectText('#changes', '2');
    });

    it('removes bindings when removed', async () => {
        await mount('<parent-el></parent-el>');
        await click('#get-count');
        await expectText('#changes', '1');
        await click('#make-change');
        await click('#get-count');
        await expectText('#changes', '2');
        await click('#test2');
        await click('#get-count');
        await expectText('#changes', '2');
    });
});
