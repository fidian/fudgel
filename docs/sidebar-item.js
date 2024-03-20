import { component, css, html } from './fudgel.min.js';

component(
    'sidebar-item',
    {
        prop: ['url', 'label', 'aliasUrl'],
        style: css`
            :scope {
                display: block;
                padding: 0.5em;
            }
        `,
        template: html` <a href="{{url}}">{{label}}</a> `,
    }
);
