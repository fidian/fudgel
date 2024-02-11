import { createValueFunction, memoize, toString } from './util.js';

export const parseText = memoize((text: string, allowBoolean = false) => {
    const chunks = text.split(/{{(.*?)}}/);

    if (chunks.length < 2) {
        return null;
    }

    const portions: any[] = [];
    let isJs = false;
    const binds = new Set();

    for (const chunk of chunks) {
        if (isJs) {
            portions.push(createValueFunction(chunk));

            for (const bind of findBindings(chunk)) {
                binds.add(bind);
            }
        } else {
            portions.push(chunk);
        }

        isJs = !isJs;
    }

    if (portions.length === 3 && portions[0] === '' && portions[2] === '' && allowBoolean) {
        return {
            fn: function (scope: Object) {
                const x = portions[1].call(this, scope);

                return typeof x === 'boolean' ? x : toString(x);
            },
            binds,
        };
    }

    return {
        // This MUST stay as a function
        fn: function (scope: Object) {
            return portions
                .map(
                    x => (
                        (x = x && x.call ? x.call(this, scope) : x),
                        toString(x)
                    )
                )
                .join('');
        },
        binds,
    };
});

const identifierRegexp =
    /this\.((?:\$|_|\p{L}|\p{Nl})(?:\$|_|\p{L}|\p{Nl}|\u200C|\u200D|\p{Mn}|\p{Mc}|\p{Nd})*)/u;

export const findBindings = memoize((text: string) => {
    const binds = new Set<string>();
    const matches = text.split(identifierRegexp);

    for (let i = 1; i < matches.length; i += 2) {
        binds.add(matches[i]);
    }

    return binds;
});
