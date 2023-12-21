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
                *for="item of this.pages"
                .label="$scope.item.label"
                .url="$scope.item.url"
                .aliasUrl="$scope.item.aliasUrl"
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
                label: 'Component Creation',
                url: 'component-creation.html',
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
                label: 'Utilities',
                url: 'utilities.html',
            },
        ];
    }
);
