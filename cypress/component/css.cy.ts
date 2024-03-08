import { component, css, html } from '../../src/fudgel.js';
import { scopeStyle } from '../../src/component.js';
import { sandboxStyleRules } from '../../src/elements.js';

component('parent-element', {
    style: css`
        :scope {
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
        :scope,
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
                ><code>{{this.style}}</code></pre>
            </div>
        `,
    },
    class {
        scopeSupported: string;
        style = '';
        text: string;
        useShadow: string;

        onChange() {
            this.style = scopeStyle(
                this.text,
                'custom-element',
                'fudgel-123',
                this.scopeSupported === 'true',
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
            <textarea #ref="input" @input="this.update()"></textarea>
            <p>
                Both of these should be the same because @scope support is
                enabled. (#light-true, #shadow-true)
            </p>
            <test-style
                id="light-true"
                text="{{this.text}}"
                scope-supported="true"
                use-shadow="false"
            ></test-style>
            <test-style
                id="shadow-true"
                text="{{this.text}}"
                scope-supported="true"
                use-shadow="true"
            ></test-style>
            <p>Fallback for light DOM. (#light-false)</p>
            <test-style
                id="light-false"
                text="{{this.text}}"
                scope-supported="false"
                use-shadow="false"
            ></test-style>
            <p>Fallback for shadow DOM. (#shadow-false)</p>
            <test-style
                id="shadow-false"
                text="{{this.text}}"
                scope-supported="false"
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
    //     browser's cssText matches this pattern.
    // true: scope supported
    // false: scope not supported
    // shadow: scope not supported and useShadow is true
    {
        id: '1',
        input: 'div { background-color: red; }',
        confirm: 'div { background-color: red; }',
        true: '@scope { div.fudgel-123 { background-color: red; } }',
        false: 'custom-element  div.fudgel-123 { background-color: red; }',
        shadow: 'div.fudgel-123 { background-color: red; }',
    },
    {
        id: '2',
        input: ':scope { background-color: blue; }',
        confirm: ':scope { background-color: blue; }',
        true: '@scope { :scope { background-color: blue; } }',
        false: 'custom-element { background-color: blue; }',
        shadow: ':host { background-color: blue; }',
    },
    {
        id: '3',
        input: '@media (max-width:720px){div{span{display:block;}}}',
        confirm:
            '@media (max-width: 720px) { div { span { display: block; } } }',
        true: '@scope { @media (max-width: 720px) { div.fudgel-123 { span.fudgel-123 { display: block; } } } }',
        false: '@media (max-width: 720px) { custom-element div.fudgel-123 { span.fudgel-123 { display: block; } } }',
        shadow: '@media (max-width: 720px) { div.fudgel-123 { span.fudgel-123 { display: block; } } }',
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
            console.log(test.input);
            const confirm = makePattern(test.confirm);
            const rules = sandboxStyleRules(test.input);

            if (
                rules.length !== 1 ||
                !rules[0].cssText.match(makePattern(test.confirm))
            ) {
                console.log('skip css test', test.id);
                console.log('# of rules:', rules.length);
                console.log('cssText:', JSON.stringify(rules[0].cssText));
                console.log('pattern:', makePattern(test.confirm));
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
                        cy.get('#light-true .result')
                            .invoke('text')
                            .should('match', makePattern(test.true));
                        cy.get('#light-false .result')
                            .invoke('text')
                            .should('match', makePattern(test.false));
                        cy.get('#shadow-true .result')
                            .invoke('text')
                            .should('match', makePattern(test.true));
                        cy.get('#shadow-false .result')
                            .invoke('text')
                            .should('match', makePattern(test.shadow));
                    });
                }
            );
        }
    }
);
