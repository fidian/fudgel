import { component, css, html, prop } from './fudgel.min.js';

component(
    'sidebar-item',
    {
        style: css`
            :host {
                display: block;
                padding: 0.5em;
            }
        `,
        template: html` <a href="{{this.url}}">{{this.label || '?'}}</a> `,
    },
    class {
        constructor() {
            prop(this, 'url');
            prop(this, 'label');
            prop(this, 'aliasUrl');
        }
    }
);
