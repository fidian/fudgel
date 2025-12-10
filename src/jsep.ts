import { memoize, Obj, uniqueListJoin } from './util.js';
import { win } from './elements.js';

// JavaScript Expression Parser (JSEP)
// Based on the NPM package `jsep` by Stephen Oney
//
// All functions starting with "gobble" will remove spaces after getting
// the token or expression it's designed to handle.

// A wrapped value, which allows for retaining the context
type ProvidedValue = [any, Object?]; // Actual value, context object
type RootValueProvider = { [key: string | symbol]: ProvidedValue };

// [0] is what generates a value
// [1] lists the bound properties off of root that are used
type ValueProviderFunction = (root: RootValueProvider) => ProvidedValue;

// This is used internally
type ValueProvider = [ValueProviderFunction, string[]];

// This is passed back to the caller of parse()
export type ValueProviderRoot = [(roots: object[]) => any, string[]];

// Global variables used during synchronous parsing.
let expr = ''; // The expression to parse
let index = 0; // Current index
let code = 0; // Char code at the current index
let moreToParse = false; // If we are at the end of the expression

// String literal escape codes that do not map to the same character.
// Eg. "\z" maps to "z" - those don't need to be listed.
const escapeCodes: { [key: string]: string } = {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
};

// Unary operators that take a single argument to the right of the operator
const unaryOps: {
    [key: string]: (arg: ValueProviderFunction) => ValueProviderFunction;
} = {
    '-': arg => root => [-arg(root)[0]],
    '!': arg => root => [!arg(root)[0]],
    '~': arg => root => [~arg(root)[0]],
    '+': arg => root => [+arg(root)[0]],
    typeof: arg => root => [typeof arg(root)[0]],
};

// Binary operators that take two arguments. Precendence matters for these.
// These are sorted in a special way, so iterating across these would find the
// longest match first. This is especially evident with precedence 9 and 10
// operators.
type BinaryOp = [
    number, // precedence
    (
        left: ValueProviderFunction,
        right: ValueProviderFunction
    ) => ValueProviderFunction,
    number?, // truthy if right-to-left precedence
];
const binaryOps: { [key: string]: BinaryOp } = {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
    // 1 Skip: , (comma)
    // 2 Skip: ...x, yield, =>, x?y:z, assignments
    '||': [3, (left, right) => root => [left(root)[0] || right(root)[0]]],
    '??': [3, (left, right) => root => [left(root)[0] ?? right(root)[0]]],
    '&&': [4, (left, right) => root => [left(root)[0] && right(root)[0]]],
    '|': [5, (left, right) => root => [left(root)[0] | right(root)[0]]], // After ||
    '^': [6, (left, right) => root => [left(root)[0] ^ right(root)[0]]],
    '&': [7, (left, right) => root => [left(root)[0] & right(root)[0]]], // After &&
    '===': [8, (left, right) => root => [left(root)[0] === right(root)[0]]],
    '==': [8, (left, right) => root => [left(root)[0] == right(root)[0]]], // After ===
    '!==': [8, (left, right) => root => [left(root)[0] !== right(root)[0]]],
    '!=': [8, (left, right) => root => [left(root)[0] != right(root)[0]]], // After !==
    '<<': [10, (left, right) => root => [left(root)[0] << right(root)[0]]], // Forced earlier
    '>>>': [10, (left, right) => root => [left(root)[0] >>> right(root)[0]]], // Forced earlier
    '>>': [10, (left, right) => root => [left(root)[0] >> right(root)[0]]], // After >>>
    '<=': [9, (left, right) => root => [left(root)[0] <= right(root)[0]]], // After <<
    '<': [9, (left, right) => root => [left(root)[0] < right(root)[0]]], // After <=
    '>=': [9, (left, right) => root => [left(root)[0] >= right(root)[0]]], // After >>
    '>': [9, (left, right) => root => [left(root)[0] > right(root)[0]]], // After >
    instanceof: [
        9,
        (left, right) => root => [left(root)[0] instanceof right(root)[0]],
    ],
    in: [9, (left, right) => root => [left(root)[0] in right(root)[0]]], // After instanceof
    '+': [11, (left, right) => root => [left(root)[0] + right(root)[0]]],
    '-': [11, (left, right) => root => [left(root)[0] - right(root)[0]]],
    '**': [13, (left, right) => root => [left(root)[0] ** right(root)[0]], 1], // right-to-left, forced earlier
    '*': [12, (left, right) => root => [left(root)[0] * right(root)[0]]], // After *
    '/': [12, (left, right) => root => [left(root)[0] / right(root)[0]]],
    '%': [12, (left, right) => root => [left(root)[0] % right(root)[0]]],
    // 14 Skip: these are unary
    // 15 Skip: these are unary
    // 16 Skip: new
};

// Literals - when encountered, they are replaced with their value.
const literals: { [key: string]: any } = {
    true: true,
    false: false,
    null: null,
    undefined: undefined,
};

const defaultValueProvider = [() => [] as any, []] as ValueProvider;

// Parses an expression. Always returns a ValueProviderRoot, which is a tuple:
// [function, string[]].  The function takes a list of objects that are
// searched for root values and returns a value. The returned string[] is a
// list of bound properties that the function uses.
export const parse = memoize((exprToParse: string): ValueProviderRoot => {
    // Assign to a global variable
    expr = exprToParse;

    // Set up index and code (global variables)
    index = -1;
    gobbleSpaces(1);

    // Use a default return value
    let result: ValueProvider = defaultValueProvider;

    try {
        if (moreToParse) {
            result = gobbleExpression() || throwError();
        }

        if (moreToParse) {
            result = defaultValueProvider;
            throwError();
        }
    } catch (ignore) {}

    // Unwrap the result - change it from a ValueProvider result to a ValueProviderRoot.
    // When calling result[0], the root object needs to wrap the values in an array
    // to produce ProvidedValue results;
    return [
        (roots: object[]) =>
            result[0](
                // Wrap all values provided from the root objects (or the
                // window fallback) in arrays to preserve their context. All
                // calls to any getter will produce a ProvidedValue.
                new Proxy(
                    {},
                    {
                        get(_ignoreTarget: any, prop: string | symbol) {
                            for (const root of roots) {
                                if (prop in root) {
                                    return [(root as any)[prop], root];
                                }
                            }
                            return [(win as any)[prop], win];
                        },
                    }
                )
            )[0],
        result[1],
    ];
});

// Move to the next character in the expression.
const advance = (n = 1) => {
    index += n;
    code = expr.charCodeAt(index);
    moreToParse = code >= 0; // NaN fails this check
};

// Trivial functions for minification
const char = () => expr.charAt(index);
const isDecimalDigit = (charCode = code) => charCode > 47 && charCode < 58; // 0...9
const isIdentifierStart = (charCode = code) =>
    /* A-Z */ (charCode > 64 && charCode < 91) ||
    /* a-z */ (charCode > 96 && charCode < 123) ||
    /* extended */ charCode > 127 ||
    /* $ */ charCode == 36 ||
    /* _ */ charCode == 95;
const isIdentifierPart = (charCode?: number) =>
    isIdentifierStart(charCode) || isDecimalDigit(charCode);
const throwError = () => {
    const err = `Parse error at index ${index}: ${expr}`;
    console.error(err);

    throw new Error(err);
};

// Consume whitespace in the expression.
const gobbleSpaces = (advanceChars = 0) => {
    if (advanceChars) {
        advance(advanceChars);
    }

    while (
        /* space */ code == 32 ||
        /* tab */ code == 9 ||
        /* newline */ code == 10 ||
        /* carriage return */ code == 13
    ) {
        advance();
    }
};

const gobbleExpression = (): ValueProvider => {
    const combineLast = () => {
        const r = stack.pop() as ValueProvider,
            op = stack.pop() as BinaryOp,
            l = stack.pop() as ValueProvider;
        stack.push([op[1](l[0], r[0]), uniqueListJoin(l[1], r[1])]);
    };

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobble a binary operator without a left-hand-side
    const left = gobbleToken();

    if (!left) {
        return left;
    }

    let biop = gobbleTokenFromList(binaryOps);

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
        return left;
    }

    const stack: (ValueProvider | BinaryOp)[] = [
        left,
        biop,
        gobbleToken() || throwError(),
    ];

    // Compare the previous binary operator against the newly found one.
    // Previous = stack[stack.length-2], newly found one = biop
    //
    // The comparison will check the precedence of the two operators,
    // preferring to combine the operations when the current one is less than
    // or equal to the previous. This logic is flipped when the previous one is
    // a right-to-left operation.
    const comparePrev = (prev: BinaryOp) =>
        prev[2]! ^ ((biop[0] <= prev[0]) as unknown as number);

    // Properly deal with precedence using
    // [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = gobbleTokenFromList(binaryOps))) {
        // Reduce: make a binary expression from the three topmost entries.
        while (
            stack.length > 2 &&
            comparePrev(stack[stack.length - 2] as BinaryOp)
        ) {
            combineLast();
        }

        stack.push(biop, gobbleToken() || throwError());
    }

    while (stack.length > 1) {
        combineLast();
    }

    return stack[0] as ValueProvider;
};

// Objects passed into here must have keys that are sorted so longer keys are first.
//
// Example:
// {
//   'instanceof': 1,
//   'in': 2,
// }
//
// This checks each of the keys in the object against the current position in
// expr. The first one that matches will have its value returned.
//
// There's a check to make sure that tokens comprised of alphabetic characters
// are not followed by an alphabetic character.
const gobbleTokenFromList = (tokenList: Record<string, any>) => {
    for (const item of Obj.keys(tokenList)) {
        // If the token matches exactly
        if (expr.substr(index, item.length) == item) {
            // If the first character is NOT a letter, then it's just symbols
            // and we're good. Otherwise, if it is a letter, then a
            // non-identifier character must trail the token.
            if (
                !isIdentifierStart() ||
                !isIdentifierPart(expr.charCodeAt(index + item.length))
            ) {
                gobbleSpaces(item.length);
                return tokenList[item];
            }
        }
    }
};

const gobbleToken = (): ValueProvider => {
    let node: ValueProvider;

    // 46 is '.'
    if (isDecimalDigit() || code == 46) {
        // Char code 46 is a dot `.`, which can start off a numeric literal
        return gobbleNumericLiteral();
    }

    if (code == 34 || code == 39) {
        // 34 = '"', 39 = "'"
        // Single or double quotes
        const str = gobbleStringLiteral();
        node = [() => [str], []];
    } else if (code === 91) {
        // 91 is '['
        // Array literal
        gobbleSpaces(1);
        // 93 is ']'
        node = gobbleArguments(93, true);
    } else if (code === 123) {
        // 123 is '{'
        node = gobbleObjectLiteral();
    } else {
        const op = gobbleTokenFromList(unaryOps);

        if (op) {
            const argument = gobbleToken() || throwError();
            return [op(argument[0]), argument[1]];
        }

        const identifier = gobbleIdentifier();

        // Careful - "root" is a Proxy that already returns a value wrapped in
        // an array with the context.
        node =
            identifier in literals
                ? [() => [literals[identifier]], []]
                : [root => root[identifier], [identifier]];
    }

    return gobbleTokenProperty(node);
};

const gobbleTokenProperty = (node: ValueProvider): ValueProvider => {
    // '.', '[', '(', '?'
    while (
        /* . */ code == 46 ||
        /* [ */ code == 91 ||
        /* ( */ code == 40 ||
        /* ? */ code == 63
    ) {
        let optional: boolean | undefined;
        let action: (
            value: ProvidedValue,
            root: RootValueProvider
        ) => ProvidedValue;
        let bindings: string[] = [];
        let prevNode: ValueProvider = node;
        // '?'
        if (code == 63) {
            // Checking for optional chaining
            advance();
            // '.'
            if ((code as number) !== 46) {
                advance(-1);
                return node;
            }
            optional = true;
        }

        // '['
        if (code == 91) {
            gobbleSpaces(1);
            const expression = gobbleExpression() || throwError();
            action = (value, root) => [
                value[0][expression[0](root)[0]],
                value[0],
            ];
            bindings = expression[1];
            // ']'
            if ((code as number) !== 93) {
                throwError();
            }
            gobbleSpaces(1);
        } else if (code == 40) {
            // '('
            gobbleSpaces(1);
            // A function call is being made; gobble all the arguments
            // 41 is ')'
            const args = gobbleArguments(41);
            action = (value, root) => [
                value[0].apply(value[1], args[0](root)[0]),
            ];
            bindings = args[1];
        } else if (code == 46) {
            // '.'
            gobbleSpaces(1);
            const identifier = gobbleIdentifier();
            action = value => [value[0][identifier], value[0]];
        } else {
            throwError();
        }

        node = optional
            ? [
                  root => {
                      const value = prevNode[0](root);

                      // This returns true for undefined and null, false
                      // otherwise for everything else (including false, 0,
                      // and empty string).
                      return value[0] == null
                          ? ([] as any)
                          : action(value, root);
                  },
                  uniqueListJoin(prevNode[1], bindings),
              ]
            : [
                  root => action(prevNode[0](root), root),
                  uniqueListJoin(prevNode[1], bindings),
              ];

        gobbleSpaces();
    }

    return node;
};

const gobbleNumericLiteral = (): ValueProvider => {
    let number = '';

    while (isDecimalDigit()) {
        number += char();
        advance();
    }

    // '.'
    if (code == 46) {
        // can start with a decimal marker
        number += '.';
        advance();

        while (isDecimalDigit()) {
            number += char();
            advance();
        }
    }

    // e or E
    if (code == 101 || code == 69) {
        // exponent marker
        number += char();
        advance();

        // '+', '-'
        if ((code as number) == 43 || (code as number) == 45) {
            // exponent sign
            number += char();
            advance();
        }

        if (!isDecimalDigit()) {
            throwError();
        }

        do {
            number += char();
            advance();
        } while (isDecimalDigit());
    }

    // Check to make sure this isn't a variable name that starts with a number
    // (123abc)
    if (isIdentifierStart()) {
        throwError();
    } else if (code == 46 || number == '.') {
        // 46 is '.'
        // Error with "1.." and "."
        throwError();
    }

    gobbleSpaces();
    const value = parseFloat(number);
    return [() => [value], []];
};

const gobbleStringLiteral = (): string => {
    let str = '';
    const quote = code;
    advance();

    while (moreToParse) {
        if (code == quote) {
            break;
        }

        if (code == 92) {
            // 92 is '\\'
            advance();
            // Check for all of the common escape codes
            const c = char();
            str += escapeCodes[c] || c;
        } else {
            str += char();
        }

        advance();
    }

    if (!moreToParse) {
        throwError();
    }

    gobbleSpaces(1);

    return str;
};

const gobbleIdentifier = (): string => {
    let start = index;

    if (!isIdentifierStart()) {
        throwError();
    }

    advance();

    while (moreToParse) {
        if (!isIdentifierPart()) {
            break;
        }

        advance();
    }

    const identifier = expr.slice(start, index);
    gobbleSpaces();

    return identifier;
};

// This doesn't return the typical ValueProvider.
const gobbleArguments = (
    terminator: number,
    allowEmpty?: boolean
): ValueProvider => {
    const args: ValueProvider[] = [];

    while (code !== terminator) {
        if (!moreToParse) {
            throwError();
        }

        args.push(
            allowEmpty && code == 44 ? defaultValueProvider : gobbleExpression()
        );

        if (code == 44) {
            // 44 is ','
            gobbleSpaces(1);
        } else if (code !== terminator) {
            throwError();
        }
    }

    gobbleSpaces(1);

    return [
        root => [args.map(arg => arg[0](root)[0])],
        args.reduce((acc: string[], arg) => uniqueListJoin(acc, arg[1]), []),
    ];
};

const gobbleObjectLiteral = (): ValueProvider => {
    gobbleSpaces(1);
    const props: [ValueProvider, ValueProvider][] = [];

    // 125 is '}'
    while (code !== 125) {
        let propName!: string;
        let propNameProvider!: ValueProvider;

        if (!moreToParse) {
            throwError();
        }

        // 46 is '.'
        if (isDecimalDigit() || code == 46) {
            // Numeric literal or dot notation
            propNameProvider = gobbleNumericLiteral();
        } else if (code == 34 || code == 39) {
            // 34 = '"', 39 = "'"
            // String literal
            propName = gobbleStringLiteral();
        } else if (code == 91) {
            // 91 is '['
            // The array syntax can be used to specify a property name
            gobbleSpaces(1);
            propNameProvider = gobbleExpression();

            if ((code as number) != 93) {
                // 93 is ']'
                throwError();
            }

            gobbleSpaces(1);
        } else {
            propName = gobbleIdentifier();
        }

        if (propName) {
            propNameProvider = [() => [propName], []];
        }

        // 58 is ':'
        if (code == 58) {
            gobbleSpaces(1);
            props.push([propNameProvider, gobbleExpression()]);
        } else if (!propName) {
            // If there was a property name provider, then it must be followed by a colon
            throwError();
        } else {
            props.push([
                propNameProvider,
                [root => [root[propName][0]], [propName]],
            ]);
        }

        if (code == 44) {
            // 44 is ','
            gobbleSpaces(1);
        } else if (code !== 125) {
            throwError();
        }
    }

    gobbleSpaces(1);

    return [
        root => {
            const obj: { [key: string]: any } = {};

            for (const [nameProvider, valueProvider] of props) {
                obj[nameProvider[0](root)[0]] = valueProvider[0](root)[0];
            }

            return [obj];
        },
        props.reduce(
            (acc: string[], prop) =>
                uniqueListJoin(acc, [...prop[0][1], ...prop[1][1]]),
            []
        ),
    ];
};
