import { describe, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { click, expectText, mount } from '../support/dom.js';

component(
    'custom-element',
    {
        template:
            '<span id="test">an {{internalValue}} {{where()}}</span><button @click="buttonClicked($event)">Change</button>',
    },
    class {
        internalValue = 'internal value';

        buttonClicked(event: Event) {
            this.internalValue = `event (${event.type})`;
        }

        where() {
            return 'here';
        }
    }
);

component(
    'multi-bind',
    { template: '<div id="one">{{obj.one}}</div><div id="two">{{obj.two}}</div>' },
    class {
        obj = { one: 'ONE', two: 'TWO' };
    }
);

describe('text', () => {
    it('replaces text in mustache-like syntax for text nodes and attributes', async () => {
        await mount('<custom-element></custom-element>');
        await expectText('#test', 'an internal value here');
        await click('button');
        await expectText('#test', 'an event (click) here');
    });

    it('works with multiple binds to the same object', async () => {
        await mount('<multi-bind></multi-bind>');
        await expectText('#one', 'ONE');
        await expectText('#two', 'TWO');
    });
});
