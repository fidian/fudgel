import { component, css, di, html } from './fudgel.js';
import { PlaygroundDataService } from '../playground-data-service.js';

component(
    'live-playground',
    {
        prop: ['playgroundStr'],
        style: css`
            .wrapper {
                display: flex;
                height: 100vh;
                width: 100%;
            }

            .pane {
                align-items: stretch;
                width: 100%;
                height: 100%;
            }

            .code {
                color: #d9e1f0;
                background-color: #282c34;
                padding: 10px;
                resize: none;
                border: 1px solid black;
                box-sizing: border-box;
                flex-grow: 1;
            }

            .demo {
                box-sizing: border-box;
                border: 1px solid black;
            }

            .working-area {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
            }

            .action-buttons {
                align-items: center;
                display: flex;
                justify-content: space-between;
                flex-shrink: 0;
            }

            @media (max-width: 768px) {
                .wrapper {
                    flex-direction: column;
                    height: 160vh;
                }

                .not-small {
                    display: none;
                }
            }
        `,
        template: html`
            <style>
                /* Because the iframe is created dynamically, it won't get the automatic
                 * addition of a class. All of the above styles will be scoped but the
                 * iframe won't be able to pick up any of the styles, so we just add them
                 * here.
                 */
                iframe.livePlayground {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
            <div class="wrapper">
                <div class="pane working-area">
                    <div class="action-buttons">
                        <span>
                            <a href="https://fudgel.js.org/" target="_blank" rel="noopener">Fudgel.js</a>
                            <span class="not-small">Playground</a>
                        </span>
                        <button title="Saves the HTML to your computer" @click="download()">Download</button>
                        <button title="Updates the URL and copies it to your clipboard for easy sharing" @click="share()">{{ shareLabel }}</button>
                        <use-template @content-change="contentChange($event)"></use-template>
                    </div>
                    <textarea
                        #ref="code"
                        @keydown.tab.prevent="tabPressed()"
                        class="code"
                        spellcheck="false"
                    ></textarea>
                </div>
                <div #ref="demo" class="pane demo"></div>
            </div>
        `,
    },
    class {
        playgroundDataService = di(PlaygroundDataService);
        shareLabel = 'Share';
        shareBusy = false;

        async onViewInit() {
            this.playgroundStr = await this.playgroundDataService.fromUriString(
                (document.location.hash || '').slice(1)
            );
            this.code.value = this.playgroundStr;
            this.code.onchange = () => this.scheduleUpdate();
            this.code.onkeyup = () => this.scheduleUpdate();
            this._update();
        }

        tabPressed() {
            const start = this.code.selectionStart;
            const end = this.code.selectionEnd;

            // Set textarea value to: text before caret + tab + text after caret
            this.code.value =
                this.code.value.substring(0, start) +
                '\t' +
                this.code.value.substring(end);

            // Put caret at right position again
            this.code.selectionStart = this.code.selectionEnd = start + 1;

            this.scheduleUpdate();
        }

        scheduleUpdate() {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }

            this.timeout = setTimeout(() => this._update(), 1000);
        }

        download() {
            const blob = new Blob([this.code.value], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fudgel-playground.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        async share() {
            if (this.shareBusy) {
                return;
            }

            this.shareBusy = true;
            const oldLabel = this.shareLabel;
            document.location.hash = await this.playgroundDataService.toUriString(
                this.code.value
            );

            try {
                await navigator.clipboard.writeText(document.location.href);
                this.shareLabel = 'URL Copied!';
            } catch (err) {
                console.error(err);
                this.shareLabel = 'Error';
            }

            setTimeout(() => {
                this.shareLabel = 'Share';
                this.shareBusy = false;
            }, 5000);
        }

        contentChange(event) {
            this.code.value = event.detail;
            this._update();
        }

        _update() {
            if (this.oldValue === this.code.value) {
                return;
            }

            this.oldValue = this.code.value;
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
    }
);
