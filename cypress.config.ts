import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            bundler: 'vite',
            // In order for TypeScript to not complain, we lie here.
            framework: 'cypress-ct-custom-elements' as 'vue',
        },
        includeShadowDom: true,
    },
});
