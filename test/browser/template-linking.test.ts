import { describe, it } from 'vitest';
import { component, metadata } from '../../src/fudgel.js';
import { expectText, mount } from '../support/dom.js';

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
