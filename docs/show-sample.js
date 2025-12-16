// Reimplementation of code-sample from @kcmr using Fudgel. Portions have been
// removed because this isn't a general-purpose element and will only be
// featured on Fudgel's site.
// https://github.com/kcmr/code-sample

// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
Promise.all([import('./fudgel.min.js'), import('./hljs.js')]).then(
    ([
        { component, css, html, controllerToElement, rootElement },
        { hljs },
    ]) => {
        component(
            'show-sample',
            {
                attr: ['src'],
                template: html`
                    <code-sample
                        *if="loaded && !playground"
                        @toggle="toggle()"
                        .type="type"
                        .live="live"
                        .html="html"
                        .code="code"
                    ></code-sample>
                    <live-playground
                        *if="loaded && playground"
                        @toggle="toggle()"
                        .playground-str="playgroundStr"
                    ></live-playground>
                `,
            },
            class {
                constructor() {
                    this.loaded = false;
                }

                onChange(propName) {
                    if (propName !== 'src') {
                        return;
                    }

                    const url = new URL(this.src, document.baseURI);

                    return fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            this.type = data.type || 'text';
                            this.html = data.html || '';
                            this.live = data.live || false;
                        })
                        .then(() => new URL(this.src, document.baseURI))
                        .then(url => fetch(url))
                        .then(response => response.text())
                        .then(content => {
                            this.code = content;

                            if (this.type === 'js') {
                                this.playgroundStr =
                                    `<script type="module">\n${result.content}\n</script>\n\n${result.html}`.trim();
                            } else {
                                this.playgroundStr = result.content;
                            }

                            this.loaded = true;
                        });
                }

                toggle() {
                    this.playground = !this.playground;
                }
            }
        );
    }
);
