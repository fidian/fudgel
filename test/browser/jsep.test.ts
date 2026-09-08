// The DOM half of the expression tests; the parser cases live in
// test/unit/jsep.test.ts and run under Node.
import { describe, it } from 'vitest';
import { Component, html } from '../../src/fudgel.js';
import { click, expectMissing, expectText, mount } from '../support/dom.js';

@Component('custom-element', {
    template: html`
        <p>
            Boolean: <span id="booleanPass" *if="true">ok</span>
            <span id="booleanFail" *if="false">WRONG</span>
        </p>
        <p>
            ===:
            <span id="tripleEqualsPass" *if="key === properties.testProperty">ok</span>
            <span id="tripleEqualsFail" *if="key !== properties.testProperty">WRONG</span>
        </p>
        <p>
            Function call:
            <span id="functionCallPass" *if="returnValue(true)">ok</span>
            <span id="functionCallFail" *if="returnValue(false)">WRONG</span>
        </p>
        <p>
            <button id="triggerUpdate" @click="update()">Update</button>
            <span id="updateCount">{{ updateCount }}</span> updates
        </p>
        <ul>
            <li *for="item of items">{{item.name}} - {{ timesTen(item) }}</li>
        </ul>
    `,
})
class CustomElement {
    items = [
        { name: 'one', random: Math.random() },
        { name: 'two', random: Math.random() },
        { name: 'three', random: Math.random() },
    ];
    key = 'test';
    properties = { testProperty: 'test' };
    updateCount = 0;

    returnValue(value: boolean) {
        return value;
    }

    update() {
        this.updateCount += 1;
    }

    timesTen(item: { random: number }) {
        return item.random * 10;
    }
}

describe('jsep in templates', () => {
    it('works with simple cases', async () => {
        await mount(`<custom-element></custom-element>`);
        await expectText('#booleanPass', 'ok');
        await expectMissing('#booleanFail');
        await expectText('#tripleEqualsPass', 'ok');
        await expectMissing('#tripleEqualsFail');
        await expectText('#functionCallPass', 'ok');
        await expectMissing('#functionCallFail');
        await expectText('#updateCount', '0');
        await click('#triggerUpdate');
        await expectText('#updateCount', '1');
    });
});
