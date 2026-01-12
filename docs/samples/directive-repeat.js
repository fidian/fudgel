import { component } from '/fudgel.min.js';

component(
    'directive-repeat',
    {
        template: `
            <p>5 stars: <span *repeat="5">*</span></p>
            <p>Some stars: <span *repeat="starCount">*</span></p>
        `,
    },
    class {
        starCount = 3;
    }
);
