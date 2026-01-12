import { component } from '/fudgel.min.js';

component(
    'inner-html',
    {
        template: `<div .inner-h-t-m-l="unsafeHtml"></div>`,
    },
    class {
        unsafeHtml = `
            <h2>Unsafe Inner HTML Example</h2>
            <p>This content was set using <code>innerHTML</code>.</p>
        `;
    }
);
