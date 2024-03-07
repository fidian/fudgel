// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

import {
    component,
    css as css,
    metadataControllerElement,
} from './fudgel.min.js';
import { cleanText } from './clean-text.js';
import { hljs } from './highlight.js';

component(
    'code-sample',
    {
        attr: ['type', 'live', 'html'],
        style: css`
            :scope {
                display: block;
            }

            pre {
                margin: 0;
            }

            pre,
            code {
                font-family: var(
                    --code-sample-font-family,
                    Operator Mono,
                    Inconsolata,
                    Roboto Mono,
                    monaco,
                    consolas,
                    monospace
                );
                font-size: var(--code-sample-font-size, 14px);
            }

            .hljs {
                padding: 20px 20px;
                line-height: var(--code-sample-line-height, 1.3);
            }

            .demo:not(:empty) {
                padding: var(--code-sample-demo-padding, 0 0 20px);
            }

            #code-container {
                position: relative;
            }

            button {
                background: var(--code-sample-copy-button-bg-color, #e0e0e0);
                border: none;
                cursor: pointer;
                display: block;
                padding: 0.2em;
                position: absolute;
                right: 0;
                text-transform: uppercase;
            }

            button#copy {
                top: 0;
            }

            button#live {
                bottom: 0;
            }
        `,
        // Do not use "html" template tag here. Prettier will break the spacing.
        template: `
            <style>
                /* Colors from oneDark theme */
                code-sample .hljs {
                    display: block;
                    overflow-x: auto;
                    color: var(--code-sample-color, #abb2bf);
                    background: var(--code-sample-background, #282c34);
                }

                code-sample .hljs-comment,
                code-sample .hljs-quote {
                    color: #5c6370;
                    font-style: italic;
                }

                code-sample .hljs-doctag,
                code-sample .hljs-keyword,
                code-sample .hljs-formula {
                    color: #c678dd;
                }

                code-sample .hljs-section,
                code-sample .hljs-name,
                code-sample .hljs-selector-tag,
                code-sample .hljs-deletion,
                code-sample .hljs-subst,
                code-sample .hljs-tag {
                    color: #e06c75;
                }

                code-sample .hljs-literal {
                    color: #56b6c2;
                }

                code-sample .hljs-string,
                code-sample .hljs-regexp,
                code-sample .hljs-addition,
                code-sample .hljs-attribute,
                code-sample .hljs-meta-string {
                    color: #98c379;
                }

                code-sample .hljs-built_in,
                code-sample .hljs-class .hljs-title {
                    color: #e6c07b;
                }

                code-sample .hljs-attr,
                code-sample .hljs-variable,
                code-sample .hljs-template-variable,
                code-sample .hljs-type,
                code-sample .hljs-selector-class,
                code-sample .hljs-selector-attr,
                code-sample .hljs-selector-pseudo,
                code-sample .hljs-number {
                    color: #d19a66;
                }

                code-sample .hljs-symbol,
                code-sample .hljs-bullet,
                code-sample .hljs-link,
                code-sample .hljs-meta,
                code-sample .hljs-selector-id,
                code-sample .hljs-title {
                    color: #61aeee;
                }

                code-sample .hljs-emphasis {
                    font-style: italic;
                }

                code-sample .hljs-strong {
                    font-weight: bold;
                }

                code-sample .hljs-link {
                    text-decoration: underline;
                }

                code-sample .hljs-params {
                    color: #e6c07b;
                }
            </style>
            <div *if="!this.useLivePlayground" id="code-container">
                <button
                    id="copy"
                    title="Copy to clipboard"
                    @click="return this.copyToClipboard()">{{this.label}}</button>
                <button
                    *if="this.live"
                    id="live"
                    title="See in an editable playground"
                    @click="return this.livePlayground()">Live Demo</button>
                <pre #ref="pre"></pre>
            </div>
            <live-playground *if="this.useLivePlayground"><template>{{this.playgroundStr}}</template></live-playground>
        `,
    },
    class {
        constructor() {
            this.label = 'Copy';
        }

        onViewInit() {
            const elem = metadataControllerElement.get(this);
            const template = elem.querySelector('template');

            if (!template) {
                console.error(
                    '<code-sample>:',
                    'Content must be provided inside a <template> tag'
                );
                return;
            }

            const code = document.createElement('code');

            if (this.type) {
                code.classList.add(`language-${this.type}`);
            }

            this.codeStr = cleanText(template.innerHTML);
            this.playgroundStr = this.codeStr;

            if (this.type === 'js') {
                this.playgroundStr =
                    `<script type="module">\n${this.playgroundStr}\n</script>\n\n${this.html}`.trim();
            }

            const textNode = document.createTextNode(this.codeStr);
            code.appendChild(textNode);
            this.pre.appendChild(code);
            hljs.highlightElement(code);
        }

        copyToClipboard() {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);
            textarea.value = this.codeStr;
            textarea.select();
            const oldLabel = this.label;

            try {
                document.execCommand('copy', false);
                this.label = 'Done';
            } catch (err) {
                console.error(err);
                this.label = 'Error';
            }

            textarea.remove();
            setTimeout(() => {
                this.label = oldLabel;
            }, 1000);
        }

        livePlayground() {
            this.useLivePlayground = true;
        }
    }
);
