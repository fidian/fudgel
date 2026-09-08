import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// The lifecycle-order pages under docs/e2e/ must be served exactly as
// written: their whole point is how a classic <script> interleaves with the
// HTML parser. Vite would inject its client into any HTML it serves itself,
// so hand them out raw at /e2e/ instead.
const serveDocsE2E = (): Plugin => ({
    name: 'serve-docs-e2e',
    configureServer(server) {
        server.middlewares.use('/e2e', (req, res, next) => {
            const file = join(import.meta.dirname, 'docs/e2e', (req.url || '').split('?')[0]);
            readFile(file).then(
                data => {
                    res.setHeader(
                        'Content-Type',
                        file.endsWith('.html') ? 'text/html' : 'text/javascript'
                    );
                    res.end(data);
                },
                () => next()
            );
        });
    },
});

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    environment: 'node',
                    include: ['test/unit/**/*.test.ts'],
                },
            },
            {
                plugins: [serveDocsE2E()],
                test: {
                    name: 'browser',
                    include: ['test/browser/**/*.test.ts'],
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
});
