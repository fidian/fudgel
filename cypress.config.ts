import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            bundler: 'vite',
            framework: 'cypress-ct-custom-elements',
            includeShadowDom: true,
        },
    },
});
