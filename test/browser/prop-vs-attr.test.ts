import { describe, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { expectText, mount } from '../support/dom.js';

// Make a simple string for easy testing
function str(value: any): string {
    if (value === undefined) {
        return 'undefined';
    }

    return JSON.stringify(value);
}

// Three components to show how attributes and properties come into a child.
component(
    'show-value-attr',
    { attr: ['value'], template: '{{str(value)}}' },
    class ChildElement {
        str = str;
        value: any = 'initial';
    }
);
component(
    'show-value-prop',
    { prop: ['value'], template: '{{str(value)}}' },
    class ChildElement {
        str = str;
        value: any = 'initial';
    }
);
component(
    'show-value-attr-prop',
    { attr: ['value'], prop: ['value'], template: '{{str(value)}}' },
    class ChildElement {
        str = str;
        value: any = 'initial';
    }
);

// Different ways that parents can interact with the child elements
component('parent-element', {
    template: `
        <show-value-attr></show-value-attr><br />
        <show-value-prop></show-value-prop><br />
        <show-value-attr-prop></show-value-attr-prop>
    `,
});
component('parent-element-attr', {
    template: `
        <show-value-attr value="ok"></show-value-attr><br />
        <show-value-prop value="ok"></show-value-prop><br />
        <show-value-attr-prop value="ok"></show-value-attr-prop>
    `,
});
component(
    'parent-element-attr-interpolated',
    {
        template: `
        <show-value-attr value="{{value}}"></show-value-attr><br />
        <show-value-prop value="{{value}}"></show-value-prop><br />
        <show-value-attr-prop value="{{value}}"></show-value-attr-prop>
    `,
    },
    class {
        value = 'ok';
    }
);
component(
    'parent-element-prop',
    {
        template: `
        <show-value-attr .value="value"></show-value-attr><br />
        <show-value-prop .value="value"></show-value-prop><br />
        <show-value-attr-prop .value="value"></show-value-attr-prop>
    `,
    },
    class {
        value = 'ok';
    }
);
component(
    'parent-element-attr-prop-interpolated',
    {
        template: `
        <show-value-attr value="{{one}}" .value="two"></show-value-attr><br />
        <show-value-prop value="{{one}}" .value="two"></show-value-prop><br />
        <show-value-attr-prop value="{{one}}" .value="two"></show-value-attr-prop>
    `,
    },
    class {
        one = '1';
        two = '2';
    }
);

describe('prop vs attr', () => {
    it('works with no incoming values', async () => {
        await mount('<parent-element></parent-element>');
        await expectText('show-value-attr', 'null');
        await expectText('show-value-prop', '"initial"');
        await expectText('show-value-attr-prop', 'null');
    });
    it('works with attr', async () => {
        await mount('<parent-element-attr></parent-element-attr>');
        await expectText('show-value-attr', '"ok"');
        await expectText('show-value-prop', '"initial"');
        await expectText('show-value-attr-prop', '"ok"');
    });
    it('works with attr (interpolated)', async () => {
        await mount('<parent-element-attr-interpolated></parent-element-attr-interpolated>');
        await expectText('show-value-attr', '"ok"');
        await expectText('show-value-prop', '"initial"');
        await expectText('show-value-attr-prop', '"ok"');
    });
    it('works with prop', async () => {
        await mount('<parent-element-prop></parent-element-prop>');
        await expectText('show-value-attr', 'null');
        await expectText('show-value-prop', '"ok"');
        await expectText('show-value-attr-prop', '"ok"');
    });
    it('works with attr and prop (interpolated)', async () => {
        await mount('<parent-element-attr-prop-interpolated></parent-element-attr-prop-interpolated>');
        await expectText('show-value-attr', '"1"');
        await expectText('show-value-prop', '"2"');
        await expectText('show-value-attr-prop', '"2"');
    });
});
