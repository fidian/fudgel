import { Component, html, parse } from '../../src/fudgel.js';

const date = new Date();

@Component('custom-element', {
    template: html`
        <p>
            Boolean: <span id="booleanPass" *if="true">ok</span>
            <span id="booleanFail" *if="false">WRONG</span>
        </p>
        <p>
            ===:
            <span id="tripleEqualsPass" *if="key === properties.testProperty"
                >ok</span
            >
            <span id="tripleEqualsFail" *if="key !== properties.testProperty"
                >WRONG</span
            >
        </p>
        <p>
            Function call:
            <span id="functionCallPass" *if="returnValue(true)">ok</span>
            <span id="functionCallFail" *if="returnValue(false)">WRONG</span>
        </p>
        <p>
            <button id="triggerUpdate" @click="update()">Update</button>
            <span id="updateCount">{{ updateCount }}</span> updates
        </p>
        <p>
            Looping through items
            <button id="randomize" @click="randomize()">Randomize</button>
        </p>
        <ul>
            <li *for="item of items">{{item.name}} - {{ timesTen(item) }}</li>
        </ul>
    `,
})
class CustomElement {
    items = [
        { name: 'one', random: Math.random() },
        { name: 'two', random: Math.random() },
        { name: 'three', random: Math.random() },
    ];
    key = 'test';
    properties = {
        testProperty: 'test',
    };
    updateCount = 0;

    returnValue(value) {
        return value;
    }

    update() {
        this.updateCount += 1;
    }

    getUpdateCount(multiplier: number) {
        return this.updateCount * multiplier;
    }

    randomize() {
        this.items = this.items.map(item => ({
            ...item,
            random: Math.random(),
        }));
    }

    timesTen(item) {
        return item.random * 10;
    }
}

describe('jsep', () => {
    it('works with simple cases', () => {
        cy.mount(`<custom-element></custom-element>`);
        cy.get('#booleanPass').should('have.text', 'ok');
        cy.get('#booleanFail').should('not.exist');
        cy.get('#tripleEqualsPass').should('have.text', 'ok');
        cy.get('#tripleEqualsFail').should('not.exist');
        cy.get('#functionCallPass').should('have.text', 'ok');
        cy.get('#functionCallFail').should('not.exist');
        cy.get('#updateCount').should('have.text', '0');
        cy.get('#triggerUpdate').click();
        cy.get('#updateCount').should('have.text', '1');
    });

    [
        //
        // parse
        //
        {
            input: '',
            output: undefined,
        },
        {
            input: ' \n \t \r true',
            output: true,
        },
        {
            // It's not a valid expression (this is not whitespace).
            fails: true,
            input: '\x00',
        },

        //
        // gobbleExpression
        //
        {
            bindings: ['abc'],
            input: ' abc ',
            output: 123,
            scope: { abc: 123 },
        },
        {
            bindings: ['xyz'],
            input: 'xyz',
            output: undefined,
            scope: { abc: 123 },
        },
        {
            // Ignores the second binding - this could change in the future.
            bindings: ['abc'],
            input: 'abc def',
            output: 123,
            scope: { abc: 123 },
        },
        {
            // Missing right-hand operand
            fails: true,
            input: 'true ==',
        },
        {
            input: '2 * 3 >> 2 == 1',
            output: true,
        },
        {
            input: '1 == 2 * 3 >> 2',
            output: true,
        },

        //
        // gobbleBinaryOp
        //
        {
            input: '1 + 2',
            output: 3,
        },
        {
            input: '2 << 1',
            output: 4,
        },
        {
            input: '1 == true',
            output: true,
        },
        {
            input: '1 === true',
            output: false,
        },
        {
            input: 'false || true',
            output: true,
        },
        {
            input: 'false && true',
            output: false,
        },
        {
            input: 'true == 1',
            output: true,
        },
        {
            input: 'true === 1',
            output: false,
        },

        //
        // gobbleToken
        //
        {
            input: ' 123 ',
            output: 123,
        },
        {
            input: ' .2 ',
            output: 0.2,
        },
        {
            input: ' -123 ',
            output: -123,
        },
        {
            input: '"cat"',
            output: 'cat',
        },
        {
            input: ' - 3 ',
            output: -3,
        },
        {
            input: ' - -3 ',
            output: 3,
        },
        {
            input: ' ! -3 ',
            output: false,
        },
        {
            input: ' - !3 ',
            output: -0,
        },
        {
            input: 'true',
            output: true,
        },
        {
            input: 'null',
            output: null,
        },

        //
        // gobbleTokenProperty
        //
        {
            bindings: ['a'],
            input: ' a . b ',
            output: 'ok',
            scope: {
                a: { b: 'ok' },
            },
        },
        {
            bindings: ['a'],
            input: 'a["b"]',
            output: 'ok',
            scope: {
                a: { b: 'ok' },
            },
        },
        {
            bindings: ['a'],
            input: " a [ 'b' ] ",
            output: 'ok',
            scope: {
                a: { b: 'ok' },
            },
        },
        {
            // Missing closing bracket
            fails: true,
            input: 'a[0',
        },
        {
            bindings: ['a'],
            input: 'a[0]',
            output: 'ok',
            scope: {
                a: ['ok'],
            },
        },
        {
            bindings: ['a'],
            input: 'a[0].b',
            output: 'ok',
            scope: {
                a: [{ b: 'ok' }],
            },
        },
        {
            bindings: ['a'],
            input: 'a?.b',
            output: undefined,
            scope: {},
        },
        {
            // Missing dot for nullish coalescence
            fails: true,
            input: 'a?bb',
        },
        {
            bindings: ['a'],
            input: 'a?.bb',
            output: 'ok',
            scope: { a: { bb: 'ok' } },
        },
        {
            bindings: ['a', 'b'],
            input: 'a(b, "o")',
            output: 'ok',
            scope: { a: (x: string, y: string) => `${y}${x}`, b: 'k' },
        },

        //
        // gobbleNumericLiteral
        //
        {
            // The number is not parsable
            fails: true,
            input: ' 1.2.3 ',
        },
        {
            // Lowercase e
            input: '3.2e1',
            output: 32,
        },
        {
            // Capital E
            input: '3.2E-1',
            output: 0.32,
        },
        {
            // Needs an exponent
            fails: true,
            input: '3.2E',
        },
        {
            // Needs an exponent
            fails: true,
            input: '3.2E-',
        },
        {
            input: '8675',
            output: 8675,
        },
        {
            input: '  3.141592653  ',
            output: 3.141592653,
        },

        //
        // gobbleStringLiteral
        //
        {
            input: '"test"',
            output: 'test',
        },
        {
            input: "'test'",
            output: 'test',
        },
        {
            // Unmatched quotes
            fails: true,
            input: '"test',
        },
        {
            // Unmatched quotes
            fails: true,
            input: "'test",
        },
        {
            input: '"te\\"st\\n"',
            output: 'te"st\n',
        },

        //
        // gobbleIdentifier
        //
        {
            bindings: ['a'],
            input: 'a',
            output: 'ok',
            scope: { a: 'ok' },
        },
        {
            bindings: ['abc123_'],
            input: 'abc123_-4',
            output: 6,
            scope: { abc123_: 10 },
        },

        //
        // gobbleArguments
        //
        {
            bindings: ['a', 'b'],
            input: 'a(1,"test",!b.c)+"-ok"',
            output: '1-test-false-ok',
            scope: {
                a: (x: number, y: string, z: boolean) => `${x}-${y}-${z}`,
                b: { c: true },
            },
        },
        {
            bindings: ['a', 'b'],
            input: ' a ( 2 , "test", ! b.c ) + "-ok" ',
            output: '2-test-false-ok',
            scope: {
                a: (x: number, y: string, z: boolean) => `${x}-${y}-${z}`,
                b: { c: true },
            },
        },

    ].forEach(scenario => {
        let method: any = it;

        if ('only' in scenario) {
            method = it.only;
        }

        method(`parses '${scenario.input}'`, () => {
            const error = console.error;
            let errorCalled = false;
            console.error = () => {
                errorCalled = true;
            };
            const [fn, bindings] = parse(scenario.input);
            console.error = error;
            expect(errorCalled).to.equal(
                !!scenario.fails,
                scenario.fails
                    ? 'Expected an error to be thrown'
                    : 'Did not expect an error to be thrown'
            );
            bindings.sort();
            scenario.bindings?.sort();
            expect(bindings).to.deep.equal(
                scenario.bindings || [],
                'Bindings do not match'
            );
            expect(fn).to.be.a(
                'function',
                'A function to generate a value was not returned'
            );
            const output = fn(scenario.scope || {});
            expect(output).to.deep.equal(
                scenario.output,
                'Output does not match expected value'
            );
        });
    });
});
