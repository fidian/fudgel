// This odd syntax is to allow more browsers to be able to use this
// file. It would be better to use "import" statements instead.
import('./fudgel.min.js').then(({ component, css, html }) => {
    component(
        'page-wrapper',
        {
            style: css`
                :host {
                    display: flex;
                    width: 100%;
                    max-width: 100%;
                }

                .sidebar {
                    width: 25%;
                    flex-shrink: 0;
                }

                .content {
                    width: 100%;
                    flex-shrink: 1;
                    overflow: hidden;
                }

                .limitWidth {
                    width: 100%;
                    max-width: 1024px;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        width: 20%;
                        min-width: 135px;
                    }
                }
            `,
            template: html`
                <div class="sidebar">
                    <sidebar-menu></sidebar-menu>
                </div>
                <div class="content">
                    <div class="limitWidth">
                        <slot></slot>
                    </div>
                </div>
            `,
            useShadow: true,
        }
    );

    component('sidebar-item', {
        prop: ['url', 'label', 'aliasUrl'],
        style: css`
            :host {
                display: block;
                padding: 0.5em;
            }
        `,
        template: html` <a href="{{url}}">{{label}}</a> `,
    });

    component(
        'sidebar-menu',
        {
            style: css`
                :host {
                    display: flex;
                    flex-direction: column;
                }
            `,
            template: html`
                <sidebar-item
                    *for="item of pages"
                    .label="item.label"
                    .url="item.url"
                    .alias-url="item.aliasUrl"
                ></sidebar-item>
            `,
        },
        class {
            constructor() {
                this.pages = [
                    {
                        label: 'Welcome',
                        url: 'index.html',
                        aliasUrl: '',
                    },
                    {
                        label: 'Getting Started',
                        url: 'getting-started.html',
                    },
                    {
                        label: 'Component Basics',
                        url: 'component-basics.html',
                    },
                    {
                        label: 'Attr and Prop',
                        url: 'attr-and-prop.html',
                    },
                    {
                        label: 'Directives',
                        url: 'directives.html',
                    },
                    {
                        label: 'Lifecycle Methods',
                        url: 'lifecycle-methods.html',
                    },
                    {
                        label: 'Content Projection',
                        url: 'content-projection.html',
                    },
                    {
                        label: 'Routing',
                        url: 'routing.html',
                    },
                    {
                        label: 'Utilities',
                        url: 'utilities.html',
                    },
                    {
                        label: 'Examples',
                        url: 'examples.html',
                    },
                    {
                        label: 'GitHub',
                        url: 'https://github.com/fidian/fudgel',
                    },
                ];
            }
        }
    );
});
