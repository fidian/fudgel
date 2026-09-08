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

component(
    'uses-globals',
    {
        template:
            '<span id="max">{{ Math.max(1, 2) }}</span><span id="json">{{ JSON.stringify(obj) }}</span><span id="date">{{ formatted(Date.UTC(2020, 0, 1)) }}</span>',
    },
    class {
        obj = { a: 1 };

        formatted(ms: number) {
            return new Date(ms).toISOString();
        }
    }
);

describe('a global in a binding', () => {
    it('resolves to the global rather than to an undefined controller property', async () => {
        await mount('<uses-globals></uses-globals>');
        await expectText('#max', '2');
        await expectText('#json', '{"a":1}');
        await expectText('#date', '2020-01-01T00:00:00.000Z');
    });
});
