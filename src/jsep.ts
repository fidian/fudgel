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
    '-': arg => root => -arg(root),
    '!': arg => root => !arg(root),
    '~': arg => root => ~arg(root),
    '+': arg => root => +arg(root),
    typeof: arg => root => typeof arg(root),
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
    '||': [3, (left, right) => root => left(root) || right(root)],
    '??': [3, (left, right) => root => left(root) ?? right(root)],
    '&&': [4, (left, right) => root => left(root) && right(root)],
    '|': [5, (left, right) => root => left(root) | right(root)], // After ||
    '^': [6, (left, right) => root => left(root) ^ right(root)],
    '&': [7, (left, right) => root => left(root) & right(root)], // After &&
    '===': [8, (left, right) => root => left(root) === right(root)],
    '==': [8, (left, right) => root => left(root) == right(root)], // After ===
    '!==': [8, (left, right) => root => left(root) !== right(root)],
    '!=': [8, (left, right) => root => left(root) != right(root)], // After !==
    '<<': [10, (left, right) => root => left(root) << right(root)], // Forced earlier
    '>>>': [10, (left, right) => root => left(root) >>> right(root)], // Forced earlier
    '>>': [10, (left, right) => root => left(root) >> right(root)], // After >>>
    '<=': [9, (left, right) => root => left(root) <= right(root)], // After <<
    '<': [9, (left, right) => root => left(root) < right(root)], // After <=
    '>=': [9, (left, right) => root => left(root) >= right(root)], // After >>
    '>': [9, (left, right) => root => left(root) > right(root)], // After >
    instanceof: [9, (left, right) => root => left(root) instanceof right(root)],
    in: [9, (left, right) => root => left(root) in right(root)], // After instanceof
    '+': [11, (left, right) => root => left(root) + right(root)],
    '-': [11, (left, right) => root => left(root) - right(root)],
    '**': [13, (left, right) => root => left(root) ** right(root), 1], // right-to-left, forced earlier
    '*': [12, (left, right) => root => left(root) * right(root)], // After *
    '/': [12, (left, right) => root => left(root) / right(root)],
    '%': [12, (left, right) => root => left(root) % right(root)],
    // 14 Skip: these are unary
    // 15 Skip: these are unary
    // 16 Skip: new
};

// Literals - when encountered, they are replaced with their value.
const literals: { [key: string]: any } = {
    true: true,
    false: false,
    null: null,
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
        if (code >= 0) {
            result = gobbleExpression() || throwError();
        }

        // Check again at the end
        if (code >= 0) {
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

const gobbleExpression = (): ValueProvider | undefined => {
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
    for (const item of Object.keys(tokenList)) {
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

const gobbleToken = (): ValueProvider | undefined => {
    let node: ValueProvider;

    // 46 is '.'
    if (isDecimalDigit() || code == 46) {
        // Char code 46 is a dot `.`, which can start off a numeric literal
        return gobbleNumericLiteral();
    }

    if (code == 34 || code == 39) {
        // 34 = '"', 39 = "'"
        // Single or double quotes
        node = gobbleStringLiteral();
    } else {
        const op = gobbleTokenFromList(unaryOps);

        if (op) {
            const argument = gobbleToken() || throwError();
            return [op(argument[0]), argument[1]];
        }

        const identifier = gobbleIdentifier();
        node =
            identifier in literals
                ? [() => literals[identifier], []]
                : [root => bindFn(root, identifier), [identifier]];
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
        let action: (value: any, root: Root) => ValueProvider;
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
            action = (value, root) => bindFn(value, expression[0](root));
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
            const args = gobbleArguments();
            action = (value, root) => value(...args.map(arg => arg[0](root)));
            bindings = args.reduce(
                (acc, arg) => uniqueListJoin(acc, arg[1]),
                bindings
            );
        } else if (code == 46) {
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
    return [() => value, []];
};

const gobbleStringLiteral = (): ValueProvider => {
    let str = '';
    const quote = code;
    advance();

    while (index < expr.length) {
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
        if (!isIdentifierPart()) {
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

        if (code == 44) {
            // 44 is ','
            gobbleSpaces(1);
        } else if (code !== 41) {
            throwError();
        }
    }

    advance();

    return args;
};
