import { component, css, html } from '../../src/fudgel.js';
import { scopeStyle } from '../../src/component.js';
import { sandboxStyleRules } from '../../src/elements.js';

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

describe('css', () => {
    beforeEach(() => {
        cy.mount('<parent-element></parent-element>');
    });
    it('verifies the background colors', () => {
        cy.get('parent-element').should(
            'have.css',
            'background-color',
            'rgb(0, 0, 255)'
        );
        cy.get('parent-element div').should(
            'have.css',
            'background-color',
            'rgb(0, 128, 0)'
        );
        cy.get('child-element').should(
            'have.css',
            'background-color',
            'rgb(255, 255, 255)'
        );
        cy.get('child-element div.white').should(
            'have.css',
            'background-color',
            'rgba(0, 0, 0, 0)'
        );
        cy.get('child-element div.red').should(
            'have.css',
            'background-color',
            'rgb(255, 0, 0)'
        );
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
                <pre
                    style="margin: 0"
                    class="result"
                ><code>{{style}}</code></pre>
            </div>
        `,
    },
    class {
        scopeSupported: string;
        style = '';
        text: string;
        useShadow: string;

        onChange() {
            console.log({ text: this.text, useShadow: this.useShadow });
            this.style = scopeStyle(
                this.text,
                'custom-element',
                'fudgel-123',
                this.useShadow === 'true'
            );
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
            <test-style
                id="light"
                text="{{text}}"
                use-shadow="false"
            ></test-style>
            <p>Shadow DOM. (#shadow)</p>
            <test-style
                id="shadow"
                text="{{text}}"
                use-shadow="true"
            ></test-style>
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
const tests = [
    // These are strings that are changed into patterns, where single spaces
    // are replaced and can optionally match any number of spaces (including
    // 0), and double spaces must match at least one whitespace character.
    //
    // confirm: run the test in the browser when the styles are parsed and the
    //     browser's cssText matches these patterns. One pattern per generated
    //     rule. If the browser's CSS parser does not support some of the
    //     CSS here, then the confirmation rule will fail and the test will
    //     be skipped. Information about why the skipping happened is also
    //     logged to the console.
    // light: light DOM version (scoped and :host is changed)
    // shadow: shadow DOM version (scoped)
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
        confirm:
            ['@media (max-width: 720px) { div { span { display: block; } } }'],
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
describe(
    'scopeStyle',
    {
        defaultCommandTimeout: 200,
    },
    () => {
        beforeEach(() => {
            cy.mount('<test-style-wrapper></test-style-wrapper>');
        });

        for (const test of tests) {
            const confirm = test.confirm.map((input) => makePattern(input));
            const rules = sandboxStyleRules(test.input);
            let allMatch = true;

            if (
                rules.length !== confirm.length
            ) {
                console.log('skip css test', test.id);
                console.log('# of rules:', rules.length);
                continue;
            }

            // Verify the input was parsed correctly
            for (let i = 0; i < rules.length; i += 1) {
                if (!rules[i].cssText.match(confirm[i])) {
                    allMatch = false;
                    console.log('skip css test', test.id);
                    console.log(`cssText[${i}]:`, JSON.stringify(rules[0].cssText));
                    console.log(`pattern[${i}]:`, makePattern(test.confirm[i]));
                    break;
                }
            }

            if (!allMatch) {
                describe(`scopeStyle, test ${test.id} - failed to confirm`, () => {});
                continue;
            }

            describe(
                `scopeStyle, test ${test.id}`,
                {
                    defaultCommandTimeout: 200,
                },
                () => {
                    beforeEach(() => {
                        cy.get('textarea').type(test.input, {
                            delay: 0,
                            parseSpecialCharSequences: false,
                        });
                    });
                    it('writes correct styles', () => {
                        cy.get('#light .result')
                            .invoke('text')
                            .should('match', makePattern(test.light));
                        cy.get('#shadow .result')
                            .invoke('text')
                            .should('match', makePattern(test.shadow));
                    });
                }
            );
        }
    }
);
