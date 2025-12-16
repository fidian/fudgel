// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
Promise.all([import('./fudgel.min.js'), import('./hljs.js')]).then(
    ([{ component, controllerToElement, css, emit, html }, { hljs }]) => {
        const cleanText = str => {
            // Handle unescaping escaped text.
            const textarea = document.createElement('textarea');
            textarea.innerHTML = str;
            str = textarea.value;

            // Clean leading spaces using first line's indentation as our key.
            const pattern = str.match(/\s*\n[\t\s]*/);

            if (pattern && pattern[0].match(/[^\n]/)) {
                str = str.replace(new RegExp(pattern, 'g'), '\n');
            }

            // Remove blank lines at the beginning and end
            str = str.trim();

            return str;
        };

        component(
            'code-sample',
            {
                prop: ['type', 'live', 'html'],
                style: css`
                    :host {
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
                        background: var(
                            --code-sample-copy-button-bg-color,
                            #e0e0e0
                        );
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
                template: html`
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
                    <div id="code-container">
                        <button
                            id="copy"
                            title="Copy to clipboard"
                            @click="copyToClipboard()"
                        >
                            {{label}}
                        </button>
                        <button
                            *if="live"
                            id="live"
                            title="See in an editable playground"
                            @click="livePlayground()"
                        >
                            Live Demo
                        </button>
                        <pre #ref="pre"></pre>
                    </div>
                `,
            },
            class {
                constructor() {
                    this.label = 'Copy';
                    this.loaded = false;
                }

                onChange(propName) {
                    if (propName === 'src') {
                        this.loaded = false;
                    }
                }

                loadJson() {
                    const url = new URL(this.src, document.baseURI);
                    return fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            const exampleUrl = new URL(data.source, url);
                            return fetch(url)
                                .then(response => response.text())
                                .then(content => {
                                    return {
                                        ...data,
                                        content,
                                    };
                                });
                        });
                }

                onViewInit() {
                    const codeElement = document.createElement('code');

                    if (this.type) {
                        codeElement.classList.add(`language-${this.type}`);
                    }

                    const textNode = document.createTextNode(this.code);
                    codeElement.appendChild(textNode);
                    this.pre.appendChild(codeElement);
                    hljs.highlightElement(codeElement);
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
                    emit(this, 'toggle');
                }
            }
        );
    }
);
