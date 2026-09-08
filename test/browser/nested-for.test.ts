// The SSI Manage app recorded that a *for inside an *if inside another *for
// never re-rendered when its list arrived later. This is that layout.
import { describe, it } from 'vitest';
import { component, html } from '../../src/fudgel.js';
import { $$, expectCount, expectValue, mount, tick } from '../support/dom.js';

const compact = (e?: Element) => e?.textContent?.replace(/\s+/g, '');
const pickers = () => $$('.picker').map(compact).join('|');

component(
    'nested-for',
    {
        template: html`
            <div *for="rule of rules" class="rule">
                <span *if="rule.isConsecutive" class="picker">
                    <i *for="code of payCodes">{{code}},</i>
                </span>
            </div>
        `,
    },
    class {
        rules = [{ isConsecutive: true }, { isConsecutive: false }, { isConsecutive: true }];
        payCodes: string[] = [];

        onInit() {
            // The list answers after the rules have rendered.
            setTimeout(() => (this.payCodes = ['A', 'B']), 20);
        }
    }
);

component(
    'nested-for-method',
    {
        template: html`
            <div *for="rule of rules" class="rule">
                <span *if="rule.isConsecutive" class="picker">
                    <i *for="code of codesFor()">{{code}},</i>
                </span>
                <span *if="rule.isConsecutive" class="picker-with-dependency">
                    <i *for="code of codesFor(payCodes)">{{code}},</i>
                </span>
            </div>
        `,
    },
    class {
        rules = [{ isConsecutive: true }];
        payCodes: string[] = [];

        codesFor(_codes?: string[]) {
            return this.payCodes;
        }

        onInit() {
            setTimeout(() => (this.payCodes = ['A', 'B']), 20);
        }
    }
);

describe('a *for inside an *if inside a *for', () => {
    it('re-renders when the inner list arrives after the first render', async () => {
        await mount('<nested-for></nested-for>');
        await expectCount('.rule', 3);
        await expectValue(pickers, 'A,B,|A,B,');
    });

    it('re-renders only if the expression names what changed', async () => {
        // A binding re-evaluates when a top-level identifier in its
        // expression changes. codesFor() names none, so it is evaluated once;
        // codesFor(payCodes) names the list and follows it. This is the
        // likeliest cause of the report above.
        await mount('<nested-for-method></nested-for-method>');
        await expectCount('.rule', 1);
        await expectValue(() => compact($$('.picker-with-dependency')[0]), 'A,B,');
        await tick(20);
        await expectValue(() => compact($$('.picker')[0]), '');
    });
});
