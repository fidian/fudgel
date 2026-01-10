// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
import { component, css, di, emit, html } from './fudgel.min.js';
import { hljs } from './hljs.js';
import { SampleService } from './sample-service.js';

component(
    'code-sample',
    {
        attr: ['sample'],
        style: css`
            :host {
                display: block;
            }

            pre {
                margin: 0;
            }

            pre,
            code {
                font-family: 'Anonymous Pro', monospace;
            }

            .hljs {
                padding: 20px 20px;
                line-height: 1.3;
            }

            .demo:not(:empty) {
                padding: 0 0 20px;
            }

            #code-container {
                position: relative;
            }

            button {
                font-size: 14px;
                background: #e0e0e0;
                border: none;
                cursor: pointer;
                display: block;
                padding: 0.2em;
                text-transform: uppercase;
            }

            playground-button, button {
                position: absolute;
                right: 0;
            }

            button#copy {
                top: 0;
            }

            playground-button {
                bottom: 0;
            }

            .main-box {
                padding: 0.5em;
                background-color: #282c34;
                border: 1px solid black;
            }
        `,
        template: html`
            <link rel="stylesheet" href="code-sample.css">
            <div *if="loaded" id="code-container">
                <pre class="main-box" #ref="pre"></pre>
                <button
                    id="copy"
                    title="Copy to clipboard"
                    @click="copyToClipboard()"
                >
                    {{label}}
                </button>
                <playground-button
                    *if="meta.live"
                    sample="{{sample}}"
                ></playground-button>
            </div>
        `,
        useShadow: true,
    },
    class {
        label = 'Copy';
        copyBusy = false;
        sampleService = di(SampleService);

        constructor() {
            this.label = 'Copy';
            this.loaded = false;
        }

        async onChange(propName) {
            if (propName !== 'sample') {
                return;
            }

            const { meta, content } = await this.sampleService.getSample(this.sample);
            this.meta = meta;
            this.code = content;

            if (this.meta.type === 'js') {
                this.playgroundStr =
                    `<script type="module">\n${content}\n</script>\n\n${meta.html}`.trim();
            } else {
                this.playgroundStr = result.content;
            }

            this.loaded = true;
            const codeElement = document.createElement('code');

            if (this.meta.type) {
                codeElement.classList.add(`language-${this.meta.type}`);
            }

            const textNode = document.createTextNode(this.code);
            codeElement.appendChild(textNode);
            this.pre.appendChild(codeElement);
            hljs.highlightElement(codeElement);
        }

        setContent() {
            if (!this.loaded || !this.viewInit) {
                return;
            }
        }

        async copyToClipboard() {
            if (this.copyBusy) {
                return;
            }

            this.copyBusy = true;
            const oldLabel = this.label;

            try {
                await navigator.clipboard.writeText(this.codeStr);
                this.label = 'Done';
            } catch (err) {
                console.error(err);
                this.label = 'Error';
            }

            setTimeout(() => {
                this.label = oldLabel;
            }, 1000);
        }

        livePlayground() {
            console.log('pending');
        }
    }
);
