import { describe, beforeEach, it } from 'vitest';
import { component, css, html } from '../../src/fudgel.js';
import { $, $$, expectCount, expectValue, mount } from '../support/dom.js';

// fudgel_shadow-root
component('shadow-root', {
    style: css`
        :host {
            padding: 10px;
            border: 10px solid red;
            display: block;
        }
    `,
    template: html`
        <div>Shadow root element</div>
        <parent-element></parent-element>
    `,
    useShadow: true,
});

// fudgel_parent-element
component(
    'parent-element',
    {
        style: css`
            :host {
                padding: 10px;
                border: 10px solid blue;
                display: block;
            }
        `,
        template: html`
            <div>Parent has a blue border</div>
            <child-element *for="item of items" item="{{item}}"></child-element>
        `,
    },
    class {
        items = ['item 1', 'item 2', 'item 3'];
    }
);

// fudgel_child-element
component('child-element', {
    attr: ['item'],
    style: css`
        :host {
            padding: 10px;
            border: 10px solid green;
            display: block;
        }
    `,
    template: html` <div>Child element -- {{item}}</div> `,
});

describe('style-elements', () => {
    beforeEach(() => mount('<parent-element></parent-element><shadow-root></shadow-root>'));

    it('only adds style rules once for each element', async () => {
        await expectCount('body > style.fudgel_shadow-root', 0);
        await expectCount('body > style.fudgel_parent-element', 1);
        await expectCount('body > style.fudgel_child-element', 1);
        await expectValue(() => $$('style', $('shadow-root')!.shadowRoot!).length, 3);

        // 2 in main document (only Fudgel's; the test runner adds its own)
        await expectCount('style[class^="fudgel_"]', 2);
    });
});
