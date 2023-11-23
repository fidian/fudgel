import { createValueFunction, memoize, toString } from './util';

export const parseText = memoize((text: string, allowRawValue = false) => {
    const chunks = text.split(/{{(.*?)}}/);

    if (chunks.length < 2) {
        return null;
    }

    if (
        allowRawValue &&
        chunks.length === 3 &&
        chunks[0] === '' &&
        chunks[2] === ''
    ) {
        return {
            fn: createValueFunction(text),
            binds: findBindings(chunks[1]),
        };
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

    return {
        fn: function (scope: Object) {
            return portions
                .map(
                    x => (
                        (x = x && x.call ? x.call(this, scope) : x), toString(x)
                    )
                )
                .join('');
        },
        binds,
    };
});

const identifierRegexp =
    /(this)\.((?:\$|_|\p{L}|\p{Nl})(?:\$|_|\p{L}|\p{Nl}|\u200C|\u200D|\p{Mn}|\p{Mc}|\p{Nd})*)/u;

export const findBindings = memoize((text: string) => {
    const binds = new Set<string>();
    const matches = text.split(identifierRegexp);

    for (let i = 1; i < matches.length; i += 3) {
        if (matches[i] === 'this') {
            binds.add(matches[i + 1]);
        }
    }

    return binds;
});
