import { describe, beforeEach, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { $$, click, expectCount, expectText, expectValue, mount } from '../support/dom.js';

component(
    'test-element',
    {
        template:
            '<button @click="changeSize()">Change Size</button><div id="item{{index}}" *repeat="size">Item {{index}}</div>',
    },
    class {
        size = 3;
        nextSizes = [5, 3];

        changeSize() {
            const item = this.nextSizes.shift();
            this.nextSizes.push(item);
            this.size = item;
        }
    }
);

describe('repeat', () => {
    beforeEach(() => mount('<test-element></test-element>'));

    it('toggles based on an internal value', async () => {
        await expectCount('test-element div', 3);
        await expectText('#item1', 'Item 1');
        await expectText('#item2', 'Item 2');
        await expectText('#item3', 'Item 3');
        await click('button');
        await expectCount('test-element div', 5);
        // Growing appends; the new items come after the old ones.
        await expectValue(() => $$('test-element div').map(d => d.textContent).join('|'), 'Item 1|Item 2|Item 3|Item 4|Item 5');
        await expectText('#item1', 'Item 1');
        await expectText('#item2', 'Item 2');
        await expectText('#item3', 'Item 3');
        await expectText('#item4', 'Item 4');
        await expectText('#item5', 'Item 5');
        await click('button');
        await expectCount('test-element div', 3);
        await expectText('#item1', 'Item 1');
        await expectText('#item2', 'Item 2');
        await expectText('#item3', 'Item 3');
    });
});
