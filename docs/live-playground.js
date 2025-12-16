import('./fudgel.min.js').then(
    ({ component, css, emit, html }) => {
        component(
            'live-playground',
            {
                prop: ['playgroundStr'],
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
                onViewInit() {
                    this.code.value = this.playgroundStr;
                    this.code.onchange = () => this.scheduleUpdate();
                    this.code.onkeyup = () => this.scheduleUpdate();
                    this.update();
                }

                update() {
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
