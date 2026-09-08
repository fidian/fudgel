import { resolve } from 'node:path';

// The dev module must share the library's singletons (its event emitter,
// component registry and expression parser), so the library stays an
// external import of 'fudgel' rather than being bundled in a second time.
const library = resolve('dist/fudgel.js');

export default {
    input: 'dist/dev.js',
    external: id => id == library,
    // Keep the external absolute so `paths` can turn it into the bare name.
    makeAbsoluteExternalsRelative: false,
    output: {
        file: 'dist/fudgel-dev.mjs',
        format: 'esm',
        paths: { [library]: 'fudgel' },
    },
};
