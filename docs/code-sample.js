// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
Promise.all([
    import('./fudgel.min.js'),
    import('./hljs.js'),
]).then(
    ([
        { component, css, html, metadataControllerElement, rootElement },
        { hljs },
    ]) => {
        const cleanText = (str) => {
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
                attr: ['type', 'live', 'html'],
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
            <div *if="!useLivePlayground" id="code-container">
                <button
                    id="copy"
                    title="Copy to clipboard"
                    @click="copyToClipboard()">{{label}}</button>
                <button
                    *if="live"
                    id="live"
                    title="See in an editable playground"
                    @click="livePlayground()">Live Demo</button>
                <pre #ref="pre"></pre>
            </div>
            <live-playground *if="useLivePlayground"><template>{{playgroundStr}}</template></live-playground>
        `,
            },
            class {
                constructor() {
                    this.label = 'Copy';
                }

                onInit() {
                    const elem = metadataControllerElement.get(this);
                    const template = elem.querySelector('template');

                    if (!template) {
                        console.error(
                            '<code-sample>:',
                            'Content must be provided inside a <template> tag'
                        );
                        return;
                    }

                    const codeElement = document.createElement('code');

                    if (this.type) {
                        codeElement.classList.add(`language-${this.type}`);
                    }

                    this.codeStr = cleanText(template.innerHTML);
                    this.playgroundStr = this.codeStr;

                    if (this.type === 'js') {
                        this.playgroundStr =
                            `<script type="module">\n${this.playgroundStr}\n</script>\n\n${this.html}`.trim();
                    }

                    const textNode = document.createTextNode(this.codeStr);
                    codeElement.appendChild(textNode);
                    this.codeElement = codeElement;
                }

                onViewInit() {
                    this.pre.appendChild(this.codeElement);
                    hljs.highlightElement(this.codeElement);
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

        component(
            'live-playground',
            {
                style: css`
                    .wrapper {
                        display: flex;
                        height: 300px;
                        width: 100%;
                        overflow: none;
                    }

                    @media (max-width: 768px) {
                        .wrapper {
                            flex-direction: column;
                            height: 600px;
                        }
                    }

                    .full {
                        height: 100%;
                        width: 100%;
                        resize: none;
                        border: 1px solid black;
                    }

                    .code {
                        color: #d9e1f0;
                        background-color: #282c34;
                        padding: 10px;
                    }

                    .demo {
                        box-sizing: border-box;
                        border: 1px solid black;
                    }
                `,
                template: html`
                    <style>
                        iframe.livePlayground {
                            width: 100%;
                            height: 100%;
                        }
                    </style>
                    <div class="wrapper">
                        <textarea
                            #ref="code"
                            class="full code"
                            spellcheck="false"
                        ></textarea>
                        <div #ref="demo" class="full demo"></div>
                    </div>
                `,
            },
            class {
                onInit() {
                    const elem = rootElement(this);
                    this.template = elem.querySelector('template');

                    if (!this.template) {
                        console.error(
                            '<live-playground>:',
                            'Content must be provided inside a <template> tag'
                        );
                        return;
                    }
                }

                onViewInit() {
                    this.code.value = cleanText(this.template.innerHTML);
                    this.code.onchange = () => this.scheduleUpdate();
                    this.code.onkeyup = () => this.scheduleUpdate();
                    this.update();
                }

                update() {
                    // Wipe any old iFrame and replace it entirely because
                    // custom elements can't be redefined.
                    const iframe = document.createElement('iframe');
                    iframe.classList.add('livePlayground');
                    this.demo.innerHTML = '';
                    this.demo.append(iframe);
                    const iframeDocument = iframe.contentWindow.document;
                    iframeDocument.open();
                    iframeDocument.writeln(this.code.value);
                    iframeDocument.close();
                }

                scheduleUpdate() {
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                    }

                    this.timeout = setTimeout(() => this.update(), 1000);
                }
            }
        );
    }
);
