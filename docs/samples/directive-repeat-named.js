import { component } from '/fudgel.min.js';

component(
    'directive-repeat',
    {
        template: `
            <p>5 indices: <span *repeat="5 as index">
                [{{ index }}]
            </span></p>
            <p>Some numbers: <span *repeat="numberCount as n">
                [{{ n }}]
            </span></p>
        `,
    },
    class {
        numberCount = 3;
    }
);
