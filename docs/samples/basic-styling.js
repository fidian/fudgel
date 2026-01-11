import { component, css } from '/fudgel.min.js';

component(
    'basic-styling',
    {
        // The "css" template function does nothing to
        // the CSS. It is a simple marker that tells
        // outside tooling that this is CSS and could be
        // minified, such as with
        // vite-plugin-minify-template-literals.
        style: css`
            :host {
                display: inline-block;
                border: 2px solid black;
                padding: 0.5em;
                margin: 0.5em;
                background-color: lightyellow;
            }

            p {
                font-size: 2em;
                color: darkblue;
            }
        `,
        template: `
            <p>This paragraph is styled with basic styling.</p>
        `,
    }
);
