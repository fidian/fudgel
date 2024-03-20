import { bindFn, uniqueListJoin } from './util.js';

// JavaScript Expression Parser (JSEP)
// Based on the NPM package `jsep` by Stephen Oney

type Root = { [key: string]: any };
// [0] is what generates a value
// [1] lists the bound properties off of root that are used
type ValueProvider = [ValueProviderFunction, string[]];
type ValueProviderFunction = (root: Root) => any;

let expr = '';
let index = 0;
let code = 0;

const escapeCodes: { [key: string]: string } = {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
};
const unaryOps: { [key: string]: (arg: ValueProviderFunction) => ValueProviderFunction} = {
    '-': (arg) => (root) => -arg(root),
    '!': (arg) => (root) => !arg(root),
    '~': (arg) => (root) => ~arg(root),
    '+': (arg) => (root) => +arg(root),
};
// [precedence, ValueProviderGenerator]
type BinaryOp = [number, (left: ValueProviderFunction, right: ValueProviderFunction) => ValueProviderFunction];
const binaryOps: { [key: string]: BinaryOp } = {
    '||': [1, (left, right) => (root) => left(root) || right(root)],
    '&&': [2, (left, right) => (root) => left(root) && right(root)],
    '|': [3, (left, right) => (root) => left(root) | right(root)],
    '^': [4, (left, right) => (root) => left(root) ^ right(root)],
    '&': [5, (left, right) => (root) => left(root) & right(root)],
    '==': [6, (left, right) => (root) => left(root) == right(root)],
    '!=': [6, (left, right) => (root) => left(root) != right(root)],
    '===': [6, (left, right) => (root) => left(root) === right(root)],
    '!==': [6, (left, right) => (root) => left(root) !== right(root)],
    '<': [7, (left, right) => (root) => left(root) < right(root)],
    '>': [7, (left, right) => (root) => left(root) > right(root)],
    '<=': [7, (left, right) => (root) => left(root) <= right(root)],
    '>=': [7, (left, right) => (root) => left(root) >= right(root)],
    '<<': [8, (left, right) => (root) => left(root) << right(root)],
    '>>': [8, (left, right) => (root) => left(root) >> right(root)],
    '>>>': [8, (left, right) => (root) => left(root) >>> right(root)],
    '+': [9, (left, right) => (root) => left(root) + right(root)],
    '-': [9, (left, right) => (root) => left(root) - right(root)],
    '*': [10, (left, right) => (root) => left(root) * right(root)],
    '/': [10, (left, right) => (root) => left(root) / right(root)],
    '%': [10, (left, right) => (root) => left(root) % right(root)],
};
const literals: { [key: string]: ValueProviderFunction } = {
    true: () => true,
    false: () => false,
    null: () => null,
};
export const parse = (exprToParse: string): ValueProvider => {
    expr = exprToParse;
    index = 0;
    advance(0);
    let result: ValueProvider = [() => {}, []];

    try {
        result = gobbleExpression() || throwError();
    } catch (ignore) {
    }

    return result;
};

const advance = (n = 1) => {
    index += n;
    code = expr.charCodeAt(index);
};
const char = () => expr.charAt(index);
const isDecimalDigit = (ch: number) => ch >= 48 && ch <= 57; // 0...9
const isIdentifierStart = (ch: number) =>
    /* A-Z */(ch >= 65 && ch <= 90) ||
    /* a-z */ (ch >= 97 && ch <= 122) ||
    /* extended */ (ch >= 128) ||
    /* $ */ ch === 36 ||
    /* _ */ ch === 95;
const throwError = () => {
    const err = `Parse error at index ${index}: ${expr}`;
    console.error(err);

    throw new Error(err);
};
const gobbleSpaces = () => {
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
    const node = gobbleBinaryExpression();
    gobbleSpaces();

    return node;
};
const gobbleBinaryOp = () => {
    gobbleSpaces();
    // 3 is the maximum binary operator length
    let to_check = expr.substr(index, 3);
    let tc_len = 3;
    let biop: BinaryOp | undefined;

    while (tc_len > 0) {
        biop = binaryOps[to_check];
        if (biop) {
            advance(tc_len);
            break;
        }
        to_check = to_check.substr(0, --tc_len);
    }
    return biop;
};
const gobbleBinaryExpression = () => {
    let node, biop, biopNext, stack, left, right, combineLast;

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
        stack.push([biop[1](left[0], right[0]), uniqueListJoin(left[1], right[1])]);
    };

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biopNext = gobbleBinaryOp())) {
        // Reduce: make a binary expression from the three topmost entries.
        while (stack.length > 2 && biopNext[0] <= (stack[stack.length - 2] as BinaryOp)[0]) {
            combineLast();
        }

        node = gobbleToken() || throwError();
        stack.push(biopNext, node);
    }

    while (stack.length > 1) {
        combineLast();
    }

    return node;
};

const gobbleToken = (): ValueProvider => {
    let node: ValueProvider;

    gobbleSpaces();

    // 46 is '.'
    if (isDecimalDigit(code) || code === 46) {
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
            advance();
            const argument = gobbleToken() || throwError();
            return [opFn(argument[0]), argument[1]];
        }

        if (!isIdentifierStart(code)) {
            throwError();
        }

        const identifier = gobbleIdentifier();
        node = literals[identifier] ?
            [literals[identifier], []] :
            [(root) => bindFn(root, identifier), [identifier]];
    }

    return gobbleTokenProperty(node);
};

const gobbleTokenProperty = (node: ValueProvider): ValueProvider => {
    gobbleSpaces();

    // '.', '[', '(', '?'
    while (
        code === 46 ||
        code === 91 ||
        code === 40 ||
        code === 63
    ) {
        let optional: boolean | undefined;
        let action: (value: any, root: Root) => ValueProvider;
        let bindings: string[] = [];
        let prevNode: ValueProvider = node;
        // '?'
        if (code === 63) {
            advance();
            gobbleSpaces();
            if ((code as any) !== 46) {
                throwError();
            }
            optional = true;
        }

        // '['
        if (code === 91) {
            advance();
            const expression = gobbleExpression() || throwError();
            action = (value, root) => bindFn(value, expression[0](root));
            bindings = expression[1];
            // ']'
            if ((code as any) !== 93) {
                throwError();
            }
            advance();
        } else if (code === 40) {
            // '('
            advance();
            // A function call is being made; gobble all the arguments
            const args = gobbleArguments();
            action = (value, root) => value(...args.map((arg) => (arg[0])(root)));
            bindings = args.reduce((acc, arg) => uniqueListJoin(acc, arg[1]), bindings);
        } else if (code === 46) {
            // '.'
            advance();
            gobbleSpaces();
            const identifier = gobbleIdentifier();
            action = (value) => bindFn(value, identifier);
        } else {
            throwError();
        }

        node = optional ?
            [(root) => {
                const value = prevNode[0](root);
                return value === undefined ? undefined : action(value, root);
            }, uniqueListJoin(prevNode[1], bindings)] :
            [(root) => action(prevNode[0](root), root), uniqueListJoin(prevNode[1], bindings)];

        gobbleSpaces();
    }

    return node;
};

const gobbleNumericLiteral = (): ValueProvider => {
    let number = '';

    while (isDecimalDigit(code)) {
        number += char();
        advance();
    }

    // '.'
    if (code === 46) {
        // can start with a decimal marker
        number += '.';
        advance();

        while (isDecimalDigit(code)) {
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

        while (isDecimalDigit(code)) {
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
    if (isIdentifierStart(code)) {
        throwError();
    } else if (
        code === 46 || number === '.'
    ) {
        // 46 is '.'
        throwError();
    }

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

    advance();

    return [() => str, []];
};

const gobbleIdentifier = (): string => {
    let start = index;

    if (isIdentifierStart(code)) {
        advance();
    } else {
        throwError();
    }

    while (index < expr.length) {
        if (!isIdentifierStart(code) && !isDecimalDigit(code)) {
            break;
        }
        advance();
    }

    return expr.slice(start, index);
};

const gobbleArguments = (): ValueProvider[] => {
    const args = [];
    gobbleSpaces();

    // 41 is ')'
    while (code !== 41) {
        if (index >= expr.length) {
            throwError();
        }

        args.push(gobbleExpression() || throwError());
        gobbleSpaces();

        if (code === 44) {
            advance();
            gobbleSpaces();
        } else if (code !== 41) {
            throwError();
        }
    }

    advance();

    return args;
};
