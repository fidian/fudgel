import { describe, it } from 'vitest';
import { component, metadata } from '../../src/fudgel.js';
import { expectAttr, expectText, mount } from '../support/dom.js';

component(
    'link-child',
    { template: 'value:"{{childValue}}"' },
    class {
        childValue = 'initialized';
        template: HTMLTemplateElement;
        onInit() {
            this.template = this[metadata]!.host.querySelector('template');
        }
        onViewInit() {
            this.childValue = this.template.innerHTML;
        }
    }
);

component(
    'link-parent',
    { template: '<link-child><template>{{parentValue}}</template></link-child>' },
    class {
        parentValue = 'ok';
    }
);

describe('Template linking', () => {
    it('replaces placeholders in templates in parent elements using parent element data', async () => {
        await mount('<link-parent></link-parent>');
        await expectText('link-child', 'value:"ok"');
    });
});

component(
    'trailing-for',
    {
        // The *for element is the last node of the template, which is the
        // case where the tree walker used to step back into the clones it
        // had just linked and link them a second time.
        template: '<ul><li *for="x of list" title="{{ x }}">{{ x }}</li></ul>',
    },
    class {
        list = ['{{ secret }}'];
        secret = 'leaked';
    }
);

describe('a structural directive at the end of a template', () => {
    it('does not re-interpret braces in the data it rendered', async () => {
        await mount('<trailing-for></trailing-for>');
        await expectText('li', '{{ secret }}');
        await expectAttr('li', 'title', '{{ secret }}');
    });
});
