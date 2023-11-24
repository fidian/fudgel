// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

const Fudgel = window.Fudgel;

Fudgel.component('code-sample', {
    shadow: true,
    style: /* css */`
        :host {
            display: block;
        }

        pre {
            margin: 0;
        }

        pre, code {
            font-family: var(--code-sample-font-family, Operator Mono, Inconsolata, Roboto Mono, monaco, consolas, monospace);
            font-size: var(--code-sample-font-size, 14px);
        }

        .hljs {
            padding: 0 20px;
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
            position: absolute;
            right: 0;
            top: 0;
            text-transform: uppercase;
        }


        /* Colors from oneDark theme */
        .hljs {
            display: block;
            overflow-x: auto;
            color: var(--code-sample-color, #abb2bf);
            background: var(--code-sample-background, #282c34);
        }

        .hljs-comment,
        .hljs-quote {
            color: #5c6370;
            font-style: italic;
        }

        .hljs-doctag,
        .hljs-keyword,
        .hljs-formula {
            color: #c678dd;
        }

        .hljs-section,
        .hljs-name,
        .hljs-selector-tag,
        .hljs-deletion,
        .hljs-subst,
        .hljs-tag {
            color: #e06c75;
        }

        .hljs-literal {
            color: #56b6c2;
        }

        .hljs-string,
        .hljs-regexp,
        .hljs-addition,
        .hljs-attribute,
        .hljs-meta-string {
            color: #98c379;
        }

        .hljs-built_in,
        .hljs-class .hljs-title {
            color: #e6c07b;
        }

        .hljs-attr,
        .hljs-variable,
        .hljs-template-variable,
        .hljs-type,
        .hljs-selector-class,
        .hljs-selector-attr,
        .hljs-selector-pseudo,
        .hljs-number {
            color: #d19a66;
        }

        .hljs-symbol,
        .hljs-bullet,
        .hljs-link,
        .hljs-meta,
        .hljs-selector-id,
        .hljs-title {
            color: #61aeee;
        }

        .hljs-emphasis {
            font-style: italic;
        }

        .hljs-strong {
            font-weight: bold;
        }

        .hljs-link {
            text-decoration: underline;
        }

        .hljs-params {
            color: #e6c07b;
        }
    `,
    template: /* html */`
        <div id="code-container">
            <button
                title="Copy to clipboard"
                @click="return this.copyToClipboard($event)">{{this.label}}</button>
            <pre #ref="pre" id="code"></pre>
        </div>
    `
}, class {
    constructor() {
        Fudgel.attr(this, 'type')
        this.label = 'Copy';
    }

    onViewInit() {
        const content = Fudgel.metadataControllerContent(this);
        const template = content.querySelector('template');

        if (!template) {
            console.error('<code-sample>:', 'Content must be provided inside a <template> tag');
            return;
        }

        const code = document.createElement('code');

        if (this.type) {
            code.classList.add(`language-${this.type}`);
        }

        this.codeStr = this.cleanIndentation(template.innerHTML);
        const textNode = document.createTextNode(this.codeStr);
        code.appendChild(textNode);
        this.pre.appendChild(code);
        window.hljs.highlightElement(code);
    }

    cleanIndentation(str) {
        const pattern = str.match(/\s*\n[\t\s]*/);

        return str.replace(new RegExp(pattern, 'g'), '\n');
    }


    copyToClipboard(event) {
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
});
