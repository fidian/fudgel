// The expression parser needs no DOM. These cases run under Node, which is
// also what proves the library can be imported outside a browser.
import { describe, expect, it, vi } from 'vitest';
import { jsep } from '../../src/jsep.js';

interface Scenario {
    bindings?: string[];
    fails?: boolean;
    input: string;
    output?: any;
    scope?: Record<string, any>;
}

const scenarios: Scenario[] = [
    //
    // parse
    //
    { input: '', output: undefined },
    { input: ' \n \t \r true', output: true },
    // It's not a valid expression (this is not whitespace).
    { fails: true, input: '\x00' },

    //
    // gobbleExpression
    //
    { bindings: ['abc'], input: ' abc ', output: 123, scope: { abc: 123 } },
    { bindings: ['xyz'], input: 'xyz', output: undefined, scope: { abc: 123 } },
    // Did not parse the full string
    { fails: true, input: 'abc def' },
    // Missing right-hand operand
    { fails: true, input: 'true ==' },
    { input: '2 * 3 >> 2 == 1', output: true },
    { input: '1 == 2 * 3 >> 2', output: true },

    //
    // gobbleBinaryOp
    //
    { input: '1 + 2', output: 3 },
    { input: '2 << 1', output: 4 },
    { input: '1 == true', output: true },
    { input: '1 === true', output: false },
    { input: 'false || true', output: true },
    { input: 'false && true', output: false },
    { input: 'true == 1', output: true },
    { input: 'true === 1', output: false },
    { input: 'null ?? "ok"', output: 'ok' },
    // Confirms right-to-left
    { input: '2 ** 3 ** 2', output: 512 },
    // Confirms left to right
    { input: '60 / 6 % 10', output: 0 },
    { bindings: ['a'], input: '"b" in a', output: true, scope: { a: { b: 1 } } },
    {
        bindings: ['d', 'Date'],
        input: 'd instanceof Date',
        output: true,
        scope: { d: new Date() },
    },
    { bindings: ['Date'], input: 'Date.parse("2024-01-23")', output: 1705968000000 },

    //
    // gobbleToken
    //
    { input: ' 123 ', output: 123 },
    { input: ' .2 ', output: 0.2 },
    { input: ' -123 ', output: -123 },
    { input: '"cat"', output: 'cat' },
    { input: ' - 3 ', output: -3 },
    { input: ' - -3 ', output: 3 },
    { input: ' ! -3 ', output: false },
    { input: ' - !3 ', output: -0 },
    { input: 'true', output: true },
    { input: 'null', output: null },
    { input: ' ~ 3 ', output: -4 },
    { input: 'typeof "test"', output: 'string' },
    { input: 'typeof "test".length', output: 'number' },
    { input: '[1, "2" , [3]]', output: [1, '2', [3]] },
    { input: '[[]]', output: [[]] },
    { input: '[,,,]', output: [undefined, undefined, undefined] },

    //
    // gobbleTokenProperty
    //
    { bindings: ['a'], input: ' a . b ', output: 'ok', scope: { a: { b: 'ok' } } },
    { bindings: ['a'], input: 'a["b"]', output: 'ok', scope: { a: { b: 'ok' } } },
    { bindings: ['a'], input: " a [ 'b' ] ", output: 'ok', scope: { a: { b: 'ok' } } },
    // Missing closing bracket
    { fails: true, input: 'a[0' },
    { bindings: ['a'], input: 'a[0]', output: 'ok', scope: { a: ['ok'] } },
    { bindings: ['a'], input: 'a[0].b', output: 'ok', scope: { a: [{ b: 'ok' }] } },
    { bindings: ['a'], input: 'a?.b', output: undefined, scope: {} },
    { bindings: [], input: 'null?.propName', output: undefined, scope: {} },
    // Missing dot for optional chaining
    { fails: true, input: 'a?bb' },
    { bindings: ['a'], input: 'a?.bb', output: 'ok', scope: { a: { bb: 'ok' } } },
    {
        bindings: ['a', 'b'],
        input: 'a(b, "o")',
        output: 'ok',
        scope: { a: (x: string, y: string) => `${y}${x}`, b: 'k' },
    },

    //
    // gobbleNumericLiteral
    //
    // The number is not parsable
    { fails: true, input: ' 1.2.3 ' },
    // Lowercase e
    { input: '3.2e1', output: 32 },
    // Capital E
    { input: '3.2E-1', output: 0.32 },
    // Needs an exponent
    { fails: true, input: '3.2E' },
    { fails: true, input: '3.2E-' },
    { input: '8675', output: 8675 },
    { input: '  3.141592653  ', output: 3.141592653 },

    //
    // gobbleStringLiteral
    //
    { input: '"test"', output: 'test' },
    { input: "'test'", output: 'test' },
    // Unmatched quotes
    { fails: true, input: '"test' },
    { fails: true, input: "'test" },
    { input: '"te\\"st\\n"', output: 'te"st\n' },

    //
    // gobbleIdentifier
    //
    { bindings: ['a'], input: 'a', output: 'ok', scope: { a: 'ok' } },
    { bindings: ['abc123_'], input: 'abc123_-4', output: 6, scope: { abc123_: 10 } },

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
    // Can't parse arguments - they are required
    { fails: true, input: 'a(,,)' },

    //
    // parentheses
    //
    { input: '(1 + 2) * 3', output: 9 },
    { input: '((1))', output: 1 },
    { input: '( 1 + 2 ) * 3', output: 9 },
    { bindings: ['a'], input: '(a).b', output: 'ok', scope: { a: { b: 'ok' } } },
    // The context survives grouping, so a method still has its object
    {
        bindings: ['a'],
        input: '(a.b)()',
        output: 'ok',
        scope: { a: { v: 'ok', b() { return this.v; } } },
    },
    { input: '!(true && false)', output: true },
    { fails: true, input: '(1 + 2' },
    { fails: true, input: '()' },

    //
    // conditional operator
    //
    { input: 'true ? 1 : 2', output: 1 },
    { input: 'false ? 1 : 2', output: 2 },
    // Right-associative: the alternate may itself be a conditional
    { input: 'false ? 1 : true ? 2 : 3', output: 2 },
    // Everything else binds tighter than ?:
    { input: 'null ?? true ? "a" : "b"', output: 'a' },
    { input: '1 + 1 ? "yes" : "no"', output: 'yes' },
    { input: 'true ? 1 + 1 : 2 + 2', output: 2 },
    {
        bindings: ['a', 'b', 'c'],
        input: 'a ? b : c',
        output: 'B',
        scope: { a: 1, b: 'B', c: 'C' },
    },
    // Optional chaining before a conditional
    { bindings: ['a'], input: 'a?.x ? 1 : 2', output: 2, scope: {} },
    // A consequent that starts with a dot is a number, not a chain
    { bindings: ['a'], input: 'a ? .5 : 1', output: 0.5, scope: { a: true } },
    // Missing alternate
    { fails: true, input: 'a ? b' },

    //
    // gobbleObjectLiteral
    //
    {
        bindings: ['B', 'c'],
        input: '{ "a": 1, b: B, [c]: [2,3] }',
        output: { a: 1, b: 'test', CCC: [2, 3] },
        scope: { B: 'test', c: 'CCC' },
    },
    { input: '{}', output: {} },
    { bindings: ['a'], input: '{a}', output: { a: 'A' }, scope: { a: 'A' } },
    // Can't use array syntax without colon
    { fails: true, input: '{["abc"]}' },
];

describe('jsep', () => {
    for (const scenario of scenarios) {
        it(`parses ${JSON.stringify(scenario.input)}`, () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const [fn, bindings] = jsep(scenario.input);
            const errorCalled = error.mock.calls.length > 0;
            error.mockRestore();
            expect(
                errorCalled,
                scenario.fails
                    ? 'An error should be thrown'
                    : 'No error is expected to be thrown'
            ).toBe(!!scenario.fails);
            expect([...bindings].sort(), 'Bindings must match').toEqual(
                [...(scenario.bindings || [])].sort()
            );
            expect(fn, 'A generator function needs to be returned').toBeTypeOf('function');
            expect(fn(scenario.scope || {}), 'Output needs to match').toEqual(scenario.output);
        });
    }
});
