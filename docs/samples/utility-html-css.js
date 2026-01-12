import { component, css, html } from './fudgel.min.js';

component('utility-html-css', {
    style: css`
        div {
            font-size: 3em;
            font-weight: bold;
        }
    `,
    template: html` <div>BIG WORDS</div> `,
});
