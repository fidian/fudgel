import { bindFn, uniqueListJoin } from './util.js';

// JavaScript Expression Parser (JSEP)
// Based on the NPM package `jsep` by Stephen Oney
//
// All functions starting with "gobble" will remove spaces after getting
// the token or expression it's designed to handle.

type Root = { [key: string]: any };
// [0] is what generates a value
// [1] lists the bound properties off of root that are used
type ValueProvider = [ValueProviderFunction, string[]];
type ValueProviderFunction = (root: Root) => any;

// Global variables used during synchronous parsing.
let expr = ''; // The expression to parse
let index = 0; // Current index
let code = 0; // Char code at the current index

// String literal escape codes that do not map to the same character.
// "\z" maps to "z" and those don't need to be listed.
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
    '-': arg => root => -arg(root),
    '!': arg => root => !arg(root),
    '~': arg => root => ~arg(root),
    '+': arg => root => +arg(root),
};

// Binary operators that take two arguments. Precendence matters for these.
type BinaryOp = [
    number,
    (
        left: ValueProviderFunction,
        right: ValueProviderFunction
    ) => ValueProviderFunction,
];
const binaryOps: { [key: string]: BinaryOp } = {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence
    // 1 Skip: , (comma)
    // 2 Skip: ...x, yield, =>, x?y:z, assignments
    '||': [3, (left, right) => root => left(root) || right(root)],
    '??': [3, (left, right) => root => left(root) ?? right(root)],
    '&&': [4, (left, right) => root => left(root) && right(root)],
    '|': [5, (left, right) => root => left(root) | right(root)],
    '^': [6, (left, right) => root => left(root) ^ right(root)],
    '&': [7, (left, right) => root => left(root) & right(root)],
    '==': [8, (left, right) => root => left(root) == right(root)],
    '!=': [8, (left, right) => root => left(root) != right(root)],
    '===': [8, (left, right) => root => left(root) === right(root)],
    '!==': [8, (left, right) => root => left(root) !== right(root)],
    '<': [9, (left, right) => root => left(root) < right(root)],
    '<=': [9, (left, right) => root => left(root) <= right(root)],
    '>': [9, (left, right) => root => left(root) > right(root)],
    '>=': [9, (left, right) => root => left(root) >= right(root)],
    // 9 Skip: in, instanceof
    '<<': [10, (left, right) => root => left(root) << right(root)],
    '>>': [10, (left, right) => root => left(root) >> right(root)],
    '>>>': [10, (left, right) => root => left(root) >>> right(root)],
    '+': [11, (left, right) => root => left(root) + right(root)],
    '-': [11, (left, right) => root => left(root) - right(root)],
    '*': [12, (left, right) => root => left(root) * right(root)],
    '/': [12, (left, right) => root => left(root) / right(root)],
    '%': [12, (left, right) => root => left(root) % right(root)],
    '**': [13, (left, right) => root => left(root) ** right(root)],
    // 14 Skip: these are unary
    // 15 Skip: these are unary
    // 16 Skip: new
};

// Literals - when encountered, they are replaced with their value.
const literals: { [key: string]: ValueProviderFunction } = {
    true: () => true,
    false: () => false,
    null: () => null,
};

const defaultValueProvider = [() => {}, []] as ValueProvider;

// Parses an expression. Always returns a ValueProvider, which is a tuple:
// [ValueProviderFunction, string[]].  The ValueProviderFunction takes a
// root object for a scope and returns a value.  The string[] is a list of
// bound properties that the ValueProviderFunction uses.
export const parse = (exprToParse: string): ValueProvider => {
    // Assign to a global variable
    expr = exprToParse;

    // Set up index and code (global variables)
    index = 0;
    advance(0);
    gobbleSpaces();

    // Use a default return value
    let result: ValueProvider = defaultValueProvider;

    try {
        // Test for NaN - if this passes, there's more to parse
        if (code == code) {
            result = gobbleExpression() || throwError();
        }

        // Check again at the end
        if (code == code) {
            result = defaultValueProvider;
            throwError();
        }
    } catch (ignore) {}

    return result;
};

// Move to the next character in the expression.
const advance = (n = 1) => {
    index += n;
    code = expr.charCodeAt(index);
};

// Trivial functions for minification
const char = () => expr.charAt(index);
const isDecimalDigit = () => code >= 48 && code <= 57; // 0...9
const isIdentifierStart = () =>
    /* A-Z */ (code >= 65 && code <= 90) ||
    /* a-z */ (code >= 97 && code <= 122) ||
    /* extended */ code >= 128 ||
    /* $ */ code === 36 ||
    /* _ */ code === 95;
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
        code === 32 || // ' '
        code === 9 || // "\t"
        code === 10 || // "\n"
        code === 13 // "\r"
    ) {
        advance();
    }
};

const gobbleExpression = (): ValueProvider | undefined => {
    let node,
        biop,
        biopNext,
        stack: (ValueProvider | BinaryOp)[],
        left,
        right,
        combineLast;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    // Don't gobbleBinaryOp without a left-hand-side
    left = gobbleToken();

    if (!left) {
        return left;
    }

    biop = gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
        return left;
    }

    right = gobbleToken() || throwError();
    stack = [left, biop, right];
    combineLast = () => {
        let right = stack.pop() as ValueProvider;
        let biop = stack.pop() as BinaryOp;
        let left = stack.pop() as ValueProvider;
        stack.push([
            biop[1](left[0], right[0]),
            uniqueListJoin(left[1], right[1]),
        ]);
    };

    // Properly deal with precedence using
    // [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biopNext = gobbleBinaryOp())) {
        // Reduce: make a binary expression from the three topmost entries.
        while (
            stack.length > 2 &&
            biopNext[0] <= (stack[stack.length - 2] as BinaryOp)[0]
        ) {
            combineLast();
        }

        node = gobbleToken() || throwError();
        stack.push(biopNext, node);
    }

    while (stack.length > 1) {
        combineLast();
    }

    return stack[0] as ValueProvider;
};

const gobbleBinaryOp = () => {
    // 3 is the maximum binary operator length
    let to_check = expr.substr(index, 3);
    let tc_len = 3;
    let biop: BinaryOp | undefined;

    while (tc_len > 0) {
        biop = binaryOps[to_check];
        if (biop) {
            break;
        }
        to_check = to_check.substr(0, --tc_len);
    }
    gobbleSpaces(tc_len);
    return biop;
};

const gobbleToken = (): ValueProvider | undefined => {
    let node: ValueProvider;

    // 46 is '.'
    if (isDecimalDigit() || code === 46) {
        // Char code 46 is a dot `.`, which can start off a numeric literal
        return gobbleNumericLiteral();
    }

    if (code === 39 || code === 34) {
        // 39 = "'", 34 = '"'
        // Single or double quotes
        node = gobbleStringLiteral();
    } else {
        // All unary operators are 1 character
        const opFn = unaryOps[char()];

        if (opFn) {
            gobbleSpaces(1);
            const argument = gobbleToken() || throwError();
            return [opFn(argument[0]), argument[1]];
        }

        const identifier = gobbleIdentifier();
        node = literals[identifier]
            ? [literals[identifier], []]
            : [root => bindFn(root, identifier), [identifier]];
    }

    return gobbleTokenProperty(node);
};

const gobbleTokenProperty = (node: ValueProvider): ValueProvider => {
    // '.', '[', '(', '?'
    while (code === 46 || code === 91 || code === 40 || code === 63) {
        let optional: boolean | undefined;
        let action: (value: any, root: Root) => ValueProvider;
        let bindings: string[] = [];
        let prevNode: ValueProvider = node;
        // '?'
        if (code === 63) {
            // Checking for optional chaining
            advance();
            // '.'
            if ((code as any) !== 46) {
                advance(-1);
                return node;
            }
            optional = true;
        }

        // '['
        if (code === 91) {
            gobbleSpaces(1);
            const expression = gobbleExpression() || throwError();
            action = (value, root) => bindFn(value, expression[0](root));
            bindings = expression[1];
            // ']'
            if ((code as any) !== 93) {
                throwError();
            }
            gobbleSpaces(1);
        } else if (code === 40) {
            // '('
            gobbleSpaces(1);
            // A function call is being made; gobble all the arguments
            const args = gobbleArguments();
            action = (value, root) => value(...args.map(arg => arg[0](root)));
            bindings = args.reduce(
                (acc, arg) => uniqueListJoin(acc, arg[1]),
                bindings
            );
        } else if (code === 46) {
            // '.'
            gobbleSpaces(1);
            const identifier = gobbleIdentifier();
            action = value => bindFn(value, identifier);
        } else {
            throwError();
        }

        node = optional
            ? [
                  root => {
                      const value = prevNode[0](root);
                      return value === undefined
                          ? undefined
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
    if (code === 46) {
        // can start with a decimal marker
        number += '.';
        advance();

        while (isDecimalDigit()) {
            number += char();
            advance();
        }
    }

    // e or E
    if (code === 101 || code === 69) {
        // exponent marker
        number += char();
        advance();

        // '+', '-'
        if ((code as any) === 43 || (code as any) === 45) {
            // exponent sign
            number += char();
            advance();
        }

        let needDecimal = true;

        while (isDecimalDigit()) {
            // exponent itself
            number += char();
            advance();
            needDecimal = false;
        }

        if (needDecimal) {
            throwError();
        }
    }

    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart()) {
        throwError();
    } else if (code === 46 || number === '.') {
        // 46 is '.'
        throwError();
    }

    gobbleSpaces();
    const value = parseFloat(number);
    return [() => value, []];
};

const gobbleStringLiteral = (): ValueProvider => {
    let str = '';
    const quote = code;
    advance();

    while (index < expr.length) {
        if (code === quote) {
            break;
        }

        if (code === 92) {
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

    if (index >= expr.length) {
        throwError();
    }

    gobbleSpaces(1);

    return [() => str, []];
};

const gobbleIdentifier = (): string => {
    let start = index;

    if (!isIdentifierStart()) {
        throwError();
    }

    advance();

    while (index < expr.length) {
        if (!isIdentifierStart() && !isDecimalDigit()) {
            break;
        }

        advance();
    }

    const identifier = expr.slice(start, index);
    gobbleSpaces();

    return identifier;
};

const gobbleArguments = (): ValueProvider[] => {
    const args = [];

    // 41 is ')'
    while (code !== 41) {
        if (index >= expr.length) {
            throwError();
        }

        args.push(gobbleExpression() || throwError());
        gobbleSpaces();

        if (code === 44) {
            gobbleSpaces(1);
        } else if (code !== 41) {
            throwError();
        }
    }

    advance();

    return args;
};
