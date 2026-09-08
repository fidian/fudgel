import { describe, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { $$, expectContains, expectText, mount } from '../support/dom.js';

// Verifies that the scope created for *if doesn't interfere with binding to
// the scope from *for and used for the text replacement.
component(
    'test-update',
    {
        template: `
    <p>Click on an list item to move it to the bottom of the other list.</p>
    <p>First list</p>
    <ul id="first">
        <li *for="item of listOne" @click="moveItem(item,'listTwo')">
            <span *if="item">{{item.name}}</span>
        </li>
    </ul>
    <p>Second list</p>
    <ul id="second">
        <li *for="item of listTwo" @click="moveItem(item,'listOne')">
            <span *if="item">{{item.name}}</span>
        </li>
    </ul>
    `,
    },
    class {
        listOne = [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }];
        listTwo = [{ name: 'Item 4' }, { name: 'Item 5' }];

        moveItem(item: any, targetListName: string) {
            const listOne = this.listOne.filter(i => i !== item);
            const listTwo = this.listTwo.filter(i => i !== item);
            const targetList = targetListName === 'listOne' ? listOne : listTwo;
            targetList.push(item);
            this.listOne = listOne;
            this.listTwo = listTwo;
        }
    }
);

component(
    'bleed-parent',
    {
        template: `
        This should say pass on each line<br>
        <div *for="item of list" class="test{{item}}">{{item}} - <bleed-child></bleed-child></div>
    `,
    },
    class {
        list = ['A'];
        onViewInit() {
            setTimeout(() => {
                this.list = ['A', 'B'];
            });
        }
    }
);

component(
    'bleed-child',
    { template: '<span>{{item}}</span>' },
    class {
        item = 'pass';
    }
);

describe('scope', () => {
    it('updates correctly when an item in the list is changed with nested scopes', async () => {
        await mount('<test-update></test-update>');
        await expectContains('ul#first li:nth-child(1)', 'Item 1');
        await expectContains('ul#first li:nth-child(2)', 'Item 2');
        await expectContains('ul#first li:nth-child(3)', 'Item 3');
        await expectContains('ul#second li:nth-child(1)', 'Item 4');
        await expectContains('ul#second li:nth-child(2)', 'Item 5');
        $$('ul#first li')[1].click();
        await expectContains('ul#first li:nth-child(1)', 'Item 1');
        await expectContains('ul#first li:nth-child(2)', 'Item 3');
        await expectContains('ul#second li:nth-child(1)', 'Item 4');
        await expectContains('ul#second li:nth-child(2)', 'Item 5');
        await expectContains('ul#second li:nth-child(3)', 'Item 2');
    });

    it('does not allow bleeding of scope values', async () => {
        await mount('<bleed-parent></bleed-parent>');
        await expectText('div.testA', 'A - pass');
        await expectText('div.testB', 'B - pass');
    });
});
