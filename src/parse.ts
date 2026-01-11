import { toString } from './util.js';
import { jsep, ValueProviderRoot } from './jsep.js';
import { newSet } from './sets.js';

/**
 * Simplistic memoize for single-argument functions.
 */
const memoize = <IN, OUT>(fn: (arg: IN) => OUT): ((arg: IN) => OUT) => {
    const cache = new Map<IN, OUT>();

    return (arg: IN): OUT =>
        cache.has(arg) ? cache.get(arg)! : cache.set(arg, fn(arg)).get(arg)!;
};


/**
 * Split text with embedded expressions wrapped in {{ and }}.
 *
 * Returns null if no expressions found.
 *
 * Returns an array of two elements otherwise.
 * [0] is an array that alternates between strings and functions to generate content.
 * [1] is a set of binding strings.
 */
const splitText = (text: string): null | [any[], Set<string>] => {
    const textChunks = text.split(/{{(.*?)}}/s);

    if (textChunks.length < 2) {
        return null;
    }

    const result: any[] = [];
    let isJs = false;
    let binds = newSet<string>();

    for (const textChunk of textChunks) {
        if (isJs) {
            const parsed = parse.js(textChunk);
            result.push(parsed[0]);
            binds = newSet(binds, parsed[1]);
        } else {
            result.push(textChunk);
        }

        isJs = !isJs;
    }

    return [result, binds];
};

const assembleCall = (
    splitResult: null | [any[], Set<string>]
): ValueProviderRoot | null =>
    splitResult
        ? [
              (...roots: object[]) =>
                  splitResult[0]
                      .map(x => toString(x?.call ? x(...roots) : x))
                      .join(''),
              splitResult[1],
          ]
        : null;

// Same as parseText, but allows boolean values to be returned.
// See parseText
const parseAttr = (text: string): ValueProviderRoot | null => {
    const splitResult = splitText(text);
    const first = splitResult?.[0];

    if (first?.length == 3 && first[0] == '' && first[2] == '') {
        return [
            (...roots: object[]) => {
                const x = first[1](...roots) ?? false;

                return x === !!x ? x : toString(x);
            },
            splitResult![1],
        ];
    }

    return assembleCall(splitResult);
};

// Parses a string containing expressions wrapped in braces
// Produces an array. [0] is a function that takes a root object and returns
// the generated string. [1] is the list of bindings as an array of strings.
const parseText = (text: string): ValueProviderRoot | null =>
    assembleCall(splitText(text));

// Parsing functions with memoization for speed.
// Either returns null for an unparsable string or a ValueProviderRoot.
// ValueProviderRoot is an array where [0] is a function that takes a root object
// and returns a value, and [1] is an array of binding strings.
export const parse = {
    attr: memoize(parseAttr), // Like .text() but can also return booleans
    js: memoize(jsep), // Parses JavaScript and returns any value
    text: memoize(parseText), // Returns string values
};
