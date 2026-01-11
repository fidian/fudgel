import { component, metadata } from '/fudgel.min.js';

component(
    'fudgel-size',
    {
        style: `
            /* This style is SCOPED and does NOT apply
             * to content added by the controller */
            img { display: none; }
        `,
        template: `
            <style>
                /* This style is NOT SCOPED and DOES apply
                 * to content added by the controller plus
                 * ALL other content IN THE WHOLE DOCUMENT */
                img { max-width: 50px; }
            </style>
        `,
    },
    class {
        async onViewInit() {
            // Insert an image to the Fudgel logo
            const img = document.createElement('img');
            img.src = '/logo.png';
            img.alt = 'Fudgel Logo';
            this[metadata].root.appendChild(img);
        }
    }
);
