import { CachingFetchService } from './caching-fetch-service.js';
import { component, css, di, html } from './fudgel.min.js';
import { PlaygroundDataService } from '../playground-data-service.js';
import { SampleService } from './sample-service.js';

component(
    'playground-button',
    {
        attr: ['sample', 'js'],
        style: css`
            a {
                background: #e0e0e0;
                border: none;
                cursor: pointer;
                display: block;
                padding: 0.2em;
                text-transform: uppercase;
                text-decoration: none;
                color: #000;
                font-size: 14px;
            }
        `,
        template: html`
            <a
                *if="content"
                href="/playground/#{{encoded}}" target="_blank" rel="noopener"
            >
                Playground
            </a>
        `,
    },
    class {
        cachingFetchService = di(CachingFetchService);
        playgroundDataService = di(PlaygroundDataService);
        sampleService = di(SampleService);

        onChange(propName) {
            if (propName === 'sample' && this.sample) {
                this.loadSample(this.sample);
            }

            if (propName === 'js' && this.js) {
                this.loadJs(this.js);
            }
        }

        async loadSample(url) {
            const { meta, content } = await this.sampleService.getSample(url);

            if (meta.type === 'js') {
                this.content = `<script type="module">
${content.trim()}
</script>

${meta.html || ''}
`.trim();
            } else {
                this.content = content;
            }

            this.setEncoded();
        }

        async loadJs(url) {
            const content = await this.cachingFetchService.fetchText(url);
            const match = content.match(/playground-html: (.*)/);
            const html = match ? match[1] : '';

            this.content = `<script type="module">
${content.replace(/.*playground-html: .*/g, '').trim()}
</script>

${html}`.trim();

            this.setEncoded();
        }

        async setEncoded() {
            this.encoded = await this.playgroundDataService.toUriString(this.content);
        }
    }
);
