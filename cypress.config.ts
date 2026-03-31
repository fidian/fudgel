import { defineConfig } from 'cypress';

export default defineConfig({
    allowCypressEnv: false,
    component: {
        devServer: {
            bundler: 'vite',
            framework: 'cypress-ct-custom-element' as 'vue',
        },
        includeShadowDom: true,
    },
    e2e: {
        baseUrl: 'http://localhost:8080',
    },
});
