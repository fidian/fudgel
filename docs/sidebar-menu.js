import { component, css, html } from './fudgel.min.js';

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
        pages = [
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
                label: 'GitHub',
                url: 'https://github.com/fidian/fudgel'
            }
        ];
    }
);
