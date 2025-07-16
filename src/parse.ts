import { memoize, toString, uniqueListJoin } from './util.js';
import { parse, ValueProviderRoot } from './jsep.js';

const splitText = (text: string): null | [any[], string[]] => {
    const textChunks = text.split(/{{(.*?)}}/);

    if (textChunks.length < 2) {
        return null;
    }

    const result: any[] = [];
    let isJs = false;
    let binds: string[] = [];

    for (const textChunk of textChunks) {
        if (isJs) {
            const parsed = parse(textChunk);
            result.push(parsed[0]);
            binds = uniqueListJoin(binds, parsed[1]);
        } else {
            result.push(textChunk);
        }

        isJs = !isJs;
    }

    return [result, binds];
};

const assembleCall = (splitResult: null | [any[], string[]]): ValueProviderRoot | null =>
    splitResult
        ? [
              (roots: object[]) => {
                  return splitResult[0]
                      .map(x => toString(x?.call ? x(roots) : x))
                      .join('');
              },
              splitResult[1],
          ]
        : null;

// Same as parseText, but allows boolean values to be returned.
// See parseText
export const parseTextAllowBoolean = memoize((text: string): ValueProviderRoot | null => {
    const splitResult = splitText(text);
    const first = splitResult?.[0];

    if (
        first?.length === 3 &&
        first[0] === '' &&
        first[2] === ''
    ) {
        return [
            (roots: object[]) => {
                const x = first[1](roots);

                return typeof x === 'boolean' ? x : toString(x);
            },
            splitResult![1],
        ];
    }

    return assembleCall(splitResult);
});

// Parses a string containing expressions wrapped in braces
// Produces an array. [0] is a function that takes a root object and returns
// the generated string. [1] is the list of bindings as an array of strings.
export const parseText = memoize((text: string): ValueProviderRoot | null =>
    assembleCall(splitText(text))
);
