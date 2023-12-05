import { component, metadataControllerElement } from './fudgel.min.js';
import { cleanText } from './clean-text.js';

component(
    'live-playground',
    {
        style: `
            .wrapper {
                display: flex;
                height: 300px;
            }

            @media (max-width:768px) {
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

            iframe {
                width: 100%;
                height: 100%;
            }
        `,
        template: `
            <div class="wrapper">
                <textarea #ref="code" class="full code" spellcheck="false"></textarea>
                <div #ref="demo" class="full demo"></div>
            </div>
        `,
    },
    class {
        onViewInit() {
            const elem = metadataControllerElement.get(this);
            const template = elem.querySelector('template');

            if (!template) {
                console.error(
                    '<live-playground>:',
                    'Content must be provided inside a <template> tag'
                );
                return;
            }

            this.code.value = cleanText(template.innerHTML);
            this.code.onchange = () => this.scheduleUpdate();
            this.code.onkeyup = () => this.scheduleUpdate();
            this.update();
        }

        update() {
            // Wipe any old iFrame and replace it entirely because
            // custom elements can't be redefined.
            const iframe = document.createElement('iframe');
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
