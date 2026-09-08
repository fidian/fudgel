import { describe, beforeEach, it } from 'vitest';
import { component, css, html } from '../../src/fudgel.js';
import { scopeStyle } from '../../src/component.js';
import { sandboxStyleRules } from '../../src/elements.js';
import { $, expectValue, mount } from '../support/dom.js';

component('parent-element', {
    style: css`
        :host {
            background-color: blue;
            padding: 10px;
            display: block;
        }

        div {
            background-color: green;
        }
    `,
    template: html`
        <div>This should be green</div>
        <child-element></child-element>
    `,
});
component('child-element', {
    style: css`
        :host,
        a,
        b {
            background-color: white;
            padding: 10px;
            display: block;
        }

        div.red {
            background-color: red;
        }
    `,
    template: html`
        <div class="white">This should be white</div>
        <div class="red">This should be red</div>
    `,
});

const background = (selector: string) => getComputedStyle($(selector)!).backgroundColor;

describe('css', () => {
    beforeEach(() => mount('<parent-element></parent-element>'));

    it('verifies the background colors', async () => {
        await expectValue(() => background('parent-element'), 'rgb(0, 0, 255)');
        await expectValue(() => background('parent-element div'), 'rgb(0, 128, 0)');
        await expectValue(() => background('child-element'), 'rgb(255, 255, 255)');
        await expectValue(() => background('child-element div.white'), 'rgba(0, 0, 0, 0)');
        await expectValue(() => background('child-element div.red'), 'rgb(255, 0, 0)');
    });
});

component(
    'test-style',
    {
        attr: ['scopeSupported', 'text', 'useShadow'],
        style: css`
            .box {
                border: 1px solid black;
            }
        `,
        template: html`
            <div class="box">
                <pre style="margin: 0" class="result"><code>{{style}}</code></pre>
            </div>
        `,
    },
    class {
        scopeSupported: string;
        style = '';
        text: string;
        useShadow: string;

        onChange() {
            this.style = scopeStyle(this.text, 'custom-element', 'fudgel-123', this.useShadow === 'true');
        }
    }
);
component(
    'test-style-wrapper',
    {
        style: css`
            textarea {
                width: 100%;
                height: 5em;
            }
        `,
        template: html`
            <textarea #ref="input" @input="update()"></textarea>
            <p>Light DOM. (#light)</p>
            <test-style id="light" text="{{text}}" use-shadow="false"></test-style>
            <p>Shadow DOM. (#shadow)</p>
            <test-style id="shadow" text="{{text}}" use-shadow="true"></test-style>
        `,
    },
    class {
        input?: HTMLTextAreaElement;
        text = '';

        update() {
            this.text = this.input?.value;
        }
    }
);

interface StyleCase {
    id: string;
    input: string;
    // Patterns the browser's own cssText must match before the case runs;
    // a parser that does not support the CSS skips the case.
    confirm: string[];
    light: string;
    shadow: string;
}

const tests: StyleCase[] = [
    // These are strings that are changed into patterns, where single spaces
    // are replaced and can optionally match any number of spaces (including
    // 0), and double spaces must match at least one whitespace character.
    {
        id: '1',
        input: 'div { background-color: red; }',
        confirm: ['div { background-color: red; }'],
        light: 'custom-element div.fudgel-123 { background-color: red; }',
        shadow: 'div.fudgel-123 { background-color: red; }',
    },
    {
        id: '2',
        input: ':host { background-color: blue; }',
        confirm: [':host { background-color: blue; }'],
        light: 'custom-element { background-color: blue; }',
        shadow: ':host { background-color: blue; }',
    },
    {
        id: '3',
        input: '@media (max-width:720px){div{span{display:block;}}}',
        confirm: ['@media (max-width: 720px) { div { span { display: block; } } }'],
        light: '@media (max-width: 720px) { custom-element div.fudgel-123 { span.fudgel-123 { display: block; } } }',
        shadow: '@media (max-width: 720px) { div.fudgel-123 { span.fudgel-123 { display: block; } } }',
    },
    {
        id: '4',
        input: 'a-b{width:100vw;}@media (max-width:940px){a-b{width: 50vw;}}',
        confirm: ['a-b { width: 100vw; }', '@media (max-width: 940px) { a-b { width: 50vw; } }'],
        light: 'custom-element a-b.fudgel-123 { width: 100vw; } @media (max-width: 940px) { custom-element a-b.fudgel-123 { width: 50vw; } }',
        shadow: 'a-b.fudgel-123 { width: 100vw; } @media (max-width: 940px) { a-b.fudgel-123 { width: 50vw; } }',
    },
];

function makePattern(str: string) {
    return new RegExp(
        str
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/  /g, '[\\n\\r\\s]+')
            .replace(/ /g, '[\\n\\r\\s]*')
    );
}

const browserParses = (test: StyleCase) => {
    const rules = sandboxStyleRules(test.input);

    return (
        rules.length === test.confirm.length &&
        test.confirm.every((pattern, i) => rules[i].cssText.match(makePattern(pattern)))
    );
};

describe('scopeStyle', () => {
    beforeEach(() => mount('<test-style-wrapper></test-style-wrapper>'));

    for (const test of tests) {
        const run = browserParses(test) ? it : it.skip;

        run(`writes correct styles for case ${test.id}`, async () => {
            const textarea = $<HTMLTextAreaElement>('textarea')!;
            textarea.value = test.input;
            textarea.dispatchEvent(new Event('input'));
            await expectValue(() => !!$('#light .result')?.textContent?.match(makePattern(test.light)), true);
            await expectValue(() => !!$('#shadow .result')?.textContent?.match(makePattern(test.shadow)), true);
        });
    }
});
